"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { Subscription, UserProfile } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function DashboardSubscriptionPage() {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadSub = React.useCallback(async () => {
    try {
      const user = await DataStore.getCurrentUser();
      if (!user) return;
      setCurrentUser(user);
      const sub = await DataStore.getUserSubscription(user.id);
      if (sub) setSubscription(sub);
    } catch (err) {
      console.error("Failed to load subscription", err);
    }
  }, []);

  React.useEffect(() => {
    loadSub();
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("status") === "success") {
        setFeedback("Stripe checkout completed! Your subscription is synchronizing via secure webhook.");
        setTimeout(() => setFeedback(null), 5000);
      }
    }
  }, [loadSub]);

  const handlePlanSwitch = async (newPlan: "monthly" | "yearly") => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to initiate Stripe Checkout");
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Failed to switch plan", err);
      alert(err instanceof Error ? err.message : "Failed to launch Stripe Checkout.");
    }
  };

  const isYearly = subscription?.plan === "yearly";

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Subscription &amp; Billing
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your membership tier, view renewal dates, and synchronize Stripe billing.
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {feedback}
        </div>
      )}

      {/* Active Subscription Overview Card */}
      <Card className="p-6 sm:p-8 bg-gradient-to-b from-brand-950/20 to-slate-900/60 border-brand-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={subscription?.status === "active" ? "success" : "warning"}>
                {subscription?.status === "active" ? "Active Status" : (subscription?.status ? subscription.status.toUpperCase() : "Inactive")}
              </Badge>
              <Badge variant="outline">Stripe Test Synchronized</Badge>
            </div>
            <h2 className="text-3xl font-black text-white">
              {isYearly ? "Annual Champion" : "Monthly Membership"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Customer Reference: <code>{subscription?.stripe_customer_id || "Pending Stripe Session"}</code>
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs uppercase font-bold text-slate-400">Current Rate</span>
            <p className="text-3xl font-black text-brand-400">
              {formatCurrency(subscription?.amount_cents ? subscription.amount_cents / 100 : 39)}
              <span className="text-xs text-slate-400 font-normal"> / {isYearly ? "year" : "month"}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold">Next Renewal Date</span>
            <span className="text-sm font-bold text-white mt-1 block">
              {formatDate(subscription?.current_period_end || new Date().toISOString())}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Payment Method</span>
            <span className="text-sm font-bold text-white mt-1 block flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-slate-400" /> Visa ending in 4242
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Automatic Entry</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 block flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> All Monthly Draws Active
            </span>
          </div>
        </div>
      </Card>

      {/* Plan Switcher */}
      <Card className="p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white mb-6">Switch Membership Plan</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Monthly option */}
          <div
            className={`p-6 rounded-2xl border transition-all ${
              !isYearly ? "border-brand-500 bg-brand-950/15" : "border-slate-800 bg-slate-900/50"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-lg font-bold text-white">Monthly Plan</h4>
              {!isYearly && <Badge variant="success">Current</Badge>}
            </div>
            <p className="text-2xl font-black text-white">$39 <span className="text-xs text-slate-400 font-normal">/ mo</span></p>
            <p className="text-xs text-slate-400 mt-2">
              Flexible month-to-month access. Cancel anytime with no long-term lock-in.
            </p>
            <Button
              variant={!isYearly ? "outline" : "secondary"}
              size="sm"
              disabled={!isYearly || isLoading}
              onClick={() => handlePlanSwitch("monthly")}
              className="mt-6 w-full"
            >
              {!isYearly ? "Current Plan" : "Switch to Monthly"}
            </Button>
          </div>

          {/* Yearly option */}
          <div
            className={`p-6 rounded-2xl border relative transition-all ${
              isYearly ? "border-brand-500 bg-brand-950/15" : "border-slate-800 bg-slate-900/50"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-lg font-bold text-white">Annual Champion</h4>
              {isYearly ? (
                <Badge variant="success">Current</Badge>
              ) : (
                <Badge variant="gold">2 Months Free</Badge>
              )}
            </div>
            <p className="text-2xl font-black text-white">$390 <span className="text-xs text-slate-400 font-normal">/ yr</span></p>
            <p className="text-xs text-slate-400 mt-2">
              Save $78 annually (equivalent to $32.50/month) with all 12 guaranteed draws.
            </p>
            <Button
              variant={isYearly ? "outline" : "primary"}
              size="sm"
              disabled={isYearly || isLoading}
              onClick={() => handlePlanSwitch("yearly")}
              className="mt-6 w-full"
            >
              {isYearly ? "Current Plan" : "Upgrade & Save 17%"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
