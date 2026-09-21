"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DataStore } from "@/lib/data/store";
import { UserProfile } from "@/types";
import {
  Trophy,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  LogOut,
  User,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "../ui/button";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(() => DataStore.getCurrentUserSync());
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const user = DataStore.getCurrentUserSync();
    setCurrentUser(user);

    const handleUserChange = (e: CustomEvent<UserProfile | null>) => {
      setCurrentUser(e.detail);
    };
    window.addEventListener("dh:user-changed", handleUserChange as EventListener);
    return () => {
      window.removeEventListener("dh:user-changed", handleUserChange as EventListener);
    };
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      const { createClient, isSupabaseConfigured } = await import("@/lib/supabase/client");
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch {}

    await DataStore.setDemoUser(null);
    setCurrentUser(null);
    router.push("/login");
  };

  const navLinks = [
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Charities", href: "/charities" },
    { name: "Reward Draws", href: "/draws" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
  ];

  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1">
                DIGITAL HEROES
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              </span>
              <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase -mt-1">
                Play · Give · Win
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Action buttons */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser?.role === "admin" && (
            <Link href="/admin">
              <Button
                variant={isAdminRoute ? "gold" : "outline"}
                size="sm"
                className="gap-2 text-xs"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          )}

          {currentUser && (
            <Link href="/dashboard">
              <Button
                variant={isDashboardRoute ? "primary" : "secondary"}
                size="sm"
                className="gap-2 text-xs"
              >
                <LayoutDashboard className="h-4 w-4" />
                Subscriber Portal
              </Button>
            </Link>
          )}

          {!currentUser ? (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Join The Movement
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-brand-400 font-bold text-xs uppercase shadow-sm" title={currentUser.email}>
                {currentUser.role === "admin" ? (
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                ) : (
                  currentUser.full_name?.charAt(0) || <User className="h-4 w-4 text-brand-400" />
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-900"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-900 rounded-lg hover:text-white"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full justify-center">
                Subscriber Dashboard
              </Button>
            </Link>
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
