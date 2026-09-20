"use client";

import * as React from "react";
import Link from "next/link";
import { DataStore } from "@/lib/data/store";
import { Draw } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Trophy,
  Award,
  Layers,
  Zap,
  HelpCircle,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function PublicDrawsPage() {
  const [draws, setDraws] = React.useState<Draw[]>([]);

  React.useEffect(() => {
    async function loadDraws() {
      try {
        const list = await DataStore.getDraws();
        setDraws(list);
      } catch (err) {
        console.error("Failed to load draws:", err);
      }
    }
    loadDraws();
  }, []);

  const publishedDraws = draws.filter((d) => d.status === "PUBLISHED" || d.status === "COMPLETED");
  const upcomingDraw = draws.find((d) => d.status === "DRAFT" || d.status === "SIMULATED");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <Badge variant="gold" className="mb-3">Provably Transparent</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Monthly Reward Draws &amp; Mechanics
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
          Digital Heroes features mathematically governed draws where every active subscriber participates using their latest 5 authentic Stableford scores.
        </p>
      </div>

      {/* Tiers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {/* Tier 5 */}
        <div className="p-8 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-950 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Grand Jackpot</span>
              <Badge variant="gold">40% Share</Badge>
            </div>
            <h3 className="text-2xl font-black text-white">5-Number Match</h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Match all 5 numbers drawn against your active 5-score ticket.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <Zap className="h-4 w-4 text-amber-400" /> Rollover Protocol
              </p>
              If no player achieves a 5-match in a draw, 100% of the 40% Tier 5 pool rolls over into the subsequent draw.
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-800">
            Divided equally among multiple 5-match winners.
          </p>
        </div>

        {/* Tier 4 */}
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Tier 2 Payout</span>
              <Badge variant="success">35% Share</Badge>
            </div>
            <h3 className="text-2xl font-black text-white">4-Number Match</h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Match any 4 out of the 5 official drawn numbers.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <p className="font-semibold text-slate-200 mb-1">Non-Rollover Tier</p>
              The 35% pool is shared immediately among all successful 4-number entries in the current draw cycle.
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-800">
            Divided equally among all 4-match winners.
          </p>
        </div>

        {/* Tier 3 */}
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Tier 3 Payout</span>
              <Badge variant="default">25% Share</Badge>
            </div>
            <h3 className="text-2xl font-black text-white">3-Number Match</h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Match any 3 out of the 5 official drawn numbers.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <p className="font-semibold text-slate-200 mb-1">Non-Rollover Tier</p>
              The 25% pool is split evenly among all 3-match participants to reward regular and consistent golf.
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-800">
            Divided equally among all 3-match winners.
          </p>
        </div>
      </div>

      {/* Algorithmic Engine Deep Dive */}
      <Card className="p-8 sm:p-10 mb-20 bg-slate-900/70 border-slate-800">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
            <FileCode className="h-4 w-4" />
            Transparent Draw Technology
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How The Algorithmic Draw Works
          </h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            While standard lottery draws use pure blind chance, Digital Heroes features an optional <strong>Algorithmic Score-Frequency Weighted Mode</strong> that celebrates authentic player scoring patterns:
          </p>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
              <p>
                <strong>Score Histogram Collection:</strong> Aggregates all registered participant Stableford scores for the active cycle.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
              <p>
                <strong>Laplace Smoothing (+1 Count):</strong> Adds a baseline of +1 to every possible score between 1 and 45. This mathematical guarantee ensures every single number has a non-zero probability of selection.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
              <p>
                <strong>Roulette Wheel Sampling Without Replacement:</strong> Samples 5 distinct numbers weighted by their empirical frequency.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
              <p>
                <strong>Deterministic Seed Audit:</strong> Every draw record stores the random seed and algorithm metadata so administrators and independent auditors can reproduce the outcome identically.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Official Past Draw Results */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Official Draw History</h2>
            <p className="text-sm text-slate-400 mt-1">Verified winning numbers and prize payouts</p>
          </div>
        </div>

        <div className="space-y-6">
          {publishedDraws.map((draw) => (
            <Card key={draw.id} className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">
                      Draw #{draw.draw_number}: {draw.title}
                    </h3>
                    <Badge variant="success">OFFICIAL</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Conducted on {formatDate(draw.draw_date)} &middot; Mode: <strong className="text-slate-200">{draw.mode}</strong>
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Total Prize Pool</p>
                  <p className="text-2xl font-black text-amber-400">
                    {formatCurrency(draw.total_prize_pool)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Winning Numbers
                  </p>
                  <div className="flex items-center gap-2.5">
                    {draw.winning_numbers?.map((num) => (
                      <span
                        key={num}
                        className="h-12 w-12 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-brand-500/40 font-extrabold text-brand-400 text-lg flex items-center justify-center shadow-md shadow-brand-500/10"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Participants</span>
                    <strong className="text-sm text-white">{draw.total_participants}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Rollover Out</span>
                    <strong className="text-sm text-amber-400">
                      {formatCurrency(draw.jackpot_rollover_out)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Status</span>
                    <strong className="text-sm text-emerald-400">{draw.status}</strong>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
