import { Winner, WinnerProof, WinnerStatus, Payout } from "@/types";

export const ALLOWED_PROOF_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
export const MAX_PROOF_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class WinnerService {
  /**
   * Validates uploaded winner proof file properties.
   */
  public static validateProofFile(
    fileSize: number,
    mimeType: string
  ): { isValid: boolean; error?: string } {
    if (!fileSize || fileSize <= 0) {
      return { isValid: false, error: "Uploaded file is empty" };
    }
    if (fileSize > MAX_PROOF_FILE_SIZE_BYTES) {
      return { isValid: false, error: "File exceeds the 5MB size limit" };
    }
    if (!ALLOWED_PROOF_MIME_TYPES.includes(mimeType)) {
      return {
        isValid: false,
        error: "Invalid file type. Allowed formats: JPEG, PNG, WebP, PDF",
      };
    }
    return { isValid: true };
  }

  /**
   * Transitions winner status to PROOF_SUBMITTED when user submits scorecard proof.
   */
  public static submitProof(
    winner: Winner,
    proofData: {
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      notes?: string | null;
    }
  ): {
    success: boolean;
    winner?: Winner;
    proof?: WinnerProof;
    error?: string;
  } {
    if (winner.status !== "PENDING_PROOF" && winner.status !== "REJECTED") {
      return {
        success: false,
        error: `Cannot upload proof for winner with status "${winner.status}".`,
      };
    }

    const validation = this.validateProofFile(proofData.fileSize, proofData.mimeType);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const newProof: WinnerProof = {
      id: crypto.randomUUID(),
      winner_id: winner.id,
      file_url: proofData.fileUrl,
      file_name: proofData.fileName,
      file_size: proofData.fileSize,
      mime_type: proofData.mimeType,
      notes: proofData.notes ?? null,
      uploaded_at: new Date().toISOString(),
    };

    const updatedWinner: Winner = {
      ...winner,
      status: "PROOF_SUBMITTED",
      updated_at: new Date().toISOString(),
      proofs: [...(winner.proofs || []), newProof],
    };

    return {
      success: true,
      winner: updatedWinner,
      proof: newProof,
    };
  }

  /**
   * Admin approves a winner's submitted proof.
   */
  public static approveWinner(
    winner: Winner,
    adminId: string,
    adminNotes?: string
  ): {
    success: boolean;
    winner?: Winner;
    payout?: Payout;
    error?: string;
  } {
    if (winner.status !== "PROOF_SUBMITTED") {
      return {
        success: false,
        error: `Cannot approve winner with status "${winner.status}". Proof must be submitted first.`,
      };
    }

    const updatedWinner: Winner = {
      ...winner,
      status: "APPROVED",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || winner.admin_notes,
      updated_at: new Date().toISOString(),
    };

    const payout: Payout = {
      id: crypto.randomUUID(),
      winner_id: winner.id,
      user_id: winner.user_id,
      amount: winner.prize_amount,
      status: "PENDING",
      payment_method: "bank_transfer",
      created_at: new Date().toISOString(),
    };

    return { success: true, winner: updatedWinner, payout };
  }

  /**
   * Admin rejects a winner's submitted proof.
   */
  public static rejectWinner(
    winner: Winner,
    adminId: string,
    reason: string
  ): {
    success: boolean;
    winner?: Winner;
    error?: string;
  } {
    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "A rejection reason must be provided" };
    }

    if (winner.status !== "PROOF_SUBMITTED") {
      return {
        success: false,
        error: `Cannot reject winner with status "${winner.status}".`,
      };
    }

    const updatedWinner: Winner = {
      ...winner,
      status: "REJECTED",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: `[REJECTED]: ${reason}`,
      updated_at: new Date().toISOString(),
    };

    return { success: true, winner: updatedWinner };
  }

  /**
   * Admin marks a winner's payout as PAID.
   */
  public static markPaid(
    winner: Winner,
    adminId: string,
    paymentRef: string
  ): {
    success: boolean;
    winner?: Winner;
    error?: string;
  } {
    if (winner.status !== "APPROVED") {
      return {
        success: false,
        error: `Cannot pay out a winner with status "${winner.status}". Winner must be APPROVED first.`,
      };
    }

    const updatedWinner: Winner = {
      ...winner,
      status: "PAID",
      paid_at: new Date().toISOString(),
      admin_notes: winner.admin_notes
        ? `${winner.admin_notes} | Payout Ref: ${paymentRef}`
        : `Payout Ref: ${paymentRef}`,
      updated_at: new Date().toISOString(),
    };

    return { success: true, winner: updatedWinner };
  }
}
