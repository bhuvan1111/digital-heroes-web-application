"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, ShieldCheck, UserCheck, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DEMO_USERS } from "@/lib/data/mock-data";
import { DataStore } from "@/lib/data/store";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const performLogin = async (userEmail: string, userPass: string) => {
    setError("");
    setIsLoading(true);

    const cleanEmail = userEmail.trim().toLowerCase();

    // 1. Try Supabase if active configuration exists
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: userPass,
        });

        if (!authError && data?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle();

          const authUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: data.user.user_metadata?.full_name || "Member",
            role: (profile?.role || "user") as "user" | "admin",
            handicap: 14.0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await DataStore.setDemoUser(authUser);

          setIsLoading(false);
          if (authUser.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard/overview");
          }
          return;
        }
      } catch {
        // Fall through to demo authentication seamlessly if network or Supabase fails
      }
    }

    // 2. Demo persona / offline mode sign in
    const matchedUser =
      DEMO_USERS.find((u) => u.email.toLowerCase() === cleanEmail) ||
      (cleanEmail.includes("admin")
        ? DEMO_USERS[0]
        : {
            id: `u-${Date.now()}`,
            email: cleanEmail,
            full_name: cleanEmail.split("@")[0] || "Player",
            role: "user" as const,
            handicap: 14.0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

    await DataStore.setDemoUser(matchedUser);

    setIsLoading(false);
    if (matchedUser.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard/overview");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleQuickLogin = (demoRole: "admin" | "subscriber") => {
    if (demoRole === "admin") {
      setEmail("admin@digitalheroes.golf");
      setPassword("AdminPassword123!");
      performLogin("admin@digitalheroes.golf", "AdminPassword123!");
    } else {
      setEmail("user@digitalheroes.golf");
      setPassword("UserPassword123!");
      performLogin("user@digitalheroes.golf", "UserPassword123!");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-brand-500/25">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">DIGITAL HEROES</span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to Your Account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Access your Stableford scores, monthly draw tickets, and charity impact.
          </p>
        </div>

        {/* Quick 1-Click Demo Persona Access */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
            <Sparkles className="h-3.5 w-3.5" />
            Quick Demo Persona Sign In
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickLogin("subscriber")}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/60 transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-brand-400">
                <UserCheck className="h-3.5 w-3.5 text-brand-400" />
                Subscriber
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Marcus Vance (Player)</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("admin")}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-amber-400">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                Administrator
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Victoria Sterling (Director)</p>
            </button>
          </div>
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
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <span className="text-xs text-brand-400 hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-400 hover:underline font-semibold">
              Create one now
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
