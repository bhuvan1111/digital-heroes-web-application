import { describe, it, expect } from "vitest";
import { FinancialService, MIN_CHARITY_PERCENTAGE } from "@/lib/services/financial-service";

describe("FinancialService", () => {
  it("enforces minimum 10% charity contribution", () => {
    expect(FinancialService.validateCharityPercentage(9).isValid).toBe(false);
    expect(FinancialService.validateCharityPercentage(10).isValid).toBe(true);
    expect(FinancialService.validateCharityPercentage(25).isValid).toBe(true);
    expect(FinancialService.validateCharityPercentage(100).isValid).toBe(true);
    expect(FinancialService.validateCharityPercentage(101).isValid).toBe(false);
  });

  it("calculates exact integer cents contributions for monthly plan ($39.00)", () => {
    // 3900 cents * 10% = 390 cents ($3.90)
    const charity = FinancialService.calculateCharityContribution(3900, 10);
    expect(charity).toBe(390);

    // 40% prize pool = 1560 cents ($15.60)
    const prize = FinancialService.calculatePrizeContribution(3900);
    expect(prize).toBe(1560);

    // Platform = 3900 - 390 - 1560 = 1950 cents ($19.50)
    const platform = FinancialService.calculatePlatformAmount(3900, charity, prize);
    expect(platform).toBe(1950);
    expect(charity + prize + platform).toBe(3900);
  });

  it("calculates correct contributions with increased percentage (e.g. 25%)", () => {
    // 3900 cents * 25% = 975 cents ($9.75)
    const charity = FinancialService.calculateCharityContribution(3900, 25);
    expect(charity).toBe(975);

    const prize = FinancialService.calculatePrizeContribution(3900);
    expect(prize).toBe(1560);

    const platform = FinancialService.calculatePlatformAmount(3900, charity, prize);
    expect(platform).toBe(1365);
    expect(charity + prize + platform).toBe(3900);
  });

  it("provides comprehensive breakdown with currency formatting", () => {
    const breakdown = FinancialService.getFinancialBreakdown("yearly", 20);
    expect(breakdown.planAmountCents).toBe(39000);
    expect(breakdown.charityPercentage).toBe(20);
    expect(breakdown.charityAmountCents).toBe(7800); // 20% of 39000
    expect(breakdown.prizePoolAmountCents).toBe(15600); // 40% of 39000
    expect(breakdown.platformAmountCents).toBe(15600); // 39000 - 7800 - 15600
    expect(breakdown.formatted.planAmount).toBe("$390.00");
    expect(breakdown.formatted.charityAmount).toBe("$78.00");
  });
});
