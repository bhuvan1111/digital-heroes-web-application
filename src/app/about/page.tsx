import { ShieldCheck, Heart, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-400">
          Our Foundation &amp; Philosophy
        </span>
        <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Where Honest Golf Creates Tangible Good
        </h1>
        <p className="mt-4 text-lg text-slate-300 leading-relaxed">
          Digital Heroes was founded on a simple insight: millions of passionate golfers record their rounds each week. By uniting this collective energy under an audited impact model, every hole played can fund real change.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-6">
            <Heart className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Vetted Charity Standards</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every participating non-profit undergoes rigorous due diligence, verifying financial governance, impact metrics, and operational transparency.
          </p>
        </div>

        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6">
            <Award className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">40 / 35 / 25 Draw Integrity</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Our reward draws run on open algorithms with reproducible seeds. Tier 5 (Jackpot) rollovers protect player value if unclaimed.
          </p>
        </div>

        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Scorecard Verification</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            To prevent fraud, winning claims require certified scorecard uploads reviewed by compliance administrators before payout release.
          </p>
        </div>
      </div>

      {/* Editorial Content */}
      <div className="p-10 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-6 text-slate-300 leading-relaxed">
        <h2 className="text-2xl font-bold text-white">The Digital Heroes Charter</h2>
        <p>
          Unlike traditional lottery models or sports wagering apps, Digital Heroes is designed first and foremost as an impact platform. Players are rewarded for active participation and healthy outdoor recreation.
        </p>
        <p>
          We allocate at least 10% (and often up to 50%) of all subscription dues directly to non-profit organizations focused on environmental restoration, pediatric care, wounded veterans, and youth access to sports.
        </p>
        <div className="pt-4 flex items-center justify-between border-t border-slate-800 flex-wrap gap-4">
          <div>
            <p className="text-white font-bold">Have questions or want to partner?</p>
            <p className="text-xs text-slate-400">Reach our compliance team at governance@digitalheroes.golf</p>
          </div>
          <Link href="/pricing">
            <Button variant="primary" className="gap-2">
              View Membership Options <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
