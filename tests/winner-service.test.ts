import { describe, it, expect } from "vitest";
import { WinnerService, MAX_PROOF_FILE_SIZE_BYTES } from "@/lib/services/winner-service";
import { Winner } from "@/types";

describe("WinnerService", () => {
  const baseWinner: Winner = {
    id: "win-1",
    draw_id: "draw-1",
    user_id: "user-1",
    draw_entry_id: "entry-1",
    match_count: 4,
    prize_tier: "TIER_4",
    prize_amount: 1750,
    status: "PENDING_PROOF",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("validates proof upload file size and MIME type", () => {
    expect(WinnerService.validateProofFile(0, "image/png").isValid).toBe(false);
    expect(WinnerService.validateProofFile(MAX_PROOF_FILE_SIZE_BYTES + 1, "image/png").isValid).toBe(false);
    expect(WinnerService.validateProofFile(1024, "text/plain").isValid).toBe(false);
    expect(WinnerService.validateProofFile(1024, "image/png").isValid).toBe(true);
    expect(WinnerService.validateProofFile(1024, "application/pdf").isValid).toBe(true);
  });

  it("advances status from PENDING_PROOF to PROOF_SUBMITTED upon proof submission", () => {
    const res = WinnerService.submitProof(baseWinner, {
      fileUrl: "https://storage.example.com/proofs/card.png",
      fileName: "card.png",
      fileSize: 204800,
      mimeType: "image/png",
      notes: "Official club scorecard signed by captain",
    });

    expect(res.success).toBe(true);
    expect(res.winner?.status).toBe("PROOF_SUBMITTED");
    expect(res.winner?.proofs?.length).toBe(1);
    expect(res.proof?.file_name).toBe("card.png");
  });

  it("transitions PROOF_SUBMITTED to APPROVED and creates a pending payout", () => {
    const submittedWinner: Winner = {
      ...baseWinner,
      status: "PROOF_SUBMITTED",
    };

    const res = WinnerService.approveWinner(submittedWinner, "admin-uuid", "Scorecard verified on club system");
    expect(res.success).toBe(true);
    expect(res.winner?.status).toBe("APPROVED");
    expect(res.winner?.reviewed_by).toBe("admin-uuid");
    expect(res.payout?.amount).toBe(1750);
    expect(res.payout?.status).toBe("PENDING");
  });

  it("rejects proof with a mandatory note", () => {
    const submittedWinner: Winner = {
      ...baseWinner,
      status: "PROOF_SUBMITTED",
    };

    const resNoNote = WinnerService.rejectWinner(submittedWinner, "admin-uuid", "");
    expect(resNoNote.success).toBe(false);

    const res = WinnerService.rejectWinner(submittedWinner, "admin-uuid", "Scorecard date does not match draw date");
    expect(res.success).toBe(true);
    expect(res.winner?.status).toBe("REJECTED");
    expect(res.winner?.admin_notes).toContain("Scorecard date does not match");
  });

  it("transitions APPROVED to PAID with payment reference", () => {
    const approvedWinner: Winner = {
      ...baseWinner,
      status: "APPROVED",
    };

    const res = WinnerService.markPaid(approvedWinner, "admin-uuid", "STRIPE-TRANSFER-9948");
    expect(res.success).toBe(true);
    expect(res.winner?.status).toBe("PAID");
    expect(res.winner?.paid_at).toBeDefined();
    expect(res.winner?.admin_notes).toContain("STRIPE-TRANSFER-9948");
  });
});
