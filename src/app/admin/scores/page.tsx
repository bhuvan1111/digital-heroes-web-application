"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { GolfScore, UserProfile } from "@/types";
import { formatDate } from "@/lib/utils";
import { Trophy, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface EnrichedScore extends GolfScore {
  user?: UserProfile | null;
}

export default function AdminScoresPage() {
  const [scores, setScores] = React.useState<EnrichedScore[]>([]);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    async function loadData() {
      try {
        const [allScores, allUsers] = await Promise.all([
          DataStore.getAllScores(),
          DataStore.getAllUsers(),
        ]);
        const userMap = new Map(allUsers.map((u) => [u.id, u]));
        const enriched: EnrichedScore[] = allScores.map((s) => ({
          ...s,
          user: userMap.get(s.user_id) || null,
        }));
        setScores(enriched);
      } catch (err) {
        console.error("Failed to load admin scores", err);
      }
    }
    loadData();
  }, []);

  const filtered = scores.filter((s) => {
    const text = `${s.user?.full_name || ""} ${s.user?.email || ""} ${s.course_name || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">Global Scores Ledger</Badge>
            <span className="text-xs text-slate-500">PRD Section 8 &amp; 20</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            All Registered Stableford Scores
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Inspect all player round logs across the platform (1 to 45 Stableford points).
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search player or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Scores Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Points</th>
                <th className="px-6 py-4">Date Played</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{s.user?.full_name || "Unknown Player"}</p>
                    <p className="text-xs text-slate-400">{s.user?.email}</p>
                  </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-400 font-extrabold text-sm">
                        {s.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {formatDate(s.played_date)}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {s.course_name || "Official Round"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                      {s.notes || "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
