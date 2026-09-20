import Link from "next/link";
import { Trophy, Heart, ShieldCheck, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-slate-950 font-black">
                <Trophy className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                DIGITAL HEROES
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The modern golf performance and impact ecosystem. Turn your Stableford scores into monthly charitable funding while competing in mathematically transparent reward draws.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Registered Social Impact Platform &middot; Fully Audited Draws</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/charities" className="hover:text-white transition-colors">
                  Charity Directory
                </Link>
              </li>
              <li>
                <Link href="/draws" className="hover:text-white transition-colors">
                  Reward Draws
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Membership Plans
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Mission &amp; Governance
                </Link>
              </li>
            </ul>
          </div>

          {/* User Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Subscribers
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/dashboard/overview" className="hover:text-white transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/dashboard/scores" className="hover:text-white transition-colors">
                  Stableford Scores
                </Link>
              </li>
              <li>
                <Link href="/dashboard/charity" className="hover:text-white transition-colors">
                  My Charity Pledge
                </Link>
              </li>
              <li>
                <Link href="/dashboard/draws" className="hover:text-white transition-colors">
                  Active Draw Tickets
                </Link>
              </li>
              <li>
                <Link href="/dashboard/winnings" className="hover:text-white transition-colors">
                  Winnings &amp; Proof
                </Link>
              </li>
            </ul>
          </div>

          {/* Administration & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Governance
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/admin" className="hover:text-white transition-colors flex items-center gap-1">
                  Admin Panel <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Terms of Play</span>
              </li>
              <li>
                <span className="text-slate-500">Charity Transparency Charter</span>
              </li>
              <li>
                <span className="text-slate-500">Draw Regulations (40/35/25)</span>
              </li>
              <li>
                <span className="text-slate-500">Privacy Policy</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Digital Heroes Platform Inc. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5">
            Crafted with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> for the love of the game and genuine human impact.
          </p>
        </div>
      </div>
    </footer>
  );
}
