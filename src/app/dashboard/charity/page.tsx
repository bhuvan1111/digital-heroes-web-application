"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { Charity, UserCharity, Subscription } from "@/types";
import { FinancialService } from "@/lib/services/financial-service";
import { formatCurrency, formatCents } from "@/lib/utils";
import {
  Heart,
  CheckCircle2,
  AlertCircle,
  Building,
  MapPin,
  Globe,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function DashboardCharityPage() {
  const [currentUser, setCurrentUser] = React.useState(DataStore.getCurrentUser());
  const [allCharities, setAllCharities] = React.useState<Charity[]>([]);
  const [selectedCharityId, setSelectedCharityId] = React.useState("");
  const [percentage, setPercentage] = React.useState(20);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [savedFeedback, setSavedFeedback] = React.useState(false);

  React.useEffect(() => {
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);
    const charities = DataStore.getCharities();
    setAllCharities(charities);
    const sub = DataStore.getUserSubscription(user.id);
    if (sub) setSubscription(sub);

    const uc = DataStore.getUserCharity(user.id);
    if (uc.userCharity) {
      setSelectedCharityId(uc.userCharity.charity_id);
      setPercentage(uc.userCharity.contribution_percentage);
    } else if (charities.length > 0) {
      setSelectedCharityId(charities[0].id);
      setPercentage(10);
    }
  }, []);

  const activeCharity = allCharities.find((c) => c.id === selectedCharityId);

  // Financial breakdown calculation
  const plan = subscription?.plan || "monthly";
  const breakdown = FinancialService.getFinancialBreakdown(plan, percentage);

  const handleSavePledge = (e: React.FormEvent) => {
    e.preventDefault();
    DataStore.setUserCharity(currentUser.id, selectedCharityId, percentage);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          My Charity Pledge &amp; Impact
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure which vetted organization receives your subscription support and adjust your contribution percentage.
        </p>
      </div>

      {savedFeedback && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Charity pledge settings updated successfully! Your adjustments apply immediately.
        </div>
      )}

      {/* Selected Charity Card */}
      {activeCharity && (
        <Card className="p-6 sm:p-8 bg-gradient-to-b from-brand-950/20 to-slate-900/60 border-brand-500/30">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl overflow-hidden border border-slate-700 shrink-0">
                <img
                  src={activeCharity.banner_url || "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300"}
                  alt={activeCharity.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="success">{activeCharity.category}</Badge>
                  <Badge variant="outline">Current Beneficiary</Badge>
                </div>
                <h3 className="text-2xl font-bold text-white mt-1">{activeCharity.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-400" />
                  {activeCharity.location} &middot;{" "}
                  <a
                    href={activeCharity.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" /> Official Site
                  </a>
                </p>
              </div>
            </div>

            <div className="sm:text-right shrink-0 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Raised</p>
              <p className="text-xl font-black text-brand-400">{formatCurrency(activeCharity.total_received)}</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 mt-6 leading-relaxed border-t border-slate-800 pt-4">
            {activeCharity.description}
          </p>
        </Card>
      )}

      {/* Adjust Pledge Form */}
      <Card className="p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Heart className="h-5 w-5 text-brand-400" />
          Pledge Configuration
        </h3>

        <form onSubmit={handleSavePledge} className="space-y-6">
          {/* Charity dropdown */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Change Beneficiary
            </label>
            <select
              value={selectedCharityId}
              onChange={(e) => setSelectedCharityId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {allCharities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.category} ({c.location})
                </option>
              ))}
            </select>
          </div>

          {/* Percentage Slider */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                  Contribution Percentage
                </span>
                <span className="text-xs text-slate-500">Platform minimum is 10%</span>
              </div>
              <span className="text-2xl font-black text-brand-400">{percentage}%</span>
            </div>

            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>10% (Minimum)</span>
              <span>25%</span>
              <span>40%</span>
              <span>60%</span>
            </div>

            {/* Real-time calculated dollars */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Monthly Donation from Dues:</span>
                <span className="text-lg font-bold text-emerald-400">
                  {breakdown.formatted.charityAmount}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Annualized Impact:</span>
                <span className="text-lg font-bold text-white">
                  {formatCurrency((breakdown.charityAmountCents * (plan === "yearly" ? 1 : 12)) / 100)}
                </span>
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full text-base py-3">
            Save Charity Pledge Settings
          </Button>
        </form>
      </Card>
    </div>
  );
}
