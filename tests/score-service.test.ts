import { describe, it, expect } from "vitest";
import { ScoreService } from "@/lib/services/score-service";
import { GolfScore } from "@/types";

describe("ScoreService", () => {
  it("validates that scores must be integers between 1 and 45", () => {
    expect(ScoreService.validateScore(0, "2024-05-01").isValid).toBe(false);
    expect(ScoreService.validateScore(46, "2024-05-01").isValid).toBe(false);
    expect(ScoreService.validateScore(36.5, "2024-05-01").isValid).toBe(false);
    expect(ScoreService.validateScore(36, "2024-05-01").isValid).toBe(true);
    expect(ScoreService.validateScore(1, "2024-05-01").isValid).toBe(true);
    expect(ScoreService.validateScore(45, "2024-05-01").isValid).toBe(true);
  });

  it("rejects future dates", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split("T")[0];
    const res = ScoreService.validateScore(35, dateStr);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("future");
  });

  it("prevents duplicate dates for the same user", () => {
    const existing: GolfScore[] = [
      {
        id: "score-1",
        user_id: "user-1",
        score: 34,
        played_date: "2024-05-10",
        course_name: "St Andrews",
        notes: null,
        created_at: "2024-05-10T10:00:00Z",
        updated_at: "2024-05-10T10:00:00Z",
      },
    ];

    const res = ScoreService.processRollingScore(existing, {
      userId: "user-1",
      score: 38,
      playedDate: "2024-05-10", // duplicate
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("already exists");
    expect(res.scores.length).toBe(1);
  });

  it("adds scores normally if user has fewer than 5 scores", () => {
    const existing: GolfScore[] = [
      {
        id: "score-1",
        user_id: "user-1",
        score: 34,
        played_date: "2024-05-01",
        course_name: null,
        notes: null,
        created_at: "2024-05-01T10:00:00Z",
        updated_at: "2024-05-01T10:00:00Z",
      },
    ];

    const res = ScoreService.processRollingScore(existing, {
      userId: "user-1",
      score: 38,
      playedDate: "2024-05-02",
    });

    expect(res.success).toBe(true);
    expect(res.scores.length).toBe(2);
    expect(res.removedScoreId).toBeUndefined();
    // Newest first
    expect(res.scores[0].played_date).toBe("2024-05-02");
    expect(res.scores[1].played_date).toBe("2024-05-01");
  });

  it("automatically removes oldest score when 6th score is added (rolling 5 limit)", () => {
    const existing: GolfScore[] = [
      { id: "1", user_id: "u1", score: 30, played_date: "2024-05-05", created_at: "", updated_at: "" },
      { id: "2", user_id: "u1", score: 32, played_date: "2024-05-04", created_at: "", updated_at: "" },
      { id: "3", user_id: "u1", score: 34, played_date: "2024-05-03", created_at: "", updated_at: "" },
      { id: "4", user_id: "u1", score: 36, played_date: "2024-05-02", created_at: "", updated_at: "" },
      { id: "5", user_id: "u1", score: 38, played_date: "2024-05-01", created_at: "", updated_at: "" }, // oldest
    ];

    const res = ScoreService.processRollingScore(existing, {
      userId: "u1",
      score: 40,
      playedDate: "2024-05-06", // newest
    });

    expect(res.success).toBe(true);
    expect(res.scores.length).toBe(5);
    expect(res.removedScoreId).toBe("5");
    expect(res.scores[0].played_date).toBe("2024-05-06");
    expect(res.scores.some((s) => s.id === "5")).toBe(false);
  });
});
