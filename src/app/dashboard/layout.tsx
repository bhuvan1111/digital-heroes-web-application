"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DataStore } from "@/lib/data/store";
import { UserProfile, Subscription } from "@/types";
import {
  LayoutDashboard,
  Trophy,
  Heart,
  Calendar,
  Award,
  CreditCard,
  Settings,
  ChevronRight,
  LogOut,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);

  React.useEffect(() => {
    async function loadUserAndSub() {
      try {
        const user = await DataStore.getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setCurrentUser(user);
        const sub = await DataStore.getUserSubscription(user.id);
        if (sub) setSubscription(sub);
      } catch (err) {
        console.error("Dashboard layout error:", err);
      }
    }
    loadUserAndSub();
  }, [pathname, router]);

  const navItems = [
    { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
    { name: "Stableford Scores", href: "/dashboard/scores", icon: Trophy },
    { name: "My Charity Pledge", href: "/dashboard/charity", icon: Heart },
    { name: "Reward Draws", href: "/dashboard/draws", icon: Calendar },
    { name: "Winnings & Proof", href: "/dashboard/winnings", icon: Award },
    { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080c14]">
      {/* Sidebar for Desktop */}
      <aside className="w-full md:w-64 lg:w-72 border-r border-slate-800/80 bg-slate-950/60 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* User Profile Mini Card */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-brand-600 to-brand-400 text-slate-950 font-black text-sm uppercase shadow-md shrink-0">
              {currentUser?.full_name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{currentUser?.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-slate-400 font-medium capitalize">
                  {subscription?.status || "active"} subscriber
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/80"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Subscription Status Mini Box */}
        <div className="pt-6 border-t border-slate-850 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between items-center text-slate-200 font-bold">
              <span>{subscription?.plan === "yearly" ? "Annual Champion" : "Monthly Member"}</span>
              <Badge variant="success" className="text-[10px] py-0">Active</Badge>
            </div>
            <p className="text-[11px] text-slate-400">All draws automatically unlocked.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-6xl overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
