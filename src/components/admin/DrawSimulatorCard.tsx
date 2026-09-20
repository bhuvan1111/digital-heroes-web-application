import * as React from "react";
import { DrawSimulationResult } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface DrawSimulatorCardProps {
  simulation: DrawSimulationResult;
  drawNumber: number;
  onPublish: () => void;
}

export function DrawSimulatorCard({
  simulation,
  drawNumber,
  onPublish,
}: DrawSimulatorCardProps) {
  return (
    <Card className="p-6 sm:p-8 border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" /> Simulation Preview (Non-Destructive)
          </div>
          <h3 className="text-xl font-black text-white mt-1">
            Projected Outcome for Draw #{drawNumber}
          </h3>
        </div>

        <Button variant="primary" onClick={onPublish} className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> Publish Official Result
        </Button>
      </div>

      {/* Numbers */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Simulated Winning Numbers
        </span>
        <div className="flex items-center gap-2.5">
          {simulation.winningNumbers.map((num) => (
            <span
              key={num}
              className="h-12 w-12 rounded-xl bg-slate-950 border border-amber-400 text-amber-400 font-black text-lg flex items-center justify-center shadow-lg"
            >
              {num}
            </span>
          ))}
        </div>
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
            5-Match Jackpot (40%)
          </span>
          <p className="text-2xl font-black text-white mt-1">
            {simulation.tier5Winners.length} Winners
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {simulation.tier5Winners.length > 0
              ? `${formatCurrency(simulation.tier5PayoutPerWinner)} per winner`
              : `0 Winners: ${formatCurrency(simulation.jackpotRolloverOut)} rolls over!`}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 block">
            4-Match Tier (35%)
          </span>
          <p className="text-2xl font-black text-white mt-1">
            {simulation.tier4Winners.length} Winners
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {simulation.tier4Winners.length > 0
              ? `${formatCurrency(simulation.tier4PayoutPerWinner)} per winner`
              : "No matches"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block">
            3-Match Tier (25%)
          </span>
          <p className="text-2xl font-black text-white mt-1">
            {simulation.tier3Winners.length} Winners
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {simulation.tier3Winners.length > 0
              ? `${formatCurrency(simulation.tier3PayoutPerWinner)} per winner`
              : "No matches"}
          </p>
        </div>
      </div>
    </Card>
  );
}
