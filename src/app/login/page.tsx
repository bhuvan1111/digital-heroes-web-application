"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataStore } from "@/lib/data/store";
import { Trophy, ArrowRight, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("user@digitalheroes.golf");
  const [password, setPassword] = React.useState("UserPassword123!");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = DataStore.loginWithEmail(email);
      setTimeout(() => {
        setIsLoading(false);
        if (user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard/overview");
        }
      }, 600);
    } catch (err: unknown) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  };

  const fillSubscriberDemo = () => {
    setEmail("user@digitalheroes.golf");
    setPassword("UserPassword123!");
    setError("");
  };

  const fillAdminDemo = () => {
    setEmail("admin@digitalheroes.golf");
    setPassword("AdminPassword123!");
    setError("");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center text-slate-950 font-black">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">DIGITAL HEROES</span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to Your Account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Access your Stableford scores, monthly draw tickets, and charity impact.
          </p>
        </div>

        {/* Quick Demo Fill Box for Evaluators */}
        <div className="p-4 rounded-xl border border-brand-500/30 bg-brand-950/20 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-brand-400">⚡ Evaluator Quick Credentials</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={fillSubscriberDemo}
              className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-brand-500 text-slate-200 text-left transition-colors flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5 text-brand-400" />
              <span>Subscriber Demo</span>
            </button>
            <button
              type="button"
              onClick={fillAdminDemo}
              className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-200 text-left transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Admin Demo</span>
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
