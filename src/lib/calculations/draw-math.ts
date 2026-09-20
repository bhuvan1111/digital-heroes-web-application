export const PRIZE_TIER_PERCENTAGES = {
  TIER_5_JACKPOT: 0.40,
  TIER_4: 0.35,
  TIER_3: 0.25,
} as const;

/**
 * Calculates Laplace smoothed weights (+1 smoothing) for score frequency distribution
 */
export function calculateLaplaceWeights(
  frequencyMap: Record<number, number>,
  minNum: number = 1,
  maxNum: number = 45
): Array<{ num: number; weight: number }> {
  return Array.from({ length: maxNum - minNum + 1 }, (_, i) => {
    const num = minNum + i;
    return { num, weight: (frequencyMap[num] || 0) + 1 };
  });
}

/**
 * Calculates prize pools, winner splits, and rollover according to PRD
 */
export function computePrizeAllocations(
  totalPrizePool: number,
  rolloverIn: number,
  tier5WinnersCount: number,
  tier4WinnersCount: number,
  tier3WinnersCount: number
) {
  const newPool = Math.max(0, totalPrizePool);
  const tier5Pool = Math.round((newPool * PRIZE_TIER_PERCENTAGES.TIER_5_JACKPOT + rolloverIn) * 100) / 100;
  const tier4Pool = Math.round(newPool * PRIZE_TIER_PERCENTAGES.TIER_4 * 100) / 100;
  const tier3Pool = Math.round(newPool * PRIZE_TIER_PERCENTAGES.TIER_3 * 100) / 100;

  const tier5PayoutPerWinner =
    tier5WinnersCount > 0 ? Math.floor((tier5Pool / tier5WinnersCount) * 100) / 100 : 0;
  const jackpotRolloverOut = tier5WinnersCount === 0 ? tier5Pool : 0;

  const tier4PayoutPerWinner =
    tier4WinnersCount > 0 ? Math.floor((tier4Pool / tier4WinnersCount) * 100) / 100 : 0;
  const tier3PayoutPerWinner =
    tier3WinnersCount > 0 ? Math.floor((tier3Pool / tier3WinnersCount) * 100) / 100 : 0;

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
