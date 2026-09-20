import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { DataStore } from "@/lib/data/store";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In development / demo when raw webhook secret is not configured
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = (session.metadata?.plan || "monthly") as "monthly" | "yearly";
        if (userId) {
          await DataStore.updateSubscriptionPlan(userId, plan);
          await DataStore.logAudit({
            action: "SUBSCRIPTION_CREATED",
            entity: "subscriptions",
            entityId: session.id,
            metadata: { userId, plan, amount: session.amount_total },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await DataStore.logAudit({
          action: `STRIPE_${event.type.toUpperCase()}`,
          entity: "subscriptions",
          entityId: sub.id,
          metadata: { status: sub.status },
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await DataStore.logAudit({
          action: "PAYMENT_FAILED",
          entity: "invoices",
          entityId: invoice.id,
          metadata: { customer: invoice.customer },
        });
        break;
      }
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
