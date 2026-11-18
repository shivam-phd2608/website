"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  User,
  ArrowRight,
  FileText,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import { useFarm } from "@/lib/store";
import { formatDate } from "@/lib/formatters";

export default function AuditTrailPage() {
  const { auditLogs, currentUser } = useFarm();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (selectedModule !== "all" && log.module !== selectedModule) return false;
      if (selectedAction !== "all" && log.action !== selectedAction) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = log.recordRef.toLowerCase().includes(q);
        const matchesUser = log.userName.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        if (!matchesRef && !matchesUser && !matchesDetails) return false;
      }
      return true;
    });
  }, [auditLogs, selectedModule, selectedAction, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
              Governance & Integrity
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Immutable operational change history & traceability audit
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Operational Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Track who changed what, when it was changed, original versus updated values, and preserve accountability.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{auditLogs.length} Logged Audit Events</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search record ref, user, details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Module:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Modules</option>
              <option value="harvest">Daily Harvest</option>
              <option value="dispatch1">Dispatch 1 (Farm)</option>
              <option value="grading">Stem Grading</option>
              <option value="packing">Packing Management</option>
              <option value="dispatch2">Dispatch 2 (Auction)</option>
              <option value="auction_realization">Auction Realization</option>
              <option value="polyhouse">Polyhouse Config</option>
              <option value="master_data">Master Setup</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update / Edit</option>
              <option value="confirm_receipt">Confirm Receipt</option>
              <option value="void">Void</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-500">
          Showing {filteredLogs.length} audit entries
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No audit logs matching search</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold text-[11px]">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">User & Role</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Record Ref</th>
                <th className="py-3 px-3">Operational Details</th>
                <th className="py-3 px-3">Value Changes (Previous → New)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isUpdate = log.action === "update";
                return (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {log.timestamp.replace("T", " ").substring(0, 16)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{log.userRole}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                        {log.module.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.action === "create"
                            ? "bg-emerald-100 text-emerald-800"
                            : log.action === "update"
                            ? "bg-blue-100 text-blue-800"
                            : log.action === "confirm_receipt"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <Link
                        href={`/reports?batchRef=${log.recordRef}`}
                        className="text-blue-700 hover:underline"
                        title="View batch lineage"
                      >
                        {log.recordRef}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {log.details}
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] max-w-xs">
                      {log.previousValue || log.newValue ? (
                        <div className="space-y-0.5">
                          {log.previousValue && (
                            <div className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded truncate">
                              Prev: {log.previousValue}
                            </div>
                          )}
                          {log.newValue && (
                            <div className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate">
                              New: {log.newValue}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
