import {
  AlgorithmMetadata,
  Draw,
  DrawEntry,
  DrawMode,
  DrawSimulationResult,
  GolfScore,
  PrizePool,
  PrizeTier,
} from "@/types";

export interface Participant {
  userId: string;
  numbers: number[]; // 5 numbers (from scores)
  scores?: GolfScore[];
}

export interface DrawSimulationParams {
  draw: Draw;
  participants: Participant[];
  mode?: DrawMode;
  seed?: string;
  allParticipantScores?: GolfScore[];
}

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
function createSeededRNG(seedStr: string): () => number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0;
  }
  let a = h >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class DrawEngine {
  public static readonly MIN_NUMBER = 1;
  public static readonly MAX_NUMBER = 45;
  public static readonly NUMBERS_COUNT = 5;

  public static readonly TIER_5_SHARE = 0.40; // 40% Jackpot
  public static readonly TIER_4_SHARE = 0.35; // 35%
  public static readonly TIER_3_SHARE = 0.25; // 25%

  /**
   * Generates a random set of 5 distinct numbers between 1 and 45.
   * If a seed is passed, generation is 100% deterministic and reproducible.
   */
  public static generateRandomDraw(seed?: string): { numbers: number[]; seed?: string } {
    const rng = seed ? createSeededRNG(seed) : Math.random;
    const pool = Array.from({ length: this.MAX_NUMBER }, (_, i) => i + 1);
    const selected: number[] = [];

    while (selected.length < this.NUMBERS_COUNT && pool.length > 0) {
      const idx = Math.floor(rng() * pool.length);
      selected.push(pool[idx]);
      pool.splice(idx, 1);
    }

    selected.sort((a, b) => a - b);
    return { numbers: selected, seed };
  }

  /**
   * Generates an algorithmic draw weighted by participant score frequency.
   *
   * Mechanism:
   * 1. Aggregates all golf scores across eligible participants.
   * 2. Builds a frequency histogram for all numbers between 1 and 45.
   * 3. Applies Laplace smoothing (+1 count) to guarantee every number has a non-zero probability.
   * 4. Normalizes weights: W(n) = (count(n) + 1) / total_weight.
   * 5. Samples 5 distinct numbers without replacement using weighted roulette wheel selection.
   * 6. Returns selected numbers and complete algorithm audit metadata.
   */
  public static generateAlgorithmicDraw(
    scores: GolfScore[],
    seed?: string
  ): {
    numbers: number[];
    metadata: AlgorithmMetadata;
  } {
    const rng = seed ? createSeededRNG(seed) : Math.random;

    // 1. Build frequency map for numbers 1 to 45
    const frequencyMap: Record<number, number> = {};
    for (let i = this.MIN_NUMBER; i <= this.MAX_NUMBER; i++) {
      frequencyMap[i] = 0;
    }

    scores.forEach((s) => {
      if (s.score >= this.MIN_NUMBER && s.score <= this.MAX_NUMBER) {
        frequencyMap[s.score] = (frequencyMap[s.score] || 0) + 1;
      }
    });

    // 2. Apply Laplace smoothing (+1) and create selectable items
    let items = Array.from({ length: this.MAX_NUMBER }, (_, i) => {
      const num = i + 1;
      return { num, weight: (frequencyMap[num] || 0) + 1 };
    });

    const selected: number[] = [];

    // 3. Weighted sampling without replacement
    while (selected.length < this.NUMBERS_COUNT && items.length > 0) {
      const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
      const threshold = rng() * totalWeight;

      let running = 0;
      let chosenIndex = 0;
      for (let i = 0; i < items.length; i++) {
        running += items[i].weight;
        if (running >= threshold) {
          chosenIndex = i;
          break;
        }
      }

      selected.push(items[chosenIndex].num);
      items.splice(chosenIndex, 1);
    }

    selected.sort((a, b) => a - b);

    // Normalize weights summary for auditing (percentage share)
    const totalWeights = Object.values(frequencyMap).reduce((a, b) => a + b + 1, 0);
    const weightsSummary: Record<number, number> = {};
    for (let i = this.MIN_NUMBER; i <= this.MAX_NUMBER; i++) {
      weightsSummary[i] = Number((((frequencyMap[i] + 1) / totalWeights) * 100).toFixed(2));
    }

    const metadata: AlgorithmMetadata = {
      description: "Frequency-weighted draw with Laplace (+1) smoothing and roulette sampling",
      total_participant_scores: scores.length,
      unique_score_values: Object.values(frequencyMap).filter((v) => v > 0).length,
      seed: seed || undefined,
      weights_summary: weightsSummary,
      generated_at: new Date().toISOString(),
    };

    return { numbers: selected, metadata };
  }

  /**
   * Compares participant numbers against winning numbers.
   */
  public static calculateMatches(
    participantNumbers: number[],
    winningNumbers: number[]
  ): {
    matchCount: number;
    matchedNumbers: number[];
    tier: PrizeTier;
  } {
    const winningSet = new Set(winningNumbers);
    const matchedNumbers = participantNumbers.filter((n) => winningSet.has(n));
    const matchCount = matchedNumbers.length;

    let tier: PrizeTier = "NONE";
    if (matchCount === 5) {
      tier = "JACKPOT_5";
    } else if (matchCount === 4) {
      tier = "TIER_4";
    } else if (matchCount === 3) {
      tier = "TIER_3";
    }

    return {
      matchCount,
      matchedNumbers: matchedNumbers.sort((a, b) => a - b),
      tier,
    };
  }

  /**
   * Calculates prize pool allocations, winner shares, and jackpot rollover according to the PRD:
   * - 5-match (Jackpot): 40%
   * - 4-match: 35%
   * - 3-match: 25%
   * - Multiple winners divide tier pool equally.
   * - Unclaimed 5-match jackpot rolls over to the next draw.
   * - Unclaimed 4-match and 3-match pools do not roll over.
   */
  public static calculatePrizePool(
    totalPrizePool: number,
    jackpotRolloverIn: number,
    tier5Count: number,
    tier4Count: number,
    tier3Count: number
  ): {
    tier5Pool: number;
    tier4Pool: number;
    tier3Pool: number;
    tier5PayoutPerWinner: number;
    tier4PayoutPerWinner: number;
    tier3PayoutPerWinner: number;
    jackpotRolloverOut: number;
  } {
    // Current draw's newly contributed prize pool
    const newPool = Math.max(0, totalPrizePool);
    // Tier 5 includes previous rollover
    const tier5Pool = Math.round((newPool * this.TIER_5_SHARE + jackpotRolloverIn) * 100) / 100;
    const tier4Pool = Math.round(newPool * this.TIER_4_SHARE * 100) / 100;
    const tier3Pool = Math.round(newPool * this.TIER_3_SHARE * 100) / 100;

    let tier5PayoutPerWinner = 0;
    let jackpotRolloverOut = 0;

    if (tier5Count > 0) {
      tier5PayoutPerWinner = Math.floor((tier5Pool / tier5Count) * 100) / 100;
      jackpotRolloverOut = 0;
    } else {
      // Jackpot rolls over to next draw
      jackpotRolloverOut = tier5Pool;
    }

    const tier4PayoutPerWinner =
      tier4Count > 0 ? Math.floor((tier4Pool / tier4Count) * 100) / 100 : 0;
    const tier3PayoutPerWinner =
      tier3Count > 0 ? Math.floor((tier3Pool / tier3Count) * 100) / 100 : 0;

    return {
      tier5Pool,
      tier4Pool,
      tier3Pool,
      tier5PayoutPerWinner,
      tier4PayoutPerWinner,
      tier3PayoutPerWinner,
      jackpotRolloverOut,
    };
  }

  /**
   * Simulates a draw in memory without modifying persistent data.
   */
  public static simulateDraw(params: DrawSimulationParams): DrawSimulationResult {
    const mode = params.mode || params.draw.mode || "RANDOM";
    const seed = params.seed || params.draw.simulation_seed || `sim-${Date.now()}`;

    let winningNumbers: number[] = [];
    let algorithmMetadata: AlgorithmMetadata | undefined;

    if (mode === "ALGORITHMIC") {
      const allScores = params.allParticipantScores || [];
      const result = this.generateAlgorithmicDraw(allScores, seed);
      winningNumbers = result.numbers;
      algorithmMetadata = result.metadata;
    } else {
      const result = this.generateRandomDraw(seed);
      winningNumbers = result.numbers;
    }

    // Evaluate all participants
    const allEntries: DrawEntry[] = [];
    const tier5Winners: DrawEntry[] = [];
    const tier4Winners: DrawEntry[] = [];
    const tier3Winners: DrawEntry[] = [];

    params.participants.forEach((p) => {
      const match = this.calculateMatches(p.numbers, winningNumbers);
      const entry: DrawEntry = {
        id: crypto.randomUUID(),
        draw_id: params.draw.id,
        user_id: p.userId,
        numbers: p.numbers,
        match_count: match.matchCount,
        matched_numbers: match.matchedNumbers,
        prize_tier: match.tier,
        prize_amount: 0,
        created_at: new Date().toISOString(),
      };

      if (match.tier === "JACKPOT_5") {
        tier5Winners.push(entry);
      } else if (match.tier === "TIER_4") {
        tier4Winners.push(entry);
      } else if (match.tier === "TIER_3") {
        tier3Winners.push(entry);
      }
      allEntries.push(entry);
    });

    const poolCalcs = this.calculatePrizePool(
      params.draw.total_prize_pool,
      params.draw.jackpot_rollover_in || 0,
      tier5Winners.length,
      tier4Winners.length,
      tier3Winners.length
    );

    // Assign prize amounts to winners
    tier5Winners.forEach((e) => (e.prize_amount = poolCalcs.tier5PayoutPerWinner));
    tier4Winners.forEach((e) => (e.prize_amount = poolCalcs.tier4PayoutPerWinner));
    tier3Winners.forEach((e) => (e.prize_amount = poolCalcs.tier3PayoutPerWinner));

    return {
      drawId: params.draw.id,
      mode,
      winningNumbers,
      seed,
      totalParticipants: params.participants.length,
      totalPrizePool: params.draw.total_prize_pool,
      jackpotRolloverIn: params.draw.jackpot_rollover_in || 0,
      jackpotRolloverOut: poolCalcs.jackpotRolloverOut,
      tier5Winners,
      tier4Winners,
      tier3Winners,
      tier5PayoutPerWinner: poolCalcs.tier5PayoutPerWinner,
      tier4PayoutPerWinner: poolCalcs.tier4PayoutPerWinner,
      tier3PayoutPerWinner: poolCalcs.tier3PayoutPerWinner,
      allEntries,
      algorithmMetadata,
    };
  }
}
