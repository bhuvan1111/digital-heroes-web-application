"use client";

import * as React from "react";
import Link from "next/link";
import { DataStore } from "@/lib/data/store";
import { Charity, Draw, GolfScore, Subscription, UserCharity, UserProfile, Winner } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Trophy,
  Heart,
  Calendar,
  Award,
  CreditCard,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function DashboardOverviewPage() {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [userCharity, setUserCharity] = React.useState<{ userCharity?: UserCharity; charity?: Charity }>({});
  const [scores, setScores] = React.useState<GolfScore[]>([]);
  const [upcomingDraw, setUpcomingDraw] = React.useState<Draw | null>(null);
  const [userWinners, setUserWinners] = React.useState<Winner[]>([]);

  React.useEffect(() => {
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);
    const sub = DataStore.getUserSubscription(user.id);
    if (sub) setSubscription(sub);
    setUserCharity(DataStore.getUserCharity(user.id));
    setScores(DataStore.getUserScores(user.id));
    setUpcomingDraw(DataStore.getUpcomingDraw() || null);
    setUserWinners(DataStore.getUserWinners(user.id));
  }, []);

  const totalWon = userWinners.reduce((sum, w) => sum + Number(w.prize_amount), 0);
  const pendingProofWinner = userWinners.find((w) => w.status === "PENDING_PROOF");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {currentUser?.full_name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is the current status of your Stableford rounds, charity contribution, and draw tickets.
          </p>
        </div>
        <Link href="/dashboard/scores">
          <Button variant="primary" className="gap-2">
            <Trophy className="h-4 w-4" /> Log New Score
          </Button>
        </Link>
      </div>

      {/* Winner Action Alert (if pending proof) */}
      {pendingProofWinner && (
        <div className="p-6 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Action Required: You Won {formatCurrency(pendingProofWinner.prize_amount)}!</h3>
                <Badge variant="gold">Grand Winner</Badge>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                You matched {pendingProofWinner.match_count} numbers in Draw #{pendingProofWinner.draw?.draw_number || 102}. Please submit your signed scorecard for compliance verification to release your payout.
              </p>
            </div>
          </div>
          <Link href="/dashboard/winnings" className="shrink-0">
            <Button variant="gold" size="sm" className="gap-2">
              Upload Scorecard Proof <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Subscription */}
        <Card className="p-6">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Subscription</span>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">
              {subscription?.plan === "yearly" ? "Annual Champion" : "Monthly Membership"}
            </h3>
            <p className="text-xs text-slate-400">
              Renews on {formatDate(subscription?.current_period_end || "2024-06-01")} &middot; $
              {subscription?.amount_cents ? (subscription.amount_cents / 100).toFixed(2) : "39.00"}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <Link href="/dashboard/subscription" className="text-brand-400 hover:underline font-semibold flex items-center gap-1">
              Manage billing <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* 2. Charity & Pledge */}
        <Card className="p-6">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Designated Charity</span>
            <span className="text-xs font-extrabold text-brand-400">
              {userCharity.userCharity?.contribution_percentage || 10}% Pledge
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white truncate">
              {userCharity.charity?.name || "Select Charity"}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {userCharity.charity?.category || "Non-profit partner"}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <Link href="/dashboard/charity" className="text-brand-400 hover:underline font-semibold flex items-center gap-1">
              Adjust pledge % <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* 3. Next Draw */}
        <Card className="p-6">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Next Reward Draw</span>
            <Badge variant="gold">
              {scores.length === 5 ? "Ticket Ready" : `${scores.length}/5 Scores`}
            </Badge>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white truncate">
              {upcomingDraw?.title || "Monthly Draw"}
            </h3>
            <p className="text-xs text-slate-400">
              Est. Pool: <strong className="text-amber-400">{formatCurrency(upcomingDraw?.total_prize_pool || 21500)}</strong>
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <Link href="/dashboard/draws" className="text-brand-400 hover:underline font-semibold flex items-center gap-1">
              View active entries <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* 4. Total Winnings */}
        <Card className="p-6 sm:col-span-2 lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lifetime Reward Draw Winnings
              </span>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-3xl font-black text-amber-400">{formatCurrency(totalWon)}</span>
                <span className="text-xs text-slate-400">
                  across {userWinners.length} winning {userWinners.length === 1 ? "draw" : "draws"}
                </span>
              </div>
            </div>
            <Link href="/dashboard/winnings">
              <Button variant="secondary" size="sm" className="gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                View Winnings &amp; Payouts
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Active Draw Ticket & Recent Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Ticket */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-400" />
              <h3 className="text-base font-bold text-white">Active Draw Ticket (5 Scores)</h3>
            </div>
            <Badge variant={scores.length === 5 ? "success" : "warning"}>
              {scores.length === 5 ? "5/5 Full Entry" : `${scores.length}/5 Scores`}
            </Badge>
          </div>

          <p className="text-xs text-slate-400 mb-6">
            Your latest 5 Stableford scores automatically compose your entry for upcoming draws:
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3 my-4">
            {scores.map((s, idx) => (
              <div
                key={s.id}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="h-12 w-12 rounded-xl bg-slate-800 border border-brand-500/50 font-extrabold text-lg text-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/10">
                  {s.score}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">#{idx + 1}</span>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 5 - scores.length) }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="h-12 w-12 rounded-xl border border-dashed border-slate-700 font-bold text-slate-600 flex items-center justify-center">
                  -
                </span>
                <span className="text-[10px] text-slate-600">Pending</span>
              </div>
            ))}
          </div>

          {scores.length < 5 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Log {5 - scores.length} more round to complete your ticket.
            </div>
          )}
        </Card>

        {/* Latest Scores Quick List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Latest Stableford Rounds</h3>
            <Link href="/dashboard/scores" className="text-xs text-brand-400 hover:underline">
              Manage Scores &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {scores.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-white">{s.course_name || "Official Round"}</p>
                  <p className="text-slate-400 text-[11px]">{formatDate(s.played_date)}</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-brand-400">{s.score} pts</span>
                  <span className="block text-[10px] text-slate-500">Stableford</span>
                </div>
              </div>
            ))}
            {scores.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No scores logged yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
