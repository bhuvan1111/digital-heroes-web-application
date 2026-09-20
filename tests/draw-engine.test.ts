import { describe, it, expect } from "vitest";
import { DrawEngine } from "@/lib/services/draw-engine";
import { Draw, GolfScore } from "@/types";

describe("DrawEngine", () => {
  it("generates 5 unique numbers between 1 and 45 in ascending order", () => {
    const res = DrawEngine.generateRandomDraw();
    expect(res.numbers.length).toBe(5);
    // Check range
    res.numbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(45);
    });
    // Check uniqueness
    const set = new Set(res.numbers);
    expect(set.size).toBe(5);
    // Check ascending order
    for (let i = 0; i < res.numbers.length - 1; i++) {
      expect(res.numbers[i]).toBeLessThan(res.numbers[i + 1]);
    }
  });

  it("is 100% deterministic when a seed is provided", () => {
    const seed = "test-reproducible-seed-2024";
    const res1 = DrawEngine.generateRandomDraw(seed);
    const res2 = DrawEngine.generateRandomDraw(seed);
    expect(res1.numbers).toEqual(res2.numbers);
  });

  it("generates algorithmic draw weighted by participant score frequencies", () => {
    // Participant scores heavily concentrated around 36 and 38
    const mockScores: GolfScore[] = [
      { id: "1", user_id: "u1", score: 36, played_date: "2024-05-01", created_at: "", updated_at: "" },
      { id: "2", user_id: "u1", score: 36, played_date: "2024-05-02", created_at: "", updated_at: "" },
      { id: "3", user_id: "u2", score: 36, played_date: "2024-05-01", created_at: "", updated_at: "" },
      { id: "4", user_id: "u3", score: 38, played_date: "2024-05-01", created_at: "", updated_at: "" },
      { id: "5", user_id: "u4", score: 38, played_date: "2024-05-01", created_at: "", updated_at: "" },
    ];

    const res = DrawEngine.generateAlgorithmicDraw(mockScores, "seed-algo-123");
    expect(res.numbers.length).toBe(5);
    expect(new Set(res.numbers).size).toBe(5);
    expect(res.metadata.total_participant_scores).toBe(5);
    expect(res.metadata.description).toContain("Laplace");
  });

  it("calculates match counts and tier classifications accurately", () => {
    const winningNumbers = [5, 12, 23, 34, 41];

    // 5 match (Jackpot)
    const res5 = DrawEngine.calculateMatches([5, 12, 23, 34, 41], winningNumbers);
    expect(res5.matchCount).toBe(5);
    expect(res5.tier).toBe("JACKPOT_5");

    // 4 match
    const res4 = DrawEngine.calculateMatches([5, 12, 23, 34, 18], winningNumbers);
    expect(res4.matchCount).toBe(4);
    expect(res4.tier).toBe("TIER_4");

    // 3 match
    const res3 = DrawEngine.calculateMatches([5, 12, 23, 7, 18], winningNumbers);
    expect(res3.matchCount).toBe(3);
    expect(res3.tier).toBe("TIER_3");

    // 2 match (No prize)
    const res2 = DrawEngine.calculateMatches([5, 12, 1, 2, 3], winningNumbers);
    expect(res2.matchCount).toBe(2);
    expect(res2.tier).toBe("NONE");
  });

  it("distributes prize pools according to PRD: 40% Tier 5, 35% Tier 4, 25% Tier 3", () => {
    const totalPrizePool = 10000; // $10,000
    const rolloverIn = 0;

    // 1 winner in Tier 5, 2 in Tier 4, 5 in Tier 3
    const calcs = DrawEngine.calculatePrizePool(totalPrizePool, rolloverIn, 1, 2, 5);

    // Tier 5: 40% = $4,000. 1 winner gets $4,000
    expect(calcs.tier5Pool).toBe(4000);
    expect(calcs.tier5PayoutPerWinner).toBe(4000);
    expect(calcs.jackpotRolloverOut).toBe(0);

    // Tier 4: 35% = $3,500. 2 winners get $1,750 each
    expect(calcs.tier4Pool).toBe(3500);
    expect(calcs.tier4PayoutPerWinner).toBe(1750);

    // Tier 3: 25% = $2,500. 5 winners get $500 each
    expect(calcs.tier3Pool).toBe(2500);
    expect(calcs.tier3PayoutPerWinner).toBe(500);
  });

  it("rolls over Tier 5 jackpot when there are no 5-number winners", () => {
    const totalPrizePool = 10000;
    const rolloverIn = 2500; // $2,500 from previous draw

    // 0 winners in Tier 5
    const calcs = DrawEngine.calculatePrizePool(totalPrizePool, rolloverIn, 0, 1, 2);

    // Total Tier 5 pool = 40% of 10,000 (4,000) + rollover (2,500) = 6,500
    expect(calcs.tier5Pool).toBe(6500);
    expect(calcs.tier5PayoutPerWinner).toBe(0);
    expect(calcs.jackpotRolloverOut).toBe(6500); // Entire Tier 5 rolls over
  });

  it("simulates a draw without mutating database or permanent state", () => {
    const mockDraw: Draw = {
      id: "draw-sim-test",
      draw_number: 101,
      title: "June 2024 Reward Draw",
      draw_date: "2024-06-30T18:00:00Z",
      status: "DRAFT",
      mode: "RANDOM",
      total_participants: 3,
      total_prize_pool: 5000,
      jackpot_rollover_in: 1000,
      jackpot_rollover_out: 0,
      created_at: "",
      updated_at: "",
    };

    const participants = [
      { userId: "u1", numbers: [3, 10, 15, 22, 40] },
      { userId: "u2", numbers: [7, 12, 18, 25, 33] },
      { userId: "u3", numbers: [5, 14, 21, 30, 42] },
    ];

    const sim = DrawEngine.simulateDraw({
      draw: mockDraw,
      participants,
      seed: "sim-stable-seed",
    });

    expect(sim.drawId).toBe("draw-sim-test");
    expect(sim.winningNumbers.length).toBe(5);
    expect(sim.allEntries.length).toBe(3);
    // Draw status is untouched in input
    expect(mockDraw.status).toBe("DRAFT");
  });
});
