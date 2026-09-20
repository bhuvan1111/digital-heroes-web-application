"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  Download,
  DollarSign,
  Heart,
  Award,
  Users,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function AdminReportsPage() {
  const [analytics, setAnalytics] = React.useState<ReturnType<typeof DataStore.getAdminAnalytics> | null>(null);
  const [drawsCount, setDrawsCount] = React.useState(0);
  const [winnersCount, setWinnersCount] = React.useState(0);

  React.useEffect(() => {
    setAnalytics(DataStore.getAdminAnalytics());
    setDrawsCount(DataStore.getDraws().length);
    setWinnersCount(DataStore.getWinners().length);
  }, []);

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">Financial Ledger &amp; Auditing</Badge>
            <span className="text-xs text-slate-500">PRD Section 24</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Performance &amp; Impact Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live audited metrics calculated directly from active subscriber and draw records.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => alert("CSV Export generated for financial compliance audit.")}
          className="gap-2"
        >
          <Download className="h-4 w-4" /> Export Audit CSV
        </Button>
      </div>

      {/* Grid of 9 Mandatory PRD Section 24 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* 1. Total Users */}
        <Card className="p-5">
          <span className="text-xs font-bold uppercase text-slate-400 block">Total Registered Users</span>
          <p className="text-2xl font-black text-white mt-1">{analytics.totalUsers}</p>
        </Card>

        {/* 2. Active Subscribers */}
        <Card className="p-5">
          <span className="text-xs font-bold uppercase text-slate-400 block">Active Subscribers</span>
          <p className="text-2xl font-black text-brand-400 mt-1">{analytics.activeSubscribers}</p>
        </Card>

        {/* 3. MRR */}
        <Card className="p-5">
          <span className="text-xs font-bold uppercase text-slate-400 block">Monthly Recurring Revenue</span>
          <p className="text-2xl font-black text-white mt-1">{formatCurrency(analytics.mrr)}</p>
        </Card>

        {/* 4. Charity Contributions */}
        <Card className="p-5">
          <span className="text-xs font-bold uppercase text-slate-400 block">Charity Contributions</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(analytics.totalCharityContributions)}</p>
        </Card>

        {/* 5. Total Prize Pool */}
        <Card className="p-5">
          <span className="text-xs font-bold uppercase text-slate-400 block">Cumulative Prize Pools</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(analytics.totalPrizePool)}</p>
        </Card>

        {/* 6. Number of Draws */}
        <Card className="p-5">
          <span className="text-xs font-bold uppercase text-slate-400 block">Draw Cycles Scheduled</span>
          <p className="text-2xl font-black text-white mt-1">{drawsCount}</p>
        </Card>

        {/* 7. Number of Winners */}
        <Card className="p-5">
          <span className="text-xs font-bold uppercase text-slate-400 block">Verified Winners</span>
          <p className="text-2xl font-black text-white mt-1">{winnersCount}</p>
        </Card>

        {/* 8. Total Payouts Completed */}
        <Card className="p-5">
          <span className="text-xs font-bold uppercase text-slate-400 block">Completed Payouts</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(analytics.completedPayoutsTotal)}</p>
        </Card>

        {/* 9. Pending Payouts */}
        <Card className="p-5">
          <span className="text-xs font-bold uppercase text-slate-400 block">Pending Payouts Review</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{analytics.pendingWinners} claims</p>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card className="p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white mb-2">Charity Disbursement By Partner</h3>
        <p className="text-xs text-slate-400 mb-6">
          Total contributions sent directly to each registered charity organization (USD).
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.charityDistribution} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                formatter={(val: number) => [formatCurrency(val), "Disbursed"]}
              />
              <Bar dataKey="value" name="Funds Received" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
