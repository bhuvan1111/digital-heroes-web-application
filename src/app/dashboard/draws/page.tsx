"use client";

import * as React from "react";
import Link from "next/link";
import { DataStore } from "@/lib/data/store";
import { Draw, GolfScore, UserProfile } from "@/types";
import { DrawEngine } from "@/lib/services/draw-engine";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Calendar,
  Trophy,
  Award,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function DashboardDrawsPage() {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [draws, setDraws] = React.useState<Draw[]>([]);
  const [scores, setScores] = React.useState<GolfScore[]>([]);

  React.useEffect(() => {
    async function loadData() {
      try {
        const user = await DataStore.getCurrentUser();
        if (!user) return;
        setCurrentUser(user);
        const [allDraws, uScores] = await Promise.all([
          DataStore.getDraws(),
          DataStore.getUserScores(user.id),
        ]);
        setDraws(allDraws);
        setScores(uScores);
      } catch (err) {
        console.error("Failed to load dashboard draws", err);
      }
    }
    loadData();
  }, []);

  const userNumbers = scores.map((s) => s.score);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Monthly Reward Draws &amp; Tickets
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review upcoming draw dates, verify your active 5-score ticket, and check official match results.
        </p>
      </div>

      {/* User's Current Ticket */}
      <Card className="p-6 bg-slate-900/60 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              My Active Entry Ticket
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              5 Stableford Scores Entry
            </h3>
          </div>
          <Badge variant={userNumbers.length === 5 ? "success" : "warning"}>
            {userNumbers.length === 5 ? "Eligible For All Draws" : `${userNumbers.length}/5 Scores (Incomplete)`}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {userNumbers.map((num, idx) => (
            <div
              key={idx}
              className="h-12 w-12 rounded-xl bg-slate-800 border border-brand-500/40 text-brand-400 font-extrabold text-lg flex items-center justify-center shadow-lg shadow-brand-500/10"
            >
              {num}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 5 - userNumbers.length) }).map((_, i) => (
            <div
              key={i}
              className="h-12 w-12 rounded-xl border border-dashed border-slate-700 text-slate-600 font-semibold flex items-center justify-center text-xs"
            >
              Slot {userNumbers.length + i + 1}
            </div>
          ))}
        </div>

        {userNumbers.length < 5 && (
          <div className="mt-4 flex items-center justify-between gap-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <span>You need 5 scores to form an eligible ticket.</span>
            <Link href="/dashboard/scores">
              <Button size="sm" variant="gold">
                Log Missing Scores
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* All Draws List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Draw Schedule &amp; Results</h2>

        {draws.map((draw) => {
          const isPublished = draw.status === "PUBLISHED" || draw.status === "COMPLETED";
          // If published and user has 5 scores, calculate matches
          let matchResult: ReturnType<typeof DrawEngine.calculateMatches> | null = null;
          if (isPublished && draw.winning_numbers && userNumbers.length === 5) {
            matchResult = DrawEngine.calculateMatches(userNumbers, draw.winning_numbers);
          }

          return (
            <Card key={draw.id} className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">
                      Draw #{draw.draw_number}: {draw.title}
                    </h3>
                    <Badge variant={isPublished ? "success" : "warning"}>
                      {draw.status}
                    </Badge>
                    <Badge variant="outline">{draw.mode} MODE</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Scheduled Date: {formatDate(draw.draw_date)} &middot; {draw.total_participants} active entries
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Prize Pool</span>
                  <p className="text-2xl font-black text-amber-400">
                    {formatCurrency(draw.total_prize_pool)}
                  </p>
                </div>
              </div>

              {/* Published Results Section */}
              {isPublished && draw.winning_numbers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Official Winning Numbers
                    </p>
                    <div className="flex items-center gap-2">
                      {draw.winning_numbers.map((num) => (
                        <span
                          key={num}
                          className="h-11 w-11 rounded-xl bg-slate-950 border border-slate-700 font-extrabold text-white flex items-center justify-center text-base"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Match result for active user */}
                  {matchResult && (
                    <div
                      className={`p-4 rounded-xl border text-xs ${
                        matchResult.matchCount >= 3
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1.5">
                        <span className="text-white text-sm">
                          Your Result: {matchResult.matchCount} Numbers Matched
                        </span>
                        {matchResult.tier !== "NONE" && (
                          <Badge variant="gold">
                            {matchResult.tier === "JACKPOT_5" ? "JACKPOT 5/5!" : matchResult.tier}
                          </Badge>
                        )}
                      </div>
                      <p>
                        Matched numbers:{" "}
                        {matchResult.matchedNumbers.length > 0
                          ? matchResult.matchedNumbers.join(", ")
                          : "None"}
                      </p>
                      {matchResult.matchCount >= 3 && (
                        <div className="mt-3 pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                          <span>Reward allocated to your profile!</span>
                          <Link href="/dashboard/winnings" className="font-bold underline text-emerald-400">
                            Claim in Winnings &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>Draw numbers will be released officially on draw date.</span>
                  <span className="text-brand-400 font-semibold">Automatic Participation Enabled</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
