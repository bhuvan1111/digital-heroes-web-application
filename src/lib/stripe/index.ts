import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_mock_key";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-09-30.acacia" as unknown as Stripe.LatestApiVersion,
  typescript: true,
});

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || "price_monthly_mock",
  yearly: process.env.STRIPE_PRICE_YEARLY || "price_yearly_mock",
};
