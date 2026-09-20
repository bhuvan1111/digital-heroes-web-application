"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { AuditLog } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { ShieldCheck, History, Database, Key, Server, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);

  React.useEffect(() => {
    async function loadLogs() {
      try {
        const logs = await DataStore.getAuditLogs();
        setAuditLogs(logs);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="gold">Compliance &amp; Security</Badge>
          <span className="text-xs text-slate-500">PRD Section 33</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Configuration &amp; Audit Logs
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Immutable audit record of all administrative operations, draw publications, and financial approvals.
        </p>
      </div>

      {/* Platform Architecture Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <div className="flex items-center gap-2 text-brand-400 mb-2">
            <Database className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">PostgreSQL RLS</span>
          </div>
          <p className="text-sm font-bold text-white">Row Level Security Enabled</p>
          <p className="text-[11px] text-slate-400 mt-1">13 tables secured via database policies.</p>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Key className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Stripe Webhooks</span>
          </div>
          <p className="text-sm font-bold text-white">Cryptographic Verification</p>
          <p className="text-[11px] text-slate-400 mt-1">Raw signature check protects billing status.</p>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Server className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Storage Engine</span>
          </div>
          <p className="text-sm font-bold text-white">Supabase Storage</p>
          <p className="text-[11px] text-slate-400 mt-1">File-type and size-limited uploads (5MB max).</p>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Security &amp; Action Audit Trail</h3>
          </div>
          <Badge variant="outline">{auditLogs.length} Events Recorded</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Officer (Admin)</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Entity ID</th>
                <th className="px-6 py-4">Audit Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-white">
                    {log.admin_email || "System Governance"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-amber-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-300 uppercase">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400 truncate max-w-[120px]">
                    {log.entity_id || "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-xs truncate">
                    {JSON.stringify(log.metadata)}
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
