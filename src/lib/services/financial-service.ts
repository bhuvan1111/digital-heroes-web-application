import { FinancialBreakdown, PlanType } from "@/types";
import { formatCents } from "@/lib/utils";

export const PLAN_PRICING = {
  monthly: {
    amountCents: 3900, // $39.00
    name: "Monthly Membership",
    cadence: "/month",
  },
  yearly: {
    amountCents: 39000, // $390.00 (Save $78 / 2 months free)
    name: "Annual Champion",
    cadence: "/year",
  },
} as const;

export const PRIZE_POOL_PERCENTAGE = 40; // 40% allocated to reward draws
export const MIN_CHARITY_PERCENTAGE = 10; // Minimum 10% pledge enforced by PRD
export const MAX_CHARITY_PERCENTAGE = 100;

export class FinancialService {
  /**
   * Validates charity contribution percentage. Must be >= 10% and <= 100%.
   */
  public static validateCharityPercentage(percentage: number): { isValid: boolean; error?: string } {
    if (typeof percentage !== "number" || isNaN(percentage)) {
      return { isValid: false, error: "Percentage must be a valid number" };
    }
    if (!Number.isInteger(percentage)) {
      return { isValid: false, error: "Percentage must be an integer" };
    }
    if (percentage < MIN_CHARITY_PERCENTAGE) {
      return {
        isValid: false,
        error: `Charity contribution percentage must be at least ${MIN_CHARITY_PERCENTAGE}%.`,
      };
    }
    if (percentage > MAX_CHARITY_PERCENTAGE) {
      return {
        isValid: false,
        error: `Charity contribution percentage cannot exceed ${MAX_CHARITY_PERCENTAGE}%.`,
      };
    }
    return { isValid: true };
  }

  /**
   * Calculates the charity contribution amount in integer cents.
   */
  public static calculateCharityContribution(amountCents: number, charityPercentage: number): number {
    const valid = Math.max(MIN_CHARITY_PERCENTAGE, Math.min(MAX_CHARITY_PERCENTAGE, charityPercentage));
    return Math.round((amountCents * valid) / 100);
  }

  /**
   * Calculates the prize pool contribution in integer cents (40% of plan amount).
   */
  public static calculatePrizeContribution(amountCents: number): number {
    return Math.round((amountCents * PRIZE_POOL_PERCENTAGE) / 100);
  }

  /**
   * Calculates the remaining platform amount in integer cents.
   */
  public static calculatePlatformAmount(
    amountCents: number,
    charityAmountCents: number,
    prizeAmountCents: number
  ): number {
    return Math.max(0, amountCents - charityAmountCents - prizeAmountCents);
  }

  /**
   * Generates a complete financial breakdown for a given subscription plan and charity pledge.
   */
  public static getFinancialBreakdown(
    plan: PlanType,
    charityPercentage: number = MIN_CHARITY_PERCENTAGE,
    currency: string = "USD"
  ): FinancialBreakdown {
    const planConfig = PLAN_PRICING[plan] || PLAN_PRICING.monthly;
    const planAmountCents = planConfig.amountCents;

    const validatedPercentage = Math.max(
      MIN_CHARITY_PERCENTAGE,
      Math.min(MAX_CHARITY_PERCENTAGE, Number(charityPercentage) || MIN_CHARITY_PERCENTAGE)
    );

    const charityAmountCents = this.calculateCharityContribution(planAmountCents, validatedPercentage);
    const prizePoolAmountCents = this.calculatePrizeContribution(planAmountCents);
    const platformAmountCents = this.calculatePlatformAmount(
      planAmountCents,
      charityAmountCents,
      prizePoolAmountCents
    );

    return {
      planAmountCents,
      charityPercentage: validatedPercentage,
      charityAmountCents,
      prizePoolAmountCents,
      platformAmountCents,
      formatted: {
        planAmount: formatCents(planAmountCents, currency),
        charityAmount: formatCents(charityAmountCents, currency),
        prizePoolAmount: formatCents(prizePoolAmountCents, currency),
        platformAmount: formatCents(platformAmountCents, currency),
      },
    };
  }
}
