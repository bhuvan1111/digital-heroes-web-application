"use client";

import * as React from "react";
import Link from "next/link";
import { FinancialService } from "@/lib/services/financial-service";
import { formatCurrency, formatCents } from "@/lib/utils";
import { CheckCircle2, Heart, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = React.useState(true);
  const [pledgePercentage, setPledgePercentage] = React.useState(20);

  const planKey = isAnnual ? "yearly" : "monthly";
  const breakdown = FinancialService.getFinancialBreakdown(planKey, pledgePercentage);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <Badge variant="success" className="mb-3">Membership Structure</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Transparent, Impact-Driven Pricing
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
          Every membership includes automatic monthly reward draw entries, rolling Stableford scoring, and direct charity disbursements.
        </p>

        {/* Toggle Billing */}
        <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-2xl border border-slate-800 bg-slate-900/80">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              !isAnnual ? "bg-brand-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              isAnnual ? "bg-brand-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Annual Billing
            <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
        {/* Monthly Plan */}
        <Card
          className={`flex flex-col justify-between transition-all ${
            !isAnnual ? "border-brand-500 ring-2 ring-brand-500/20 shadow-2xl" : "border-slate-800"
          }`}
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">Monthly Plan</h3>
                <p className="text-sm text-slate-400 mt-1">Flexible pay-as-you-go membership</p>
              </div>
              <Badge variant="outline">Monthly</Badge>
            </div>
            <div className="my-6">
              <span className="text-5xl font-black text-white">$39</span>
              <span className="text-slate-400 text-sm font-medium"> / month</span>
            </div>
            <ul className="space-y-3.5 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                Automatic monthly reward draw participation
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                Configurable charity pledge (minimum 10%)
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                Rolling 5-score Stableford tracking system
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                Cancel or modify anytime
              </li>
            </ul>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800">
            <Link href="/signup">
              <Button variant={!isAnnual ? "primary" : "secondary"} className="w-full">
                Get Started
              </Button>
            </Link>
          </div>
        </Card>

        {/* Annual Plan */}
        <Card
          className={`flex flex-col justify-between relative transition-all ${
            isAnnual
              ? "border-brand-500 ring-2 ring-brand-500/30 bg-gradient-to-b from-brand-950/20 to-slate-900/60 shadow-2xl shadow-brand-500/10"
              : "border-slate-800"
          }`}
        >
          <div className="absolute -top-3 right-6">
            <span className="px-3 py-1 rounded-full bg-brand-500 text-slate-950 font-bold text-xs tracking-wider uppercase">
              2 Months Free
            </span>
          </div>
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">Annual Champion</h3>
                <p className="text-sm text-slate-400 mt-1">Maximum impact with year-round participation</p>
              </div>
              <Badge variant="gold">Best Value</Badge>
            </div>
            <div className="my-6">
              <span className="text-5xl font-black text-white">$390</span>
              <span className="text-slate-400 text-sm font-medium"> / year</span>
              <p className="text-xs text-brand-400 mt-1 font-medium">Equivalent to $32.50/month</p>
            </div>
            <ul className="space-y-3.5 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                Guaranteed entry into all 12 annual draws
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                Priority winner verification &amp; fast payouts
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                Consolidated annual charity donation tax receipt
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                Save $78 annually compared to monthly billing
              </li>
            </ul>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800">
            <Link href="/signup">
              <Button variant={isAnnual ? "primary" : "secondary"} className="w-full">
                Join As Annual Champion
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Interactive Financial Allocation Simulator */}
      <Card className="p-8 sm:p-10 mb-20 bg-slate-900/60 border-slate-800">
        <div className="max-w-2xl mb-8">
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Heart className="h-4 w-4" />
            Centralized Financial Calculator
          </div>
          <h2 className="text-2xl font-bold text-white">
            See Exactly How Your Membership Dollar Is Allocated
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Adjust the charity pledge slider to see the precise integer cents breakdown for your selected plan:
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2 text-sm font-semibold">
              <span className="text-slate-300">Charity Pledge Percentage:</span>
              <span className="text-brand-400 text-base font-bold">{pledgePercentage}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={pledgePercentage}
              onChange={(e) => setPledgePercentage(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>10% (Minimum)</span>
              <span>25%</span>
              <span>40%</span>
              <span>60%</span>
            </div>
          </div>

          {/* Breakdown visualization */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs text-emerald-300 font-semibold block uppercase">
                Charity Contribution ({pledgePercentage}%)
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {breakdown.formatted.charityAmount}
              </span>
              <span className="text-[11px] text-slate-400">Directly transferred to vetted cause</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs text-amber-300 font-semibold block uppercase">
                Prize Pool (40%)
              </span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {breakdown.formatted.prizePoolAmount}
              </span>
              <span className="text-[11px] text-slate-400">Guaranteed to monthly reward pools</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs text-slate-300 font-semibold block uppercase">
                Platform Operations
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {breakdown.formatted.platformAmount}
              </span>
              <span className="text-[11px] text-slate-400">Hosting, score audits &amp; compliance</span>
            </div>
          </div>
        </div>
      </Card>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card className="p-6">
            <h4 className="text-base font-bold text-white">Can I change my charity selection after joining?</h4>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Yes, you can change your designated charity or adjust your contribution percentage at any time directly from your dashboard settings. Changes apply to the next billing cycle.
            </p>
          </Card>
          <Card className="p-6">
            <h4 className="text-base font-bold text-white">What happens if I don&apos;t log 5 scores before the draw?</h4>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Your active ticket requires 5 scores. If you have fewer than 5 rounds registered, you are prompted to log scores from any recent 18-hole rounds to ensure full ticket eligibility.
            </p>
          </Card>
          <Card className="p-6">
            <h4 className="text-base font-bold text-white">How do winner payouts work?</h4>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              When you match 3, 4, or 5 numbers, a winner record is generated in your dashboard. You upload an image or scan of your verified scorecard. Once approved by compliance administrators, funds are disbursed directly to your bank account.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
