"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { UserProfile } from "@/types";
import { User, Lock, Bell, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function DashboardSettingsPage() {
  const [currentUser, setCurrentUser] = React.useState<UserProfile>(DataStore.getCurrentUser());
  const [fullName, setFullName] = React.useState(currentUser.full_name);
  const [handicap, setHandicap] = React.useState(currentUser.handicap || 18.0);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);
    setFullName(user.full_name);
    setHandicap(user.handicap || 18.0);
  }, []);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    DataStore.updateUser(currentUser.id, {
      full_name: fullName,
      handicap: Number(handicap),
    });
    setFeedback("Profile updated successfully!");
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal details, handicap index, and communication preferences.
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {feedback}
        </div>
      )}

      {/* Profile Form */}
      <Card className="p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <User className="h-5 w-5 text-brand-400" />
          Personal Profile
        </h3>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Full Name
            </label>
            <Input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Email Address
            </label>
            <Input
              type="email"
              disabled
              value={currentUser.email}
              className="opacity-70 cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Contact support to update your authenticated email.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Official Handicap Index
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="54"
              value={handicap}
              onChange={(e) => setHandicap(Number(e.target.value))}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Password */}
      <Card className="p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-400" />
          Password &amp; Security
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Password updates trigger a verification email linked through Supabase Auth.
        </p>

        <div className="space-y-4">
          <Input type="password" placeholder="Current Password" />
          <Input type="password" placeholder="New Secure Password" />
          <div className="pt-2 flex justify-end">
            <Button variant="secondary" size="sm">
              Update Password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
