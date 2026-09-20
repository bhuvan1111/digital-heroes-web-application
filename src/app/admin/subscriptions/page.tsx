"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { Subscription, UserProfile } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, CheckCircle2, TrendingUp, Filter, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface EnrichedSubscription extends Subscription {
  user?: UserProfile | null;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = React.useState<EnrichedSubscription[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  React.useEffect(() => {
    async function loadData() {
      try {
        const [allSubs, allUsers] = await Promise.all([
          DataStore.getAllSubscriptions(),
          DataStore.getAllUsers(),
        ]);
        const userMap = new Map(allUsers.map((u) => [u.id, u]));
        const enriched: EnrichedSubscription[] = allSubs.map((s) => ({
          ...s,
          user: userMap.get(s.user_id) || null,
        }));
        setSubscriptions(enriched);
      } catch (err) {
        console.error("Failed to load admin subscriptions", err);
      }
    }
    loadData();
  }, []);

  const filtered = subscriptions.filter((s) => {
    if (statusFilter === "ALL") return true;
    return s.status === statusFilter;
  });

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const mrr = activeSubs.reduce((sum, s) => {
    return sum + (s.plan === "monthly" ? s.amount_cents / 100 : (s.amount_cents / 100) / 12);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">Stripe Synchronization</Badge>
            <span className="text-xs text-slate-500">Live Recurring Billing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Subscriptions &amp; Revenue Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track active memberships, MRR performance, and customer subscription cycles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="canceled">Canceled</option>
            <option value="past_due">Past Due</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Recurring Revenue</span>
          <p className="text-3xl font-black text-brand-400 mt-1">{formatCurrency(mrr)}</p>
          <span className="text-[11px] text-slate-500">Normalized monthly run-rate</span>
        </Card>

        <Card className="p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Members</span>
          <p className="text-3xl font-black text-white mt-1">{activeSubs.length}</p>
          <span className="text-[11px] text-slate-500">Subscribers in good standing</span>
        </Card>

        <Card className="p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Annual Plan Ratio</span>
          <p className="text-3xl font-black text-amber-400 mt-1">
            {Math.round((subscriptions.filter((s) => s.plan === "yearly").length / (subscriptions.length || 1)) * 100)}%
          </p>
          <span className="text-[11px] text-slate-500">Subscribers on discounted yearly plan</span>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Stripe Customer</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4">Period Renewal</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{s.user?.full_name || "Subscriber"}</p>
                    <p className="text-xs text-slate-400">{s.user?.email}</p>
                  </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {s.stripe_customer_id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white uppercase text-xs">
                      {s.plan === "yearly" ? "Annual Champion" : "Monthly Member"}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-400">
                      {formatCurrency(s.amount_cents / 100)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {formatDate(s.current_period_end || "2024-06-01")}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.status === "active" ? "success" : "danger"}>
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
