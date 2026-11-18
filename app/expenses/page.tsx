"use client";

import React, { useState, useMemo } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Ban,
  Camera,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
} from "lucide-react";
import { useFarm } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/formatters";

export default function ExpensesPage() {
  const {
    expenses,
    categories,
    partners,
    polyhouses,
    voidExpense,
    setIsQuickExpenseOpen,
    currentRole,
  } = useFarm();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPayer, setSelectedPayer] = useState("all");
  const [selectedPolyhouse, setSelectedPolyhouse] = useState("all");
  const [voidingExpenseId, setVoidingExpenseId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");

  // Filtering
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (e.isVoid) return false;
      if (selectedCategory !== "all" && e.categoryId !== selectedCategory) return false;
      if (selectedPayer !== "all") {
        if (selectedPayer === "farm_cash" && e.paidByType !== "farm_cash") return false;
        if (selectedPayer === "bank" && e.paidByType !== "bank") return false;
        if (selectedPayer.startsWith("partner_") && e.paidByPartnerId !== selectedPayer.replace("partner_", ""))
          return false;
      }
      if (selectedPolyhouse !== "all" && e.polyhouseId !== selectedPolyhouse) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = e.description.toLowerCase().includes(query);
        const catMatch = e.categoryName?.toLowerCase().includes(query);
        const payerMatch = e.paidByPartnerName?.toLowerCase().includes(query);
        if (!descMatch && !catMatch && !payerMatch) return false;
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedPayer, selectedPolyhouse, searchQuery]);

  // Totals calculations
  const totals = useMemo(() => {
    const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);
    const farmCash = filtered.filter((e) => e.paidByType === "farm_cash").reduce((sum, e) => sum + e.amount, 0);
    const farmBank = filtered.filter((e) => e.paidByType === "bank").reduce((sum, e) => sum + e.amount, 0);
    const partnerPaid = filtered.filter((e) => e.paidByType === "partner").reduce((sum, e) => sum + e.amount, 0);
    const pendingReimb = filtered
      .filter((e) => e.reimbursable && e.reimbursementStatus === "pending")
      .reduce((sum, e) => sum + e.amount, 0);

    return { totalAmount, farmCash, farmBank, partnerPaid, pendingReimb };
  }, [filtered]);

  const handleConfirmVoid = () => {
    if (!voidingExpenseId || !voidReason.trim()) {
      alert("Please enter a reason for voiding this expense");
      return;
    }
    voidExpense(voidingExpenseId, voidReason.trim());
    setVoidingExpenseId(null);
    setVoidReason("");
  };

  const handleExportCSV = () => {
    const headers = "Date,Category,Description,Amount,Paid By,Polyhouse,Mode,Reimbursable,Status\n";
    const rows = filtered
      .map(
        (e) =>
          `"${e.date}","${e.categoryName}","${e.description.replace(/"/g, '""')}","${e.amount}","${
            e.paidByType === "partner" ? e.paidByPartnerName : e.paidByType
          }","${e.polyhouseName || "Whole Farm"}","${e.paymentMode}","${e.reimbursable ? "Yes" : "No"}","${
            e.reimbursementStatus
          }"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Farm_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase">
              Financial Outflow
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Farm Expense Register</h1>
          <p className="text-xs text-slate-500">Every single operational and capital cost logged with audit trail</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsQuickExpenseOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-100/80 via-orange-50/50 to-white border-2 border-amber-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Filtered Total</p>
          <p className="text-2xl md:text-3xl font-black text-amber-950 mt-1">{formatINR(totals.totalAmount)}</p>
          <p className="text-xs font-semibold text-amber-800/80 mt-1">{filtered.length} transactions</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-100/80 via-teal-50/50 to-white border-2 border-emerald-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">Farm Cash</p>
          <p className="text-2xl md:text-3xl font-black text-emerald-950 mt-1">{formatINR(totals.farmCash)}</p>
          <p className="text-xs font-semibold text-emerald-800/80 mt-1">Petty cash spend</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-100/80 via-blue-50/50 to-white border-2 border-sky-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-sky-900 uppercase tracking-wider">Farm Bank / UPI</p>
          <p className="text-2xl md:text-3xl font-black text-sky-950 mt-1">{formatINR(totals.farmBank)}</p>
          <p className="text-xs font-semibold text-sky-800/80 mt-1">Direct account pay</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-100/80 via-purple-50/50 to-white border-2 border-indigo-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">Partner Paid</p>
          <p className="text-2xl md:text-3xl font-black text-indigo-950 mt-1">{formatINR(totals.partnerPaid)}</p>
          <p className="text-xs font-semibold text-indigo-800/80 mt-1">Paid on behalf</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-100/80 via-pink-50/50 to-white border-2 border-rose-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">Pending Reimb.</p>
          <p className="text-2xl md:text-3xl font-black text-rose-950 mt-1">{formatINR(totals.pendingReimb)}</p>
          <p className="text-xs font-semibold text-rose-800/80 mt-1">Due to partners</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, payer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Paid By */}
          <select
            value={selectedPayer}
            onChange={(e) => setSelectedPayer(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All Payers</option>
            <option value="farm_cash">Farm Cash</option>
            <option value="bank">Farm Bank</option>
            {partners.map((p) => (
              <option key={p.id} value={`partner_${p.id}`}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Polyhouse */}
          <select
            value={selectedPolyhouse}
            onChange={(e) => setSelectedPolyhouse(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">Whole Farm & All PHs</option>
            {polyhouses.map((ph) => (
              <option key={ph.id} value={ph.id}>
                {ph.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Polyhouse</th>
                <th className="py-3 px-4">Paid By</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No expense records matching the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-semibold text-[11px]">
                        {exp.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-700">
                      <div>
                        <p className="font-semibold text-slate-900 truncate">{exp.description}</p>
                        {exp.subcategory && (
                          <p className="text-[10px] text-slate-500">{exp.subcategory}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {exp.polyhouseName || "Whole Farm"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {exp.paidByType === "partner" ? (
                        <div>
                          <span className="text-blue-700 font-bold">{exp.paidByPartnerName}</span>
                          <span className="block text-[10px] text-slate-500">
                            {exp.reimbursable ? "Reimbursable" : "Counts as Equity"}
                          </span>
                        </div>
                      ) : exp.paidByType === "farm_cash" ? (
                        <span className="text-emerald-700 font-semibold">💵 Farm Cash</span>
                      ) : (
                        <span className="text-purple-700 font-semibold">🏦 Farm Bank</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {exp.reimbursable ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            exp.reimbursementStatus === "settled"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {exp.reimbursementStatus === "settled" ? "Settled" : "Pending Reimb"}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Farm Direct</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {exp.billPhotoUrl && (
                          <a
                            href={exp.billPhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            title="View Receipt"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {currentRole === "admin" && (
                          <button
                            onClick={() => setVoidingExpenseId(exp.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Void Entry (Audit Trail)"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Void Confirmation Modal */}
      {voidingExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Ban className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-sm">Void Expense Entry</h3>
            </div>
            <p className="text-xs text-slate-600">
              This entry will not be deleted from the database, but marked as VOID with an audit reason.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reason for Voiding *</label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Duplicate entry, wrong amount entered, vendor cancelled..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg h-20"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setVoidingExpenseId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVoid}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
