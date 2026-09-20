"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { Winner } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Award,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ShieldCheck,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export default function DashboardWinningsPage() {
  const [currentUser, setCurrentUser] = React.useState(DataStore.getCurrentUser());
  const [winners, setWinners] = React.useState<Winner[]>([]);
  const [selectedWinner, setSelectedWinner] = React.useState<Winner | null>(null);

  // Proof Upload Dialog
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [fileUrl, setFileUrl] = React.useState("https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800");
  const [fileName, setFileName] = React.useState("official_scorecard_may2024.jpg");
  const [proofNotes, setProofNotes] = React.useState("");
  const [uploadFeedback, setUploadFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadWinners = React.useCallback(() => {
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);
    setWinners(DataStore.getUserWinners(user.id));
  }, []);

  React.useEffect(() => {
    loadWinners();
  }, [loadWinners]);

  const totalWon = winners.reduce((sum, w) => sum + Number(w.prize_amount), 0);
  const totalPaid = winners
    .filter((w) => w.status === "PAID")
    .reduce((sum, w) => sum + Number(w.prize_amount), 0);
  const totalPending = winners
    .filter((w) => w.status !== "PAID" && w.status !== "REJECTED")
    .reduce((sum, w) => sum + Number(w.prize_amount), 0);

  const handleOpenUpload = (w: Winner) => {
    setSelectedWinner(w);
    setFileName("official_signed_scorecard.jpg");
    setProofNotes("18-hole official club scorecard certified by handicap committee.");
    setUploadFeedback(null);
    setIsUploadOpen(true);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWinner) return;

    try {
      DataStore.submitWinnerProof(selectedWinner.id, {
        fileUrl,
        fileName,
        fileSize: 1024 * 350, // 350 KB
        mimeType: "image/jpeg",
        notes: proofNotes,
      });

      setUploadFeedback({
        type: "success",
        message: "Scorecard proof uploaded successfully! Compliance review is now underway.",
      });

      setTimeout(() => {
        setIsUploadOpen(false);
        loadWinners();
      }, 1500);
    } catch (err: unknown) {
      setUploadFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to submit proof.",
      });
    }
  };

  const getStatusBadge = (status: Winner["status"]) => {
    switch (status) {
      case "PENDING_PROOF":
        return <Badge variant="warning">Pending Proof Upload</Badge>;
      case "PROOF_SUBMITTED":
        return <Badge variant="outline">Under Admin Review</Badge>;
      case "APPROVED":
        return <Badge variant="success">Approved (Pending Payout)</Badge>;
      case "PAID":
        return <Badge variant="gold">Paid to Bank</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Proof Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Reward Winnings &amp; Verification
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your draw prizes, submit certified scorecard proofs, and track direct bank payouts.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Winnings</span>
          <p className="text-3xl font-black text-white mt-1">{formatCurrency(totalWon)}</p>
          <span className="text-[11px] text-slate-500">Cumulative prize awards</span>
        </Card>

        <Card className="p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Release</span>
          <p className="text-3xl font-black text-amber-400 mt-1">{formatCurrency(totalPending)}</p>
          <span className="text-[11px] text-slate-500">Awaiting proof review or ACH</span>
        </Card>

        <Card className="p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Paid Out</span>
          <p className="text-3xl font-black text-emerald-400 mt-1">{formatCurrency(totalPaid)}</p>
          <span className="text-[11px] text-slate-500">Completed disbursements</span>
        </Card>
      </div>

      {/* Winnings List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Winnings Ledger</h2>

        {winners.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">
            <Award className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-white font-semibold">No winnings recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Participate in the upcoming monthly draw to compete for the 40% rollover jackpot.
            </p>
          </Card>
        ) : (
          winners.map((w) => (
            <Card key={w.id} className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">
                      Draw #{w.draw?.draw_number || 102}: {w.draw?.title || "Reward Draw"}
                    </h3>
                    {getStatusBadge(w.status)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Matched <strong className="text-brand-400">{w.match_count} Numbers</strong> &middot; Tier: {w.prize_tier}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Prize Amount</span>
                  <p className="text-3xl font-black text-amber-400">
                    {formatCurrency(w.prize_amount)}
                  </p>
                </div>
              </div>

              {/* Status workflow banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs">
                <div className="space-y-1 text-slate-300">
                  <p>
                    <strong>Compliance Review Notes:</strong>{" "}
                    <span className="text-slate-400">{w.admin_notes || "None recorded yet."}</span>
                  </p>
                  {w.paid_at && (
                    <p className="text-emerald-400 font-semibold">
                      Paid on {formatDate(w.paid_at)} via Electronic ACH Transfer
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  {(w.status === "PENDING_PROOF" || w.status === "REJECTED") && (
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => handleOpenUpload(w)}
                      className="gap-2"
                    >
                      <UploadCloud className="h-4 w-4" />
                      Submit Official Scorecard Proof
                    </Button>
                  )}
                  {w.status === "PROOF_SUBMITTED" && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4 text-amber-400 animate-spin" />
                      Proof submitted. Compliance review in progress.
                    </div>
                  )}
                  {w.status === "APPROVED" && (
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      Proof verified. Payout queued for disbursement.
                    </div>
                  )}
                  {w.status === "PAID" && (
                    <div className="flex items-center gap-2 text-brand-400 font-semibold">
                      <ShieldCheck className="h-4 w-4" />
                      Payout completed successfully.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Upload Proof Modal */}
      <Dialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Submit Winner Scorecard Verification"
        description="To maintain full sporting and financial integrity, please provide a clear image or scan of your signed Stableford scorecard."
      >
        {uploadFeedback ? (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              uploadFeedback.type === "success"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "bg-red-500/15 text-red-300 border border-red-500/30"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{uploadFeedback.message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                File Attachment (JPEG, PNG, WebP, PDF &le; 5MB)
              </label>
              <div className="p-6 border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl bg-slate-950 text-center cursor-pointer transition-colors">
                <UploadCloud className="h-8 w-8 text-brand-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">{fileName}</p>
                <p className="text-[10px] text-slate-500 mt-1">Simulated Supabase Storage upload</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Verification Details &amp; Notes
              </label>
              <Input
                type="text"
                required
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                placeholder="Club name, marker signature, or competition details"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              <strong className="text-slate-300">Fraud Prevention Policy:</strong> Scorecards are cross-referenced with national handicap databases and tournament markers before prize funds are released.
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Upload &amp; Request Review
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
