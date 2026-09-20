"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { GolfScore, UserProfile } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export default function DashboardScoresPage() {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [scores, setScores] = React.useState<GolfScore[]>([]);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingScore, setEditingScore] = React.useState<GolfScore | null>(null);
  const [scoreValue, setScoreValue] = React.useState(36);
  const [playedDate, setPlayedDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [courseName, setCourseName] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Delete Confirmation Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [scoreToDelete, setScoreToDelete] = React.useState<GolfScore | null>(null);

  const loadScores = React.useCallback(async () => {
    try {
      const user = await DataStore.getCurrentUser();
      if (!user) return;
      setCurrentUser(user);
      const userScores = await DataStore.getUserScores(user.id);
      setScores(userScores);
    } catch (err) {
      console.error("Failed to load scores", err);
    }
  }, []);

  React.useEffect(() => {
    loadScores();
  }, [loadScores]);

  const openAddModal = () => {
    setEditingScore(null);
    setScoreValue(36);
    setPlayedDate(new Date().toISOString().split("T")[0]);
    setCourseName("");
    setNotes("");
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: GolfScore) => {
    setEditingScore(s);
    setScoreValue(s.score);
    setPlayedDate(s.played_date);
    setCourseName(s.course_name || "");
    setNotes(s.notes || "");
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!currentUser) return;

    try {
      if (editingScore) {
        // Update
        const res = await DataStore.updateScore(
          currentUser.id,
          editingScore.id,
          Number(scoreValue),
          playedDate,
          courseName,
          notes
        );
        if (!res.success) {
          setFeedback({ type: "error", message: res.error || "Failed to update score." });
          return;
        }
        setFeedback({ type: "success", message: "Score updated successfully." });
      } else {
        // Add (Rolling logic applies automatically: if 5 exist, oldest is replaced)
        const res = await DataStore.addScore(
          currentUser.id,
          Number(scoreValue),
          playedDate,
          courseName,
          notes
        );
        if (!res.success) {
          setFeedback({ type: "error", message: res.error || "Failed to record score." });
          return;
        }
        setFeedback({
          type: "success",
          message:
            scores.length >= 5
              ? "New score added! Your oldest score was automatically archived to preserve the 5-round ticket window."
              : "Score added to your active draw ticket.",
        });
      }

      setIsModalOpen(false);
      await loadScores();
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "An error occurred." });
    }
  };

  const handleDelete = async () => {
    if (!scoreToDelete || !currentUser) return;
    try {
      const res = await DataStore.deleteScore(currentUser.id, scoreToDelete.id);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to delete score." });
      } else {
        setFeedback({ type: "success", message: "Score deleted successfully." });
      }
      setDeleteConfirmOpen(false);
      setScoreToDelete(null);
      await loadScores();
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to delete score." });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Stableford Scores Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Official 18-hole Stableford scoring (1 to 45 points). The platform maintains your 5 most recent rounds.
          </p>
        </div>

        <Button variant="primary" onClick={openAddModal} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add Stableford Score
        </Button>
      </div>

      {/* Rolling 5 Window Explainer Alert */}
      <div className="p-4 rounded-xl border border-brand-500/30 bg-brand-950/20 text-xs text-slate-300 flex items-start gap-3">
        <Info className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-brand-300">Rolling 5-Score Window Mechanism</p>
          <p className="text-slate-400 mt-0.5 leading-relaxed">
            Your active monthly draw ticket is composed strictly of your 5 latest rounds. Whenever you log a 6th round, our automated engine immediately records the new score and ejections the oldest chronological round to maintain exact competitive fairness.
          </p>
        </div>
      </div>

      {/* User Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/15 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Visual Draw Ticket Bar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active 5-Number Draw Combination
          </span>
          <Badge variant={scores.length === 5 ? "success" : "warning"}>
            {scores.length}/5 Scores Registered
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {scores.map((s, idx) => (
            <div
              key={s.id}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-brand-500/30 shadow-md"
            >
              <span className="text-xl font-black text-brand-400">{s.score}</span>
              <div className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
                <span className="font-semibold block text-slate-200">#{idx + 1}</span>
                <span>{s.played_date}</span>
              </div>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 5 - scores.length) }).map((_, i) => (
            <div
              key={i}
              className="px-6 py-3 rounded-xl border border-dashed border-slate-800 text-xs text-slate-600 font-semibold"
            >
              Slot {scores.length + i + 1} Empty
            </div>
          ))}
        </div>
      </Card>

      {/* Scores Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Stored Stableford Records (Max 5)</h3>
        </div>

        {scores.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Trophy className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-white">No scores registered yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first 18-hole Stableford round above to start participating in monthly draws.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Points (1-45)</th>
                  <th className="px-6 py-4">Date Played</th>
                  <th className="px-6 py-4">Course / Venue</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scores.map((s, index) => (
                  <tr key={s.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-400 font-black text-base">
                        {s.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {formatDate(s.played_date)}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {s.course_name || "Official Round"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                      {s.notes || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="success">Active #{index + 1}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Score"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setScoreToDelete(s);
                          setDeleteConfirmOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        title="Delete Score"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Score Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingScore ? "Edit Stableford Score" : "Log New Stableford Score"}
        description="Stableford scores must be between 1 and 45. One score per date permitted."
      >
        <form onSubmit={handleSaveScore} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Stableford Points (1 to 45)
            </label>
            <Input
              type="number"
              min={1}
              max={45}
              required
              value={scoreValue}
              onChange={(e) => setScoreValue(Number(e.target.value))}
              placeholder="36"
            />
            <p className="text-[11px] text-slate-500 mt-1">Must be an integer between 1 and 45 points.</p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Date Played
            </label>
            <Input
              type="date"
              required
              max={new Date().toISOString().split("T")[0]}
              value={playedDate}
              onChange={(e) => setPlayedDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Golf Course Name (Optional)
            </label>
            <Input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Pebble Beach Golf Links"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Round Notes (Optional)
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Strong wind on back 9, birdied hole 18"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingScore ? "Save Changes" : "Record Score"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Score Deletion"
        description="Are you sure you want to delete this score record? This action cannot be undone."
      >
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          Deleting this score will remove it from your active 5-number monthly draw combination.
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Yes, Delete Score
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
