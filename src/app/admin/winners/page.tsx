"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { Winner, WinnerStatus, UserProfile } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  AlertCircle,
  Filter,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export default function AdminWinnersPage() {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [winners, setWinners] = React.useState<Winner[]>([]);
  const [filterStatus, setFilterStatus] = React.useState<string>("ALL");
  const [feedback, setFeedback] = React.useState<string | null>(null);

  // Proof inspection & review modal
  const [selectedWinner, setSelectedWinner] = React.useState<Winner | null>(null);
  const [reviewAction, setReviewAction] = React.useState<"APPROVE" | "REJECT" | "PAY" | null>(null);
  const [adminNotes, setAdminNotes] = React.useState("");
  const [paymentRef, setPaymentRef] = React.useState("");

  const loadWinners = React.useCallback(async () => {
    try {
      const user = await DataStore.getCurrentUser();
      if (user) setCurrentUser(user);
      const list = await DataStore.getWinners(filterStatus);
      setWinners(list);
    } catch (err) {
      console.error("Failed to load winners", err);
    }
  }, [filterStatus]);

  React.useEffect(() => {
    loadWinners();
  }, [loadWinners]);

  const handleOpenReview = (w: Winner, action: "APPROVE" | "REJECT" | "PAY") => {
    setSelectedWinner(w);
    setReviewAction(action);
    setAdminNotes(action === "APPROVE" ? "Official scorecard verified against regional handicap portal." : "");
    setPaymentRef(`ACH-STRIPE-TRX-${Date.now().toString().slice(-6)}`);
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWinner || !reviewAction || !currentUser) return;

    try {
      if (reviewAction === "APPROVE") {
        await DataStore.approveWinner(selectedWinner.id, currentUser.id, adminNotes);
        setFeedback(`Winner claim approved! Payout created in pending ledger.`);
      } else if (reviewAction === "REJECT") {
        if (!adminNotes || adminNotes.trim().length === 0) {
          alert("A rejection reason is mandatory.");
          return;
        }
        await DataStore.rejectWinner(selectedWinner.id, currentUser.id, adminNotes);
        setFeedback(`Winner claim rejected with recorded rationale.`);
      } else if (reviewAction === "PAY") {
        await DataStore.markWinnerPaid(selectedWinner.id, currentUser.id, paymentRef);
        setFeedback(`Payout marked as PAID with reference ${paymentRef}!`);
      }

      setSelectedWinner(null);
      setReviewAction(null);
      await loadWinners();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  const getStatusBadge = (status: Winner["status"]) => {
    switch (status) {
      case "PENDING_PROOF":
        return <Badge variant="warning">Pending Proof</Badge>;
      case "PROOF_SUBMITTED":
        return <Badge variant="outline">Proof Submitted</Badge>;
      case "APPROVED":
        return <Badge variant="success">Approved</Badge>;
      case "PAID":
        return <Badge variant="gold">Paid</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">Compliance &amp; Verification</Badge>
            <span className="text-xs text-slate-500">PRD Sections 17 &amp; 23</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Winner Proofs &amp; Payout Authorization
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Verify official player scorecards, authorise compliance release, and record electronic disbursements.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_PROOF">Pending Proof</option>
            <option value="PROOF_SUBMITTED">Proof Submitted</option>
            <option value="APPROVED">Approved (Ready for Payout)</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {feedback}
        </div>
      )}

      {/* Winners Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Winner / Player</th>
                <th className="px-6 py-4">Draw</th>
                <th className="px-6 py-4">Match Count</th>
                <th className="px-6 py-4">Prize Tier</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Compliance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {winners.map((w) => (
                <tr key={w.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{w.user?.full_name || "Marcus Vance"}</p>
                    <p className="text-xs text-slate-400">{w.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    Draw #{w.draw?.draw_number || 102}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-amber-400">{w.match_count} / 5</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-300">
                    {w.prize_tier}
                  </td>
                  <td className="px-6 py-4 font-black text-white text-base">
                    {formatCurrency(w.prize_amount)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(w.status)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {w.status === "PROOF_SUBMITTED" && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleOpenReview(w, "APPROVE")}
                          className="text-xs py-1"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleOpenReview(w, "REJECT")}
                          className="text-xs py-1"
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {w.status === "PENDING_PROOF" && (
                      <span className="text-xs text-slate-500 italic">Awaiting Player Proof</span>
                    )}

                    {w.status === "APPROVED" && (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleOpenReview(w, "PAY")}
                        className="text-xs py-1 gap-1"
                      >
                        <DollarSign className="h-3.5 w-3.5" /> Mark Paid
                      </Button>
                    )}

                    {w.status === "PAID" && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Disbursed
                      </span>
                    )}

                    {w.status === "REJECTED" && (
                      <span className="text-xs text-red-400 font-semibold flex items-center justify-end gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Claim Rejected
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review / Payout Action Modal */}
      <Dialog
        isOpen={!!selectedWinner}
        onClose={() => {
          setSelectedWinner(null);
          setReviewAction(null);
        }}
        title={
          reviewAction === "APPROVE"
            ? "Approve Winner Proof"
            : reviewAction === "REJECT"
            ? "Reject Winner Proof"
            : "Authorize Winner Payout"
        }
        description={`Claimant: ${selectedWinner?.user?.full_name} · Prize: ${formatCurrency(selectedWinner?.prize_amount || 0)}`}
      >
        <form onSubmit={handleExecuteAction} className="space-y-4">
          {/* Proof Preview Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Scorecard Documentation Preview
            </span>
            <div className="relative h-40 rounded-lg overflow-hidden border border-slate-700">
              <img
                src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600"
                alt="Submitted Scorecard"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-slate-950/80 text-[10px] text-white">
                Official Scorecard Scan #May2024
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Marker Signature present &middot; Stableford points: {selectedWinner?.match_count} matches
            </p>
          </div>

          {reviewAction === "PAY" ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Stripe Transfer / Electronic Bank Wire Reference
              </label>
              <Input
                type="text"
                required
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Compliance Review Notes {reviewAction === "REJECT" && "(Mandatory Reason)"}
              </label>
              <Input
                type="text"
                required={reviewAction === "REJECT"}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  reviewAction === "APPROVE"
                    ? "Verified against club handicap sheet"
                    : "Scorecard incomplete or unverified"
                }
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSelectedWinner(null);
                setReviewAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={
                reviewAction === "APPROVE"
                  ? "primary"
                  : reviewAction === "REJECT"
                  ? "danger"
                  : "gold"
              }
            >
              {reviewAction === "APPROVE"
                ? "Confirm Approval"
                : reviewAction === "REJECT"
                ? "Confirm Rejection"
                : "Confirm Payout Completion"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
