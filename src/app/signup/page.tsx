"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataStore } from "@/lib/data/store";
import { Charity } from "@/types";
import { Trophy, ArrowRight, Heart, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [charities, setCharities] = React.useState<Charity[]>([]);

  // Form states
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [selectedCharityId, setSelectedCharityId] = React.useState("");
  const [contributionPercentage, setContributionPercentage] = React.useState(15);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const list = DataStore.getCharities();
    setCharities(list);
    if (list.length > 0) {
      setSelectedCharityId(list[0].id);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (contributionPercentage < 10) {
      setError("Charity contribution percentage must be at least 10%.");
      return;
    }

    if (!selectedCharityId) {
      setError("Please select a preferred charity.");
      return;
    }

    setIsLoading(true);

    try {
      DataStore.signupUser({
        fullName,
        email,
        charityId: selectedCharityId,
        contributionPercentage,
      });

      setTimeout(() => {
        setIsLoading(false);
        // Redirect toward subscription onboarding / dashboard
        router.push("/dashboard/subscription");
      }, 700);
    } catch (err: unknown) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Failed to create account");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center text-slate-950 font-black">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">DIGITAL HEROES</span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Create Your Player &amp; Impact Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Pledge a portion of your membership to real causes while tracking your game.
          </p>
        </div>

        <Card className="p-8 border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Full Name
              </label>
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Colin Montgomery"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colin@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Password
              </label>
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            {/* Preferred Charity Selection */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Designated Charity Partner
              </label>
              <select
                value={selectedCharityId}
                onChange={(e) => setSelectedCharityId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Contribution Percentage Slider (Minimum 10% enforced) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-brand-400" />
                  Monthly Charity Pledge:
                </span>
                <span className="text-base font-extrabold text-brand-400">
                  {contributionPercentage}%
                </span>
              </div>

              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={contributionPercentage}
                onChange={(e) => setContributionPercentage(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />

              <div className="flex justify-between text-[11px] text-slate-500">
                <span>10% (Platform Minimum)</span>
                <span>25%</span>
                <span>50%</span>
              </div>
              <p className="text-[11px] text-slate-400">
                You can increase this percentage anytime. The platform requires at least 10% to guarantee charitable impact.
              </p>
            </div>

            <Button type="submit" variant="primary" className="w-full text-base py-3" isLoading={isLoading}>
              Complete Signup &amp; Activate Plan
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-400 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
