"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { UserProfile, Subscription, UserCharity, Charity } from "@/types";
import { formatDate } from "@/lib/utils";
import { Users, Search, Filter, ShieldCheck, User as UserIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface EnrichedUser extends UserProfile {
  subscription?: Subscription | null;
  userCharity?: UserCharity;
  charity?: Charity;
}

export default function AdminUsersPage() {
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [usersData, setUsersData] = React.useState<{ users: EnrichedUser[]; total: number }>({
    users: [],
    total: 0,
  });

  const loadUsers = React.useCallback(async () => {
    try {
      const [allUsers, allSubs] = await Promise.all([
        DataStore.getAllUsers(),
        DataStore.getAllSubscriptions(),
      ]);

      let filtered = allUsers;
      if (roleFilter !== "all") {
        filtered = filtered.filter((u) => u.role === roleFilter);
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
      }

      const enriched: EnrichedUser[] = await Promise.all(
        filtered.map(async (u) => {
          const sub = allSubs.find((s) => s.user_id === u.id) || null;
          const uc = await DataStore.getUserCharity(u.id);
          return {
            ...u,
            subscription: sub,
            userCharity: uc.userCharity,
            charity: uc.charity,
          };
        })
      );

      const pageStart = (currentPage - 1) * 10;
      const paginated = enriched.slice(pageStart, pageStart + 10);
      setUsersData({ users: paginated, total: enriched.length });
    } catch (err) {
      console.error("Failed to load users", err);
    }
  }, [query, roleFilter, currentPage]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const totalPages = Math.ceil(usersData.total / 10) || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">Member Directory</Badge>
            <span className="text-xs text-slate-500">PRD Section 20</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            User Accounts &amp; Subscriptions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse registered players, audit handicap credentials, and view active charity pledges.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Roles</option>
            <option value="user">Subscribers (Players)</option>
            <option value="admin">Platform Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Handicap</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Charity Pledge</th>
                <th className="px-6 py-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {usersData.users.map((u) => {
                const sub = u.subscription;
                const uc = { userCharity: u.userCharity, charity: u.charity };

                return (
                  <tr key={u.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-brand-400 font-bold text-xs uppercase shrink-0">
                        {u.role === "admin" ? (
                          <ShieldCheck className="h-4 w-4 text-amber-400" />
                        ) : (
                          u.full_name?.charAt(0) || "U"
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white">{u.full_name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.role === "admin" ? (
                        <Badge variant="gold" className="gap-1">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">Player</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {u.handicap ? `${u.handicap} HI` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {sub ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {sub.plan === "yearly" ? "Annual" : "Monthly"} ({sub.status})
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {uc.charity ? (
                        <div>
                          <p className="font-semibold text-slate-200">{uc.charity.name}</p>
                          <p className="text-brand-400 font-bold">{uc.userCharity?.contribution_percentage}% Pledge</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">None Selected</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, usersData.total)} of {usersData.total} accounts
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="gap-1 py-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <span className="px-2 font-semibold text-white">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1 py-1"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
