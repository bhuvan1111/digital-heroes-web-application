import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authenticated Supabase user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = body.plan;

    // 2. Verify requested plan
    if (plan !== "monthly" && plan !== "yearly") {
      return NextResponse.json(
        { error: "Invalid subscription plan. Must be 'monthly' or 'yearly'." },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const priceId = plan === "yearly" ? STRIPE_PRICES.yearly : STRIPE_PRICES.monthly;

    // 3. Create or reuse Stripe customer if live key is active
    if (
      process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes("placeholder") &&
      !process.env.STRIPE_SECRET_KEY.includes("****")
    ) {
      let customerId: string | undefined;

      if (user.email) {
        const existingCustomers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        } else {
          const newCustomer = await stripe.customers.create({
            email: user.email,
            metadata: {
              supabase_uid: user.id,
            },
          });
          customerId = newCustomer.id;
        }
      }

      // 4. Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        // 5. Put authenticated user ID and plan in Stripe metadata
        metadata: {
          userId: user.id,
          plan,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            plan,
          },
        },
        success_url: `${origin}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${origin}/dashboard/subscription?status=cancelled`,
      });

      // 6. Return checkout URL (no subscription created here)
      return NextResponse.json({ url: session.url });
    }

    // If Stripe API key is in placeholder/test mode, return checkout session placeholder URL
    return NextResponse.json({
      url: `${origin}/dashboard/subscription?status=test_checkout_ready&plan=${plan}`,
    });
  } catch (err: unknown) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
