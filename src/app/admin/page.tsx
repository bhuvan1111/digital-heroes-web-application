"use client";

import * as React from "react";
import Link from "next/link";
import { DataStore } from "@/lib/data/store";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  CreditCard,
  Heart,
  Award,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export default function AdminOverviewPage() {
  const [analytics, setAnalytics] = React.useState<ReturnType<typeof DataStore.getAdminAnalytics> | null>(null);

  React.useEffect(() => {
    setAnalytics(DataStore.getAdminAnalytics());
  }, []);

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">Compliance &amp; Operations</Badge>
            <span className="text-xs text-slate-500">Live Production Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Executive Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/draws">
            <Button variant="gold" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Open Draw Simulator
            </Button>
          </Link>
          <Link href="/admin/winners">
            <Button variant="outline" size="sm" className="gap-2">
              <Award className="h-4 w-4" />
              Verify Scorecards
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 Core Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Total Subscribers & MRR */}
        <Card className="p-6 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Subscribers</span>
            <Users className="h-4 w-4 text-brand-400" />
          </div>
          <p className="text-3xl font-black text-white">{analytics.activeSubscribers}</p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Registered: {analytics.totalUsers}</span>
            <span className="text-brand-400 font-semibold">MRR: {formatCurrency(analytics.mrr)}</span>
          </div>
        </Card>

        {/* 2. Charity Funds */}
        <Card className="p-6 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Charity Disbursed</span>
            <Heart className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">
            {formatCurrency(analytics.totalCharityContributions)}
          </p>
          <div className="mt-2 text-xs text-slate-400">
            Across vetted partners (min 10% pledge)
          </div>
        </Card>

        {/* 3. Prize Pools */}
        <Card className="p-6 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cumulative Prize Pools</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">
            {formatCurrency(analytics.totalPrizePool)}
          </p>
          <div className="mt-2 text-xs text-slate-400">
            40% Jackpot / 35% Tier 4 / 25% Tier 3
          </div>
        </Card>

        {/* 4. Pending Winner Reviews */}
        <Card className="p-6 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Winner Proofs</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">{analytics.pendingWinners}</p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Requires compliance sign-off</span>
            <Link href="/admin/winners" className="text-amber-400 hover:underline font-semibold">
              Review &rarr;
            </Link>
          </div>
        </Card>

        {/* 5. Completed Payouts */}
        <Card className="p-6 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Payouts</span>
            <DollarSign className="h-4 w-4 text-brand-400" />
          </div>
          <p className="text-3xl font-black text-brand-400">
            {formatCurrency(analytics.completedPayoutsTotal)}
          </p>
          <div className="mt-2 text-xs text-slate-400">
            Disbursed via electronic bank transfer
          </div>
        </Card>

        {/* 6. System Integrity Status */}
        <Card className="p-6 border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Audit Engine</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-white mt-1">100% Deterministic</p>
          <div className="mt-3 text-xs text-slate-400">
            Seeds and score-frequency histograms logged for every published draw.
          </div>
        </Card>
      </div>

      {/* Visual Analytics Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Subscriber Growth & Charity Disbursed */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-white mb-1">
            Subscriber Growth &amp; Monthly Impact
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Correlation between platform membership growth and cumulative charitable distributions.
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubscribers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" textAnchor="end" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="subscribers"
                  name="Active Members"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubscribers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Prize Pool vs Rollover History */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-white mb-1">
            Draw Prize Pools &amp; Charity Disbursements
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Historical progression of reward pools and beneficiary funding (USD).
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                  formatter={(val: number) => [`$${val.toLocaleString()}`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="charityDonated" name="Charity Donated" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="prizePool" name="Draw Prize Pool" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
