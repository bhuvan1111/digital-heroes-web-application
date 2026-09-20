"use client";
import * as React from "react";
import Link from "next/link";
import { DataStore } from "@/lib/data/store";
import { Charity, Draw } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Trophy,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  Flame,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const [featuredCharities, setFeaturedCharities] = React.useState<Charity[]>([]);
  const [upcomingDraw, setUpcomingDraw] = React.useState<Draw | null>(null);
  const [latestDraw, setLatestDraw] = React.useState<Draw | null>(null);

  React.useEffect(() => {
    async function loadHomeData() {
      try {
        const [charities, upcoming, latest] = await Promise.all([
          DataStore.getFeaturedCharities(),
          DataStore.getUpcomingDraw(),
          DataStore.getLatestPublishedDraw(),
        ]);
        setFeaturedCharities(charities);
        setUpcomingDraw(upcoming || null);
        setLatestDraw(latest || null);
      } catch (err) {
        console.error("Failed to load home page data:", err);
      }
    }
    loadHomeData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO SECTION */}
      {/* --------------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-36 border-b border-slate-850">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-brand-600/15 via-emerald-500/10 to-transparent blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              The Next Evolution of Golf &amp; Impact
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              Play Your Game.{" "}
              <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                Give With Purpose.
              </span>{" "}
              Win Something Back.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl font-normal">
              Track your authentic Stableford performance, allocate monthly charitable funding to vetted causes, and enter mathematically verified reward draws.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/signup">
                <Button size="lg" variant="primary" className="text-base px-8 gap-3">
                  Start Playing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/charities">
                <Button size="lg" variant="outline" className="text-base px-6">
                  Explore Charities
                </Button>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="mt-12 pt-8 border-t border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Max Scores</p>
                <p className="text-xl font-bold text-white mt-0.5">5 Rolling</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Min Charity Pledge</p>
                <p className="text-xl font-bold text-brand-400 mt-0.5">10% Default</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Jackpot Pool</p>
                <p className="text-xl font-bold text-amber-400 mt-0.5">40% Rollover</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Draw Frequency</p>
                <p className="text-xl font-bold text-white mt-0.5">Monthly</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. HOW IT WORKS (PLAY → GIVE → WIN → IMPACT) */}
      {/* --------------------------------------------------------------------- */}
      <section id="how-it-works" className="py-24 bg-slate-950/60 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="success" className="mb-3">The Four Pillars</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              A Virtuous Circle of Performance and Philanthropy
            </h2>
            <p className="mt-3 text-slate-400 text-base">
              Engineered with fintech precision to ensure every round you post drives real-world change.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1: PLAY */}
            <div className="relative p-7 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-brand-500/50 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-black text-lg mb-6">
                01
              </div>
              <h3 className="text-xl font-bold text-white mb-2">PLAY</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Log your official Stableford scores (1 to 45 points). Your latest 5 scores automatically form your personalized monthly draw ticket.
              </p>
            </div>

            {/* Step 2: GIVE */}
            <div className="relative p-7 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-brand-500/50 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-black text-lg mb-6">
                02
              </div>
              <h3 className="text-xl font-bold text-white mb-2">GIVE</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every subscription pledges a minimum 10% directly to your chosen vetted charity. Increase your pledge anytime up to 100%.
              </p>
            </div>

            {/* Step 3: WIN */}
            <div className="relative p-7 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-brand-500/50 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-lg mb-6">
                03
              </div>
              <h3 className="text-xl font-bold text-white mb-2">WIN</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Monthly reward draws match 3, 4, or 5 numbers. Match all 5 to claim the grand jackpot pool, or watch it roll over to next month.
              </p>
            </div>

            {/* Step 4: IMPACT */}
            <div className="relative p-7 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-brand-500/50 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg mb-6">
                04
              </div>
              <h3 className="text-xl font-bold text-white mb-2">IMPACT</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Track exact funds disbursed to ecological restoration, disabled veterans, and youth athletics. Receive transparent impact reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. CHARITY IMPACT & FEATURED CHARITY */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-24 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <Badge variant="success" className="mb-3">Vetted Partners</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Empowering Grassroots &amp; Global Causes
              </h2>
              <p className="mt-2 text-slate-400 text-base max-w-xl">
                Every subscription dollar directly accelerates verified non-profit partners worldwide.
              </p>
            </div>
            <Link href="/charities">
              <Button variant="outline" className="gap-2">
                View All Charities
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCharities.map((charity) => (
              <Card key={charity.id} className="group hover:border-slate-700 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden">
                  <img
                    src={charity.banner_url || "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800"}
                    alt={charity.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <Badge variant="success">{charity.category}</Badge>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors">
                    {charity.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">{charity.location}</p>
                  <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                    {charity.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Disbursed</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(charity.total_received)}</p>
                  </div>
                  <Link href={`/charities/${charity.id}`}>
                    <Button size="sm" variant="secondary" className="text-xs">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. REWARD DRAW MECHANICS & PRIZE POOL EXPLANATION */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-24 bg-slate-950/80 border-b border-slate-850 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="gold" className="mb-3">Mathematically Audited</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Transparent Monthly Reward Draws
            </h2>
            <p className="mt-3 text-slate-400 text-base">
              Dual-mode execution: deterministic random or score-frequency algorithmic draws with rollover mechanics.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* 5-Match Tier */}
            <div className="p-8 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-900/60 to-slate-950 flex flex-col justify-between relative shadow-xl shadow-amber-500/5">
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs tracking-wider uppercase">
                  Grand Jackpot
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 text-amber-400 mb-4">
                  <Award className="h-6 w-6" />
                  <span className="font-bold text-sm tracking-wide uppercase">Tier 1</span>
                </div>
                <h3 className="text-3xl font-extrabold text-white">5-Number Match</h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Matches all 5 drawn numbers against your active Stableford scores ticket.
                </p>
                <div className="my-6 py-4 border-y border-amber-500/20">
                  <p className="text-3xl font-black text-amber-400">40% of Prize Pool</p>
                  <p className="text-xs text-amber-300/80 mt-1 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    <strong>Rollover Guarantee:</strong> If unclaimed, 100% rolls into next draw!
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400">Equal split among all 5-match winners.</p>
            </div>

            {/* 4-Match Tier */}
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-brand-400 mb-4">
                  <Trophy className="h-6 w-6" />
                  <span className="font-bold text-sm tracking-wide uppercase">Tier 2</span>
                </div>
                <h3 className="text-3xl font-extrabold text-white">4-Number Match</h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Matches any 4 of the 5 official drawn numbers. High probability payout bracket.
                </p>
                <div className="my-6 py-4 border-y border-slate-800">
                  <p className="text-3xl font-black text-brand-400">35% of Prize Pool</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Distributed evenly among all 4-number winners in current draw.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400">Does not roll over.</p>
            </div>

            {/* 3-Match Tier */}
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-teal-400 mb-4">
                  <Layers className="h-6 w-6" />
                  <span className="font-bold text-sm tracking-wide uppercase">Tier 3</span>
                </div>
                <h3 className="text-3xl font-extrabold text-white">3-Number Match</h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Matches any 3 of the 5 official drawn numbers. Rewarding consistent players.
                </p>
                <div className="my-6 py-4 border-y border-slate-800">
                  <p className="text-3xl font-black text-teal-400">25% of Prize Pool</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Split equally among all 3-number winners in current draw.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400">Does not roll over.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. SUBSCRIPTION PLANS */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-24 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="success" className="mb-3">Simple Transparent Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Invest In Your Game &amp; The World
            </h2>
            <p className="mt-3 text-slate-400 text-base">
              Choose monthly flexibility or enjoy two months complimentary with an annual membership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly */}
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Monthly Membership</h3>
                    <p className="text-sm text-slate-400">Full platform access &amp; monthly draw</p>
                  </div>
                  <Badge variant="outline">Monthly</Badge>
                </div>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$39</span>
                  <span className="text-slate-400 text-sm font-medium"> / month</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    Automatic entry into monthly reward draws
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    Minimum 10% direct donation to chosen charity
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    Rolling 5-score Stableford tracker &amp; analytics
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    Stripe-secured payments &amp; cancel anytime
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800">
                <Link href="/signup">
                  <Button variant="secondary" className="w-full">
                    Select Monthly
                  </Button>
                </Link>
              </div>
            </div>

            {/* Annual */}
            <div className="p-8 rounded-2xl border-2 border-brand-500/60 bg-gradient-to-b from-brand-950/30 to-slate-900/60 flex flex-col justify-between relative shadow-2xl shadow-brand-500/10">
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-1 rounded-full bg-brand-500 text-slate-950 font-bold text-xs tracking-wider uppercase">
                  Save 17% (2 Months Free)
                </span>
              </div>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Annual Champion</h3>
                    <p className="text-sm text-slate-400">Maximum impact &amp; 12 guaranteed draws</p>
                  </div>
                  <Badge variant="success">Yearly</Badge>
                </div>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$390</span>
                  <span className="text-slate-400 text-sm font-medium"> / year</span>
                  <p className="text-xs text-brand-400 mt-1 font-medium">Equivalent to $32.50 / month</p>
                </div>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    All 12 monthly draws throughout the year
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    Enhanced charity contribution multiplier
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    Priority winner verification &amp; ACH payouts
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    Annual charity tax receipt &amp; impact ledger
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800">
                <Link href="/signup">
                  <Button variant="primary" className="w-full">
                    Select Annual Plan
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 6. LATEST & UPCOMING DRAW TICKER */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-20 bg-slate-950/60 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upcoming Draw */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Next Scheduled Draw
                </span>
                <Badge variant="warning">{upcomingDraw?.status || "UPCOMING"}</Badge>
              </div>
              <h3 className="text-2xl font-bold text-white">{upcomingDraw?.title}</h3>
              <p className="text-sm text-slate-400 mt-1">
                Projected Prize Pool: <strong className="text-amber-400">{formatCurrency(upcomingDraw?.total_prize_pool || 21500)}</strong>
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Link href="/dashboard/scores">
                  <Button size="sm" variant="primary">
                    Update My 5 Scores
                  </Button>
                </Link>
                <Link href="/draws">
                  <Button size="sm" variant="ghost">
                    Draw Rules
                  </Button>
                </Link>
              </div>
            </div>

            {/* Latest Published Draw */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Latest Official Results (#{latestDraw?.draw_number})
                </span>
                <Badge variant="success">PUBLISHED</Badge>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{latestDraw?.title}</h3>
              <div className="flex items-center gap-2 mb-4">
                {latestDraw?.winning_numbers?.map((num) => (
                  <span
                    key={num}
                    className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 font-extrabold text-brand-400 flex items-center justify-center text-base"
                  >
                    {num}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Total Pool: {formatCurrency(latestDraw?.total_prize_pool || 0)} &middot; Mode: {latestDraw?.mode}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 7. IMPACT STATISTICS */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-20 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-5xl font-black text-white">$225,700+</p>
              <p className="mt-2 text-xs sm:text-sm font-medium uppercase tracking-wider text-slate-400">
                Charity Funds Disbursed
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-5xl font-black text-brand-400">1,240+</p>
              <p className="mt-2 text-xs sm:text-sm font-medium uppercase tracking-wider text-slate-400">
                Active Subscribers
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-5xl font-black text-amber-400">$64,500+</p>
              <p className="mt-2 text-xs sm:text-sm font-medium uppercase tracking-wider text-slate-400">
                Prizes Awarded
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-5xl font-black text-white">100%</p>
              <p className="mt-2 text-xs sm:text-sm font-medium uppercase tracking-wider text-slate-400">
                Scorecard Verified
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 8. FINAL CALL TO ACTION */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-brand-950/20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Turn Every Round Into Real Impact?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of golfers supporting conservation, veterans, and youth while participating in verified monthly reward draws.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="primary" className="text-base px-10">
                Get Started Today
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-base px-8">
                Learn About Our Mission
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
