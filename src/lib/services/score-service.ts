import { GolfScore } from "@/types";

export interface ScoreInput {
  userId: string;
  score: number;
  playedDate: string; // YYYY-MM-DD
  courseName?: string | null;
  notes?: string | null;
}

export interface ScoreValidationResult {
  isValid: boolean;
  error?: string;
}

export class ScoreService {
  /**
   * Validates score value (must be integer between 1 and 45) and played date.
   */
  public static validateScore(score: number, playedDate: string): ScoreValidationResult {
    if (typeof score !== "number" || isNaN(score)) {
      return { isValid: false, error: "Score must be a valid number" };
    }

    if (!Number.isInteger(score)) {
      return { isValid: false, error: "Stableford score must be a whole number" };
    }

    if (score < 1 || score > 45) {
      return { isValid: false, error: "Stableford score must be between 1 and 45 points" };
    }

    if (!playedDate || typeof playedDate !== "string") {
      return { isValid: false, error: "Played date is required" };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(playedDate)) {
      return { isValid: false, error: "Invalid date format. Expected YYYY-MM-DD" };
    }

    const parsedDate = new Date(playedDate + "T00:00:00Z");
    if (isNaN(parsedDate.getTime())) {
      return { isValid: false, error: "Invalid calendar date" };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsedDate > today) {
      return { isValid: false, error: "Played date cannot be in the future" };
    }

    return { isValid: true };
  }

  /**
   * Applies the rolling 5-score logic:
   * 1. Checks if a score for this played date already exists (returns error if duplicate).
   * 2. If existing scores < 5, adds the new score.
   * 3. If existing scores == 5, adds the new score and removes the oldest score (chronologically by played_date).
   * 4. Returns sorted newest-first list of max 5 scores, and the removed score if any.
   */
  public static processRollingScore(
    existingScores: GolfScore[],
    newScoreData: {
      id?: string;
      userId: string;
      score: number;
      playedDate: string;
      courseName?: string | null;
      notes?: string | null;
    }
  ): {
    success: boolean;
    scores: GolfScore[];
    removedScoreId?: string;
    error?: string;
  } {
    const validation = this.validateScore(newScoreData.score, newScoreData.playedDate);
    if (!validation.isValid) {
      return { success: false, scores: existingScores, error: validation.error };
    }

    // Check duplicate date
    const hasDuplicate = existingScores.some(
      (s) => s.user_id === newScoreData.userId && s.played_date === newScoreData.playedDate
    );
    if (hasDuplicate) {
      return {
        success: false,
        scores: existingScores,
        error: `A score for date ${newScoreData.playedDate} already exists. Each date can only have one score.`,
      };
    }

    const newScore: GolfScore = {
      id: newScoreData.id || crypto.randomUUID(),
      user_id: newScoreData.userId,
      score: newScoreData.score,
      played_date: newScoreData.playedDate,
      course_name: newScoreData.courseName ?? null,
      notes: newScoreData.notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Combine and sort chronologically descending (newest first)
    const combined = [...existingScores, newScore];
    combined.sort((a, b) => new Date(b.played_date).getTime() - new Date(a.played_date).getTime());

    let removedScoreId: string | undefined;

    // If more than 5, remove the oldest (which is at the end of descending sort)
    if (combined.length > 5) {
      const removed = combined.pop();
      removedScoreId = removed?.id;
    }

    return {
      success: true,
      scores: combined,
      removedScoreId,
    };
  }

  /**
   * Updates an existing score, checking duplicate date conflict if date changed.
   */
  public static updateScore(
    existingScores: GolfScore[],
    scoreId: string,
    updateData: {
      score: number;
      playedDate: string;
      courseName?: string | null;
      notes?: string | null;
    }
  ): {
    success: boolean;
    scores: GolfScore[];
    error?: string;
  } {
    const validation = this.validateScore(updateData.score, updateData.playedDate);
    if (!validation.isValid) {
      return { success: false, scores: existingScores, error: validation.error };
    }

    const targetIndex = existingScores.findIndex((s) => s.id === scoreId);
    if (targetIndex === -1) {
      return { success: false, scores: existingScores, error: "Score record not found" };
    }

    const targetScore = existingScores[targetIndex];

    // Check duplicate date if changed
    if (targetScore.played_date !== updateData.playedDate) {
      const duplicate = existingScores.some(
        (s) => s.id !== scoreId && s.played_date === updateData.playedDate
      );
      if (duplicate) {
        return {
          success: false,
          scores: existingScores,
          error: `A score for date ${updateData.playedDate} already exists.`,
        };
      }
    }

    const updatedScores = existingScores.map((s) => {
      if (s.id === scoreId) {
        return {
          ...s,
          score: updateData.score,
          played_date: updateData.playedDate,
          course_name: updateData.courseName ?? s.course_name,
          notes: updateData.notes ?? s.notes,
          updated_at: new Date().toISOString(),
        };
      }
      return s;
    });

    // Re-sort newest first
    updatedScores.sort((a, b) => new Date(b.played_date).getTime() - new Date(a.played_date).getTime());

    return { success: true, scores: updatedScores };
  }

  /**
   * Deletes a score by ID.
   */
  public static deleteScore(
    existingScores: GolfScore[],
    scoreId: string
  ): {
    success: boolean;
    scores: GolfScore[];
    error?: string;
  } {
    const exists = existingScores.some((s) => s.id === scoreId);
    if (!exists) {
      return { success: false, scores: existingScores, error: "Score not found" };
    }

    const filtered = existingScores.filter((s) => s.id !== scoreId);
    return { success: true, scores: filtered };
  }
}
