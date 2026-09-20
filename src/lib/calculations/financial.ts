import { PlanType } from "@/types";

export const PLAN_AMOUNTS = {
  monthly: 3900, // in cents
  yearly: 39000, // in cents
} as const;

export const PRIZE_POOL_PERCENTAGE = 40;
export const MIN_CHARITY_PERCENTAGE = 10;
export const MAX_CHARITY_PERCENTAGE = 100;

/**
 * Calculates charity pledge in integer cents
 */
export function calculateCharityContributionCents(amountCents: number, percentage: number): number {
  const validPct = Math.max(MIN_CHARITY_PERCENTAGE, Math.min(MAX_CHARITY_PERCENTAGE, percentage));
  return Math.round((amountCents * validPct) / 100);
}

/**
 * Calculates 40% prize pool allocation in integer cents
 */
export function calculatePrizePoolContributionCents(amountCents: number): number {
  return Math.round((amountCents * PRIZE_POOL_PERCENTAGE) / 100);
}

/**
 * Calculates residual platform operating revenue in integer cents
 */
export function calculatePlatformOperatingCents(
  amountCents: number,
  charityCents: number,
  prizeCents: number
): number {
  return Math.max(0, amountCents - charityCents - prizeCents);
}
