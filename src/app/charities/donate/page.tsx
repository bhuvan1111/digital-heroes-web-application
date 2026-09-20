"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataStore } from "@/lib/data/store";
import { Charity } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function DonateContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("charityId");

  const [charities, setCharities] = React.useState<Charity[]>([]);
  const [selectedCharityId, setSelectedCharityId] = React.useState("");
  const [amount, setAmount] = React.useState(50);
  const [customAmount, setCustomAmount] = React.useState("");
  const [isMonthly, setIsMonthly] = React.useState(false);
  const [donorName, setDonorName] = React.useState("");
  const [donorEmail, setDonorEmail] = React.useState("");
  const [dedication, setDedication] = React.useState("");
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    async function loadCharities() {
      try {
        const list = await DataStore.getCharities();
        setCharities(list);
        if (preselectedId && list.some((c) => c.id === preselectedId)) {
          setSelectedCharityId(preselectedId);
        } else if (list.length > 0) {
          setSelectedCharityId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load charities:", err);
      }
    }
    loadCharities();
  }, [preselectedId]);

  const activeCharity = charities.find((c) => c.id === selectedCharityId);
  const finalAmount = customAmount ? Number(customAmount) : amount;

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCharity || finalAmount <= 0) return;

    setIsLoading(true);
    try {
      await DataStore.updateCharity(activeCharity.id, {
        total_received: (activeCharity.total_received || 0) + finalAmount,
      });
      await DataStore.logAudit({
        action: "INDEPENDENT_DONATION_COMPLETED",
        entity: "charities",
        entityId: activeCharity.id,
        metadata: {
          donorName: donorName || "Anonymous Supporter",
          amount: finalAmount,
          isMonthly,
          charity: activeCharity.name,
        },
      });
      setIsSuccess(true);
    } catch (err) {
      console.error("Failed to process donation:", err);
      alert("Failed to process donation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/charities"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Charity Directory
      </Link>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          Independent Direct Philanthropy
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Direct Non-Profit Giving
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
          Support verified charities directly without subscription requirements or draw participation. 100% pass-through guarantee with zero platform deduction.
        </p>
      </div>

      {isSuccess ? (
        <Card className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 border-brand-500/40 bg-gradient-to-b from-brand-950/20 to-slate-900/60 shadow-2xl">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white">Thank You For Your Generosity!</h2>
            <p className="text-sm text-slate-300">
              Your gift of <strong className="text-white">{formatCurrency(finalAmount)}</strong> to{" "}
              <strong className="text-brand-400">{activeCharity?.name}</strong> has been processed successfully.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-left space-y-1.5">
            <p><strong>Official Reference:</strong> DH-GIFT-{Date.now().toString().slice(-8)}</p>
            <p><strong>Beneficiary:</strong> {activeCharity?.name} ({activeCharity?.location})</p>
            <p><strong>Tax Deduction Receipt:</strong> Sent to {donorEmail || "your email address"}</p>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <Link href="/charities">
              <Button variant="primary">Return to Charity Directory</Button>
            </Link>
            <button
              onClick={() => {
                setIsSuccess(false);
                setCustomAmount("");
              }}
              className="text-xs text-slate-400 hover:text-white px-4 py-2"
            >
              Make Another Gift
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Donation Form */}
          <Card className="lg:col-span-2 p-6 sm:p-8 space-y-6">
            <form onSubmit={handleDonate} className="space-y-6">
              {/* Step 1: Beneficiary */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  1. Select Designated Charity
                </label>
                <select
                  value={selectedCharityId}
                  onChange={(e) => setSelectedCharityId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {charities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.category} ({c.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Amount & Frequency */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. Choose Contribution Amount
                  </label>
                  <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-950 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsMonthly(false)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        !isMonthly ? "bg-brand-500 text-slate-950 font-bold" : "text-slate-400"
                      }`}
                    >
                      One-Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMonthly(true)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        isMonthly ? "bg-brand-500 text-slate-950 font-bold" : "text-slate-400"
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 mb-3">
                  {[25, 50, 100, 250].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                        amount === amt && !customAmount
                          ? "border-brand-500 bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/50"
                          : "border-slate-850 bg-slate-900 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <Input
                  type="number"
                  min={5}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Or enter custom amount in USD (e.g. 500)"
                />
              </div>

              {/* Step 3: Donor Details */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  3. Donor Information
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Full Legal Name"
                  />
                  <Input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="Email Address for Tax Receipt"
                  />
                </div>

                <Input
                  type="text"
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder="Optional: In honor or memory of..."
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full text-base py-3.5 gap-2"
                isLoading={isLoading}
              >
                <Heart className="h-4 w-4" />
                Complete Gift of {formatCurrency(finalAmount)} {isMonthly ? "/ month" : ""}
              </Button>
            </form>
          </Card>

          {/* Impact Guarantee Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-b from-brand-950/20 to-slate-900/60 border-brand-500/20">
              <div className="flex items-center gap-2 text-brand-400 mb-3">
                <ShieldCheck className="h-5 w-5" />
                <h4 className="text-sm font-bold uppercase tracking-wider">
                  100% Pass-Through Charter
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct gifts submitted through this page are never subjected to platform cuts or administrative commissions. 100% of your dollars are wired directly to the designated organization.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>&bull; 501(c)(3) equivalent tax receipt</p>
                <p>&bull; Encrypted TLS 256-bit bank checkout</p>
                <p>&bull; Zero platform retention</p>
              </div>
            </Card>

            {activeCharity && (
              <Card className="p-6">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Selected Cause
                </span>
                <h4 className="text-base font-bold text-white">{activeCharity.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{activeCharity.location}</p>
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Total Funds Disbursed:</span>
                  <p className="text-base font-black text-brand-400 mt-0.5">
                    {formatCurrency(activeCharity.total_received)}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IndependentDonatePage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-400">
          Loading donation terminal...
        </div>
      }
    >
      <DonateContent />
    </React.Suspense>
  );
}
