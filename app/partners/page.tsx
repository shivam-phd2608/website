"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  BadgeIndianRupee,
  TrendingUp,
  Download,
  Info,
  Clock,
  CheckCircle2,
  Receipt,
  FileText,
  Building,
  Trash2,
  Edit2,
} from "lucide-react";
import { useFarm } from "@/lib/store";
import { formatINR, formatDate, FORMULA_TOOLTIPS , todayISO } from "@/lib/formatters";

export default function PartnersPage() {
  const {
    partners,
    partnerLedgers,
    contributions,
    expenses,
    reimbursements,
    addPartner,
    deletePartner,
    currentRole,
    currentPartnerId,
    setIsQuickContributionOpen,
    addReimbursement,
  } = useFarm();

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    currentRole === "partner" ? currentPartnerId : partners[0]?.id || "p-01"
  );

  // Add Partner Modal
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerFamily, setPartnerFamily] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerAmount, setPartnerAmount] = useState("");

  // Reimbursement modal state
  const [isReimbModalOpen, setIsReimbModalOpen] = useState(false);
  const [reimbAmount, setReimbAmount] = useState("");
  const [reimbReference, setReimbReference] = useState("");

  // Aggregate Totals
  const totalCommitted = partnerLedgers.reduce((sum, p) => sum + p.committedAmount, 0);
  const totalContributed = partnerLedgers.reduce((sum, p) => sum + p.contributedAmount, 0);
  const totalOutstanding = partnerLedgers.reduce((sum, p) => sum + p.outstandingCommitment, 0);
  const totalReimbDue = partnerLedgers.reduce((sum, p) => sum + p.reimbursementDue, 0);
  const totalNetCapital = partnerLedgers.reduce((sum, p) => sum + p.netCapitalInFarm, 0);

  // Selected partner statement
  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);
  const selectedLedger = partnerLedgers.find((p) => p.partnerId === selectedPartnerId);

  // Partner specific transaction history
  const partnerContributions = contributions.filter(
    (c) => !c.isVoid && c.partnerId === selectedPartnerId
  );
  const partnerExpensesPaid = expenses.filter(
    (e) => !e.isVoid && e.paidByType === "partner" && e.paidByPartnerId === selectedPartnerId
  );
  const partnerReimbursements = reimbursements.filter(
    (r) => !r.isVoid && r.partnerId === selectedPartnerId
  );

  const handleSaveNewPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) return;

    addPartner({
      name: partnerName.trim(),
      familyGroup: partnerFamily.trim() || `${partnerName} Family`,
      phone: partnerPhone.trim() || "",
      email: partnerEmail.trim() || "",
      committedAmount: parseFloat(partnerAmount) || 0,
      isActive: true,
    });

    setIsAddPartnerOpen(false);
    setPartnerName("");
    setPartnerFamily("");
    setPartnerPhone("");
    setPartnerEmail("");
    setPartnerAmount("");
  };

  const handleSaveReimbursement = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(reimbAmount);
    if (!num || num <= 0) return;

    addReimbursement({
      partnerId: selectedPartnerId,
      partnerName: selectedPartner?.name,
      date: todayISO(),
      amount: num,
      mode: "bank",
      reference: reimbReference || "FARM-NEFT-SETTLE",
      notes: "Settlement for reimbursable farm expenses",
    });

    setIsReimbModalOpen(false);
    setReimbAmount("");
    setReimbReference("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase">
              Equity & Capital Accounts (Amount in INR)
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Partner Ledgers & Capital Accounts</h1>
          <p className="text-xs text-slate-500">Track capital shares (in ₹ INR), cash contributions, and expense reimbursements</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddPartnerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Partner</span>
          </button>
          {currentRole === "admin" && (
            <button
              onClick={() => setIsQuickContributionOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Contribution</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Capital Committed</p>
          <p className="text-lg font-black text-slate-900">{formatINR(totalCommitted)}</p>
          <p className="text-[10px] text-slate-400">Target equity capital</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-emerald-600 uppercase">Cash Contributed</p>
          <p className="text-lg font-black text-emerald-700">{formatINR(totalContributed)}</p>
          <p className="text-[10px] text-emerald-600 font-medium">
            {totalCommitted > 0 ? Math.round((totalContributed / totalCommitted) * 100) : 0}% paid in
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-amber-600 uppercase">Outstanding Due</p>
          <p className="text-lg font-bold text-amber-700">{formatINR(totalOutstanding)}</p>
          <p className="text-[10px] text-slate-400">Due from partners</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-purple-600 uppercase">Reimbursement Due</p>
          <p className="text-lg font-bold text-purple-700">{formatINR(totalReimbDue)}</p>
          <p className="text-[10px] text-slate-400">Expenses owed to partners</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-slate-500">
            <p className="text-[11px] font-semibold uppercase">Net Capital In Farm</p>
            <span title={FORMULA_TOOLTIPS.netCapital} className="cursor-help text-slate-400">
              <Info className="w-3 h-3" />
            </span>
          </div>
          <p className="text-lg font-black text-blue-900">{formatINR(totalNetCapital)}</p>
          <p className="text-[10px] text-slate-400">Total skin in the game</p>
        </div>
      </div>

      {/* Partner Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Partner Schedule (Shares in ₹ INR)</h2>
          <span className="text-xs text-slate-500">Click any partner row to inspect individual ledger statement</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4">Partner Name</th>
                <th className="py-3 px-4">Family Group</th>
                <th className="py-3 px-4 text-right">Partner Share (INR)</th>
                <th className="py-3 px-4 text-right">Cash Contributed</th>
                <th className="py-3 px-4 text-right">Outstanding Due</th>
                <th className="py-3 px-4 text-right">Reimb. Due</th>
                <th className="py-3 px-4 text-right">Net Capital</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {partnerLedgers.map((p) => {
                const isSelected = selectedPartnerId === p.partnerId;
                return (
                  <tr
                    key={p.partnerId}
                    onClick={() => setSelectedPartnerId(p.partnerId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50/80 font-bold" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            isSelected ? "bg-blue-600" : "bg-slate-300"
                          }`}
                        />
                        <span>{p.partnerName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{p.familyGroup}</td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-900 text-sm">
                      {formatINR(p.committedAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">
                      {formatINR(p.contributedAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-700 font-semibold">
                      {formatINR(p.outstandingCommitment)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-purple-700 font-semibold">
                      {formatINR(p.reimbursementDue)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-blue-900 font-black">
                      {formatINR(p.netCapitalInFarm)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPartnerId(p.partnerId);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold"
                      >
                        View Statement
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Partner Statement & Timeline */}
      {selectedPartner && selectedLedger && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{selectedPartner.name}</h2>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200">
                  Committed Share: {formatINR(selectedPartner.committedAmount)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedPartner.familyGroup} • {selectedPartner.phone} • {selectedPartner.email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {currentRole === "admin" && selectedLedger.reimbursementDue > 0 && (
                <button
                  onClick={() => setIsReimbModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Settle Reimbursement ({formatINR(selectedLedger.reimbursementDue)})
                </button>
              )}
            </div>
          </div>

          {/* Partner Formula Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] text-slate-500 font-semibold uppercase">Committed Share (INR)</p>
              <p className="text-base font-bold text-slate-900">{formatINR(selectedLedger.committedAmount)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] text-emerald-600 font-semibold uppercase">Cash Contributed</p>
              <p className="text-base font-bold text-emerald-700">{formatINR(selectedLedger.contributedAmount)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] text-purple-600 font-semibold uppercase">Reimb. Due</p>
              <p className="text-base font-bold text-purple-700">{formatINR(selectedLedger.reimbursementDue)}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-[11px] text-blue-700 font-bold uppercase">Net Capital In Farm</p>
              <p className="text-base font-black text-blue-900">{formatINR(selectedLedger.netCapitalInFarm)}</p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Transaction History (Contributions, Out-of-pocket Expenses & Reimbursements)
            </h3>

            <div className="space-y-2">
              {partnerContributions.length === 0 && partnerExpensesPaid.length === 0 && partnerReimbursements.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                  No transaction activity logged yet for {selectedPartner.name}. Click &quot;+ Record Contribution&quot; or &quot;+ Log Expense&quot; to practice.
                </div>
              ) : (
                <>
                  {partnerContributions.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                          IN
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.purpose}</p>
                          <p className="text-slate-500 text-[11px]">
                            {formatDate(c.date)} • Mode: {c.mode.toUpperCase()} {c.reference && `• Ref: ${c.reference}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-black text-emerald-800 text-sm">
                        +{formatINR(c.amount)}
                      </div>
                    </div>
                  ))}

                  {partnerExpensesPaid.map((e) => (
                    <div
                      key={e.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{e.description}</p>
                          <p className="text-slate-500 text-[11px]">
                            {formatDate(e.date)} • Category: {e.categoryName} •{" "}
                            <span className="font-semibold text-blue-700">
                              {e.reimbursable ? "Reimbursable Farm Expense" : "Counts as Equity"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 text-sm">{formatINR(e.amount)}</p>
                        <span className="text-[10px] text-slate-400">Paid out-of-pocket</span>
                      </div>
                    </div>
                  ))}

                  {partnerReimbursements.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Reimbursement Payout from Farm</p>
                          <p className="text-slate-500 text-[11px]">
                            {formatDate(r.date)} • {r.notes} • Ref: {r.reference}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-bold text-purple-900 text-sm">
                        -{formatINR(r.amount)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD PARTNER MODAL */}
      {isAddPartnerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Partner</h3>
            <form onSubmit={handleSaveNewPartner} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Partner Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Reddy"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Family Group</label>
                <input
                  type="text"
                  placeholder="e.g. Reddy Family"
                  value={partnerFamily}
                  onChange={(e) => setPartnerFamily(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex justify-between mb-1">
                  <span>Partner Committed Share (Amount in INR) *</span>
                  {parseFloat(partnerAmount) > 0 && (
                    <span className="text-blue-700 font-bold">{formatINR(parseFloat(partnerAmount))}</span>
                  )}
                </label>
                <input
                  type="number"
                  step="10000"
                  placeholder="25,00,000"
                  value={partnerAmount}
                  onChange={(e) => setPartnerAmount(e.target.value)}
                  className="w-full text-sm font-bold p-2 border border-blue-500 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 99000 00000"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="partner@gmail.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPartnerOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REIMBURSEMENT MODAL */}
      {isReimbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Record Reimbursement Payout</h3>
            <p className="text-xs text-slate-600">
              Settle out-of-pocket expenses paid by <strong>{selectedPartner?.name}</strong>.
            </p>
            <form onSubmit={handleSaveReimbursement} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Amount to Settle (₹) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  defaultValue={selectedLedger?.reimbursementDue || ""}
                  onChange={(e) => setReimbAmount(e.target.value)}
                  className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Reference / UTR</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC-NEFT-99124"
                  value={reimbReference}
                  onChange={(e) => setReimbReference(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReimbModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
