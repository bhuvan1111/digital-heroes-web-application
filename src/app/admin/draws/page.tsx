"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { Draw, DrawMode, DrawSimulationResult, UserProfile } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Calendar,
  Play,
  CheckCircle2,
  AlertCircle,
  Zap,
  Layers,
  Award,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export default function AdminDrawsPage() {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [draws, setDraws] = React.useState<Draw[]>([]);
  const [selectedDraw, setSelectedDraw] = React.useState<Draw | null>(null);

  // Create Draw Modal
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("July 2024 Midsummer Reward Draw");
  const [newDate, setNewDate] = React.useState("2024-07-31T18:00:00Z");
  const [newMode, setNewMode] = React.useState<DrawMode>("ALGORITHMIC");
  const [newPool, setNewPool] = React.useState(25000);
  const [newRollover, setNewRollover] = React.useState(0);

  // Simulation State
  const [simulationResult, setSimulationResult] = React.useState<DrawSimulationResult | null>(null);
  const [simulating, setSimulating] = React.useState(false);
  const [simulationSeed, setSimulationSeed] = React.useState("admin-sim-seed-77");

  // Publish Confirmation Dialog
  const [publishModalOpen, setPublishModalOpen] = React.useState(false);
  const [publishFeedback, setPublishFeedback] = React.useState<string | null>(null);

  const loadDraws = React.useCallback(async () => {
    try {
      const user = await DataStore.getCurrentUser();
      if (user) setCurrentUser(user);
      const list = await DataStore.getDraws();
      setDraws(list);
      if (!selectedDraw && list.length > 0) {
        setSelectedDraw(list[0]);
      }
    } catch (err) {
      console.error("Failed to load draws", err);
    }
  }, [selectedDraw]);

  React.useEffect(() => {
    loadDraws();
  }, [loadDraws]);

  const handleCreateDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await DataStore.createDraw(
        {
          title: newTitle,
          drawDate: newDate,
          mode: newMode,
          totalPrizePool: Number(newPool),
          jackpotRolloverIn: Number(newRollover),
        },
        currentUser?.id
      );
      setCreateModalOpen(false);
      setSelectedDraw(created);
      await loadDraws();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create draw");
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedDraw) return;
    setSimulating(true);
    try {
      const result = await DataStore.simulateDraw(selectedDraw.id, selectedDraw.mode, simulationSeed);
      setSimulationResult(result);
      setSimulating(false);
      await loadDraws();
    } catch (err: unknown) {
      setSimulating(false);
      alert(err instanceof Error ? err.message : "Simulation failed");
    }
  };

  const handleConfirmPublish = async () => {
    if (!selectedDraw || !simulationResult) return;
    try {
      await DataStore.publishDraw(selectedDraw.id, simulationResult, currentUser?.id);
      setPublishFeedback("Official draw published successfully! Official winners created in ledger.");
      setPublishModalOpen(false);
      setSimulationResult(null);
      await loadDraws();
      setTimeout(() => setPublishFeedback(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to publish draw");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">Draw Governance Engine</Badge>
            <span className="text-xs text-slate-500">PRD Sections 12-15</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Draw Management &amp; Sandbox Simulator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulate deterministic random or score-frequency weighted draws before official publication.
          </p>
        </div>

        <Button variant="primary" onClick={() => setCreateModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Create New Draw Cycle
        </Button>
      </div>

      {publishFeedback && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {publishFeedback}
        </div>
      )}

      {/* Main Two-Column Control: Select Draw on Left, Simulation Sandbox on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Draw Selection List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Draw Catalog ({draws.length})
          </h3>

          <div className="space-y-3">
            {draws.map((d) => {
              const isSelected = selectedDraw?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDraw(d);
                    setSimulationResult(null);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
                      : "border-slate-850 bg-slate-900/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400">Draw #{d.draw_number}</span>
                    <Badge variant={d.status === "PUBLISHED" ? "success" : "warning"}>
                      {d.status}
                    </Badge>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">{d.title}</h4>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{formatDate(d.draw_date)}</span>
                    <strong className="text-white">{formatCurrency(d.total_prize_pool)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Draw Workspace & Simulator */}
        {selectedDraw ? (
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 sm:p-8 bg-slate-900/60 border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedDraw.status === "PUBLISHED" ? "success" : "warning"}>
                      {selectedDraw.status}
                    </Badge>
                    <Badge variant="outline">{selectedDraw.mode} MODE</Badge>
                  </div>
                  <h2 className="text-2xl font-black text-white mt-2">
                    Draw #{selectedDraw.draw_number}: {selectedDraw.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Scheduled Date: {formatDate(selectedDraw.draw_date)} &middot; {selectedDraw.total_participants} eligible active participants
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Net Prize Pool</span>
                  <p className="text-2xl font-black text-amber-400">
                    {formatCurrency(selectedDraw.total_prize_pool)}
                  </p>
                  {selectedDraw.jackpot_rollover_in > 0 && (
                    <span className="text-[11px] text-amber-300 block">
                      Includes {formatCurrency(selectedDraw.jackpot_rollover_in)} rollover
                    </span>
                  )}
                </div>
              </div>

              {/* Draw Mode Configurator & Simulator Controls */}
              {selectedDraw.status !== "PUBLISHED" && selectedDraw.status !== "COMPLETED" ? (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                        Draw Algorithm Mode
                      </label>
                      <select
                        value={selectedDraw.mode}
                        onChange={(e) => {
                          const m = e.target.value as DrawMode;
                          selectedDraw.mode = m;
                          setSelectedDraw({ ...selectedDraw });
                        }}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="ALGORITHMIC">ALGORITHMIC (Score-Frequency Weighted)</option>
                        <option value="RANDOM">RANDOM (Deterministic RNG)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                        Deterministic Audit Seed
                      </label>
                      <Input
                        type="text"
                        value={simulationSeed}
                        onChange={(e) => setSimulationSeed(e.target.value)}
                        placeholder="e.g. audit-seed-2024"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      variant="gold"
                      onClick={handleRunSimulation}
                      isLoading={simulating}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" /> Run Sandbox Simulation
                    </Button>
                    <span className="text-xs text-slate-400">
                      Simulations test matching and payouts without modifying the database.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">
                      Official Published Winning Numbers
                    </span>
                    <div className="flex items-center gap-2.5">
                      {selectedDraw.winning_numbers?.map((num) => (
                        <span
                          key={num}
                          className="h-12 w-12 rounded-xl bg-slate-900 border border-brand-500 font-extrabold text-brand-400 text-lg flex items-center justify-center"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                    {selectedDraw.algorithm_metadata && (
                      <div className="mt-4 pt-3 border-t border-slate-850 text-xs text-slate-400 space-y-1">
                        <p>
                          <strong>Algorithm:</strong> {selectedDraw.algorithm_metadata.description}
                        </p>
                        <p>
                          <strong>Scores Sampled:</strong> {selectedDraw.algorithm_metadata.total_participant_scores} scores across participants
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Simulation Results Panel */}
            {simulationResult && (
              <Card className="p-6 sm:p-8 border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="h-4 w-4" /> Simulation Preview (Non-Destructive)
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">
                      Projected Outcome for Draw #{selectedDraw.draw_number}
                    </h3>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => setPublishModalOpen(true)}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Publish Official Result
                  </Button>
                </div>

                {/* Simulated Numbers */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Simulated Winning Numbers
                  </span>
                  <div className="flex items-center gap-2.5">
                    {simulationResult.winningNumbers.map((num) => (
                      <span
                        key={num}
                        className="h-12 w-12 rounded-xl bg-slate-950 border border-amber-400 text-amber-400 font-black text-lg flex items-center justify-center shadow-lg"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tier Breakdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Tier 5 */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                      5-Match Jackpot (40%)
                    </span>
                    <p className="text-2xl font-black text-white mt-1">
                      {simulationResult.tier5Winners.length} Winners
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {simulationResult.tier5Winners.length > 0
                        ? `${formatCurrency(simulationResult.tier5PayoutPerWinner)} per winner`
                        : `0 Winners: ${formatCurrency(simulationResult.jackpotRolloverOut)} rolls over!`}
                    </p>
                  </div>

                  {/* Tier 4 */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 block">
                      4-Match Tier (35%)
                    </span>
                    <p className="text-2xl font-black text-white mt-1">
                      {simulationResult.tier4Winners.length} Winners
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {simulationResult.tier4Winners.length > 0
                        ? `${formatCurrency(simulationResult.tier4PayoutPerWinner)} per winner`
                        : "No matches in this tier"}
                    </p>
                  </div>

                  {/* Tier 3 */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block">
                      3-Match Tier (25%)
                    </span>
                    <p className="text-2xl font-black text-white mt-1">
                      {simulationResult.tier3Winners.length} Winners
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {simulationResult.tier3Winners.length > 0
                        ? `${formatCurrency(simulationResult.tier3PayoutPerWinner)} per winner`
                        : "No matches in this tier"}
                    </p>
                  </div>
                </div>

                {simulationResult.algorithmMetadata && (
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400">
                    <p className="font-semibold text-slate-300">
                      Algorithm Metadata Logged:
                    </p>
                    <p className="mt-0.5">
                      Laplace smoothing (+1) applied across {simulationResult.algorithmMetadata.total_participant_scores} scores. Roulette sampling complete.
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        ) : null}
      </div>

      {/* Create Draw Modal */}
      <Dialog
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule New Draw Cycle"
        description="Configure draw parameters, execution mode, and prize pool funding."
      >
        <form onSubmit={handleCreateDraw} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Draw Title
            </label>
            <Input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Draw Date &amp; Time
            </label>
            <Input
              type="datetime-local"
              required
              value={newDate.slice(0, 16)}
              onChange={(e) => setNewDate(e.target.value + ":00Z")}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Execution Mode
            </label>
            <select
              value={newMode}
              onChange={(e) => setNewMode(e.target.value as DrawMode)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALGORITHMIC">ALGORITHMIC (Score-Frequency Weighted)</option>
              <option value="RANDOM">RANDOM (Deterministic RNG)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                New Prize Pool ($)
              </label>
              <Input
                type="number"
                required
                value={newPool}
                onChange={(e) => setNewPool(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Rollover From Prior ($)
              </label>
              <Input
                type="number"
                value={newRollover}
                onChange={(e) => setNewRollover(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Draw Cycle
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Two-step Publication Confirmation Dialog */}
      <Dialog
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Confirm Official Draw Publication"
        description="Are you certain you want to commit these results to the official immutable ledger?"
      >
        <div className="space-y-3 text-xs text-slate-300 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="font-bold text-amber-300">Important Publication Consequences:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-300">
            <li>Winning numbers will be locked and visible to all participants.</li>
            <li>Winner records will be generated in PENDING_PROOF status.</li>
            <li>Audit logs will permanently record your admin ID and timestamp.</li>
            <li>This action cannot be reverted.</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
          <Button variant="ghost" onClick={() => setPublishModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleConfirmPublish}>
            Commit &amp; Publish Official Draw
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
