"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { DataStore } from "@/lib/data/store";
import { DEMO_USERS } from "@/lib/data/mock-data";
import { UserProfile } from "@/types";
import {
  ShieldCheck,
  UserCheck,
  Eye,
  Sparkles,
  LayoutDashboard,
  Shield,
  Heart,
  ChevronRight,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export function EvaluatorBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    async function loadUser() {
      const user = await DataStore.getCurrentUser();
      setCurrentUser(user);
    }
    loadUser();
  }, [pathname]);

  const switchPersona = async (persona: "subscriber" | "admin" | "visitor") => {
    if (persona === "subscriber") {
      const subscriber = DEMO_USERS[1]; // Marcus Vance
      await DataStore.setDemoUser(subscriber);
      setCurrentUser(subscriber);
      if (pathname.startsWith("/admin") || pathname.startsWith("/login")) {
        router.push("/dashboard/overview");
      } else {
        router.refresh();
      }
    } else if (persona === "admin") {
      const admin = DEMO_USERS[0]; // Victoria Sterling
      await DataStore.setDemoUser(admin);
      setCurrentUser(admin);
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/login")) {
        router.push("/admin");
      } else {
        router.refresh();
      }
    } else {
      // Visitor / Logged Out
      await DataStore.setDemoUser(null);
      setCurrentUser(null);
      if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
        router.push("/login");
      } else {
        router.refresh();
      }
    }
  };

  if (!isClient) return null;

  const isSubscriber = currentUser?.role === "user";
  const isAdmin = currentUser?.role === "admin";
  const isVisitor = !currentUser;

  return (
    <div className="w-full bg-slate-950 border-b border-amber-500/30 text-xs text-slate-300 py-1.5 px-4 sm:px-6 lg:px-8 relative z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Persona Switcher Label & Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Persona Switcher:</span>
          </div>

          <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-900 shadow-inner">
            {/* Subscriber Persona */}
            <button
              type="button"
              onClick={() => switchPersona("subscriber")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                isSubscriber
                  ? "bg-brand-500 text-slate-950 font-bold shadow-sm shadow-brand-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
              title="Marcus Vance - Active Subscriber with 5 Stableford scores, 20% pledge, and winning ticket"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Subscriber</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isSubscriber ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}
              >
                Player
              </span>
            </button>

            {/* Admin Persona */}
            <button
              type="button"
              onClick={() => switchPersona("admin")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                isAdmin
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
              title="Victoria Sterling - Administrator with full governance, draw simulator, and charity CRUD"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Administrator</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isAdmin ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}
              >
                Director
              </span>
            </button>

            {/* Visitor Persona */}
            <button
              type="button"
              onClick={() => switchPersona("visitor")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                isVisitor
                  ? "bg-slate-700 text-white font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
              title="Public / Visitor Mode - Unauthenticated view"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Visitor</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Context Jump Links */}
        <div className="flex items-center gap-3 text-[11px]">
          {isSubscriber && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 hidden md:inline">
                Active: <strong className="text-white">Marcus Vance</strong> (14.2 HI · 20% Pledge)
              </span>
              <Link
                href="/dashboard/overview"
                className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-semibold px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20"
              >
                <LayoutDashboard className="h-3 w-3" />
                Player Portal <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 hidden md:inline">
                Active: <strong className="text-amber-300">Victoria Sterling</strong> (Admin Console)
              </span>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
              >
                <Shield className="h-3 w-3" />
                Admin Console <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {isVisitor && (
            <div className="flex items-center gap-2 text-slate-400">
              <span>Public View</span>
              <Link
                href="/charities"
                className="text-brand-400 hover:underline flex items-center gap-0.5"
              >
                <Heart className="h-3 w-3" /> Charities
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
