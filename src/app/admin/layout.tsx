"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DataStore } from "@/lib/data/store";
import { UserProfile } from "@/types";
import {
  ShieldCheck,
  Users,
  CreditCard,
  Trophy,
  Heart,
  Calendar,
  Award,
  BarChart3,
  Settings,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { DEMO_USERS } from "@/lib/data/mock-data";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function checkAdmin() {
      try {
        const user = await DataStore.getCurrentUser();
        setCurrentUser(user);
        setIsLoading(false);
      } catch (err) {
        console.error("Admin layout verification error:", err);
        setIsLoading(false);
      }
    }
    checkAdmin();
  }, [pathname]);

  const handleAuthorizeAdmin = async () => {
    const admin = DEMO_USERS[0];
    await DataStore.setDemoUser(admin);
    setCurrentUser(admin);
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060a12] flex items-center justify-center p-4">
        <div className="text-slate-400 text-sm flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-400 animate-pulse" />
          <span>Verifying administrator credentials...</span>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#060a12] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <Badge variant="gold" className="mb-2">Admin Governance Suite</Badge>
            <h2 className="text-2xl font-bold text-white">Administrator Access Required</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              You are currently viewing as{" "}
              <strong className="text-slate-200">{currentUser?.full_name || "Guest / Subscriber"}</strong>.
              To access the draw simulator, charity manager, and financial audit suite, authorize as the platform director.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              variant="gold"
              onClick={handleAuthorizeAdmin}
              className="w-full gap-2 py-3"
            >
              <ShieldCheck className="h-4 w-4" />
              Switch to Victoria Sterling (Admin Persona)
            </Button>

            <Link href="/dashboard/overview" className="w-full block">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" /> Return to Subscriber Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }


  const navItems = [
    { name: "Executive Overview", href: "/admin", icon: BarChart3 },
    { name: "Draw Simulator & Draws", href: "/admin/draws", icon: Calendar },
    { name: "Winner Verification", href: "/admin/winners", icon: Award },
    { name: "Charity Management", href: "/admin/charities", icon: Heart },
    { name: "Subscriber Base", href: "/admin/users", icon: Users },
    { name: "Subscriptions & MRR", href: "/admin/subscriptions", icon: CreditCard },
    { name: "Global Golf Scores", href: "/admin/scores", icon: Trophy },
    { name: "Financial Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Audit Logs & Security", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#060a12]">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 border-r border-slate-800 bg-slate-950 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-850">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block">
                  ADMIN CONSOLE
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Governance &amp; Draws
                </span>
              </div>
            </div>
          </div>

          {/* Admin Role Status Badge */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <p className="font-bold text-amber-300">Authorized Officer</p>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {currentUser?.full_name} ({currentUser?.email})
            </p>
          </div>

          {/* Nav */}
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
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Back to Public/Subscriber Link */}
        <div className="pt-6 border-t border-slate-850 mt-6">
          <Link href="/dashboard" className="w-full block">
            <Button variant="outline" size="sm" className="w-full text-xs gap-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Player Portal
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
