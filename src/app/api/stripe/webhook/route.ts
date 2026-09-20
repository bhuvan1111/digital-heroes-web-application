import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | "lapsed" | "trialing" | "incomplete" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "unpaid":
    case "paused":
      return "lapsed";
    default:
      return "incomplete";
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  // In production, Stripe signature verification is mandatory
  if (process.env.NODE_ENV === "production") {
    if (!webhookSecret || !signature) {
      console.error("Stripe webhook error: Missing signature or webhook secret in production");
      return NextResponse.json(
        { error: "Webhook signature verification required in production" },
        { status: 400 }
      );
    }
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }
  } else {
    // Local development / test mode fallback
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.warn("Dev webhook signature check failed, falling back to parsed body:", err);
        event = JSON.parse(body) as Stripe.Event;
      }
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = (session.metadata?.plan || "monthly") as "monthly" | "yearly";
        const customerId =
          (typeof session.customer === "string" ? session.customer : session.customer?.id) || "";
        const subscriptionId =
          (typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id) || null;

        if (userId) {
          const { error: subError } = await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan,
              status: "active",
              amount_cents: session.amount_total || (plan === "yearly" ? 39000 : 3900),
              currency: session.currency || "usd",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + (plan === "yearly" ? 365 : 30) * 86400000
              ).toISOString(),
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          if (subError) {
            console.error("Failed to upsert subscription on checkout completion:", subError);
          }

          await supabase.from("audit_logs").insert({
            id: crypto.randomUUID(),
            action: "STRIPE_CHECKOUT_COMPLETED",
            entity: "subscriptions",
            entity_id: session.id,
            metadata: { userId, plan, amount: session.amount_total, customerId, subscriptionId },
            created_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        let userId = sub.metadata?.userId;
        if (!userId) {
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          userId = existingSub?.user_id;
        }

        if (userId) {
          const plan: "monthly" | "yearly" =
            sub.metadata?.plan === "yearly" ||
            sub.items?.data[0]?.price?.recurring?.interval === "year"
              ? "yearly"
              : "monthly";

          const mappedStatus = mapStripeStatus(sub.status);
          const amountCents =
            sub.items?.data[0]?.price?.unit_amount || (plan === "yearly" ? 39000 : 3900);

          const { error: subError } = await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              plan,
              status: mappedStatus,
              amount_cents: amountCents,
              currency: sub.currency || "usd",
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          if (subError) {
            console.error("Failed to upsert subscription on subscription event:", subError);
          }

          await supabase.from("audit_logs").insert({
            id: crypto.randomUUID(),
            action: `STRIPE_${event.type.toUpperCase().replace(/\./g, "_")}`,
            entity: "subscriptions",
            entity_id: sub.id,
            metadata: { userId, status: sub.status, mappedStatus, plan },
            created_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

        if (customerId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          await supabase.from("audit_logs").insert({
            id: crypto.randomUUID(),
            action: "STRIPE_PAYMENT_FAILED",
            entity: "invoices",
            entity_id: invoice.id,
            metadata: { customer: customerId, attemptCount: invoice.attempt_count },
            created_at: new Date().toISOString(),
          });
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
