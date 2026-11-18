"use client";

import React, { useState } from "react";
import { X, Check, Users, IndianRupee } from "lucide-react";
import { useFarm } from "@/lib/store";
import { formatINR , todayISO } from "@/lib/formatters";

export function QuickContributionModal() {
  const {
    isQuickContributionOpen,
    setIsQuickContributionOpen,
    partners,
    addContribution,
  } = useFarm();

  const [partnerId, setPartnerId] = useState(partners[0]?.id || "");
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"bank" | "cash" | "UPI" | "cheque" | "other">("bank");
  const [reference, setReference] = useState("");
  const [purpose, setPurpose] = useState("Capital Contribution for Polyhouse Operations");

  if (!isQuickContributionOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid contribution amount");
      return;
    }

    const partner = partners.find((p) => p.id === partnerId);

    addContribution({
      partnerId,
      partnerName: partner?.name || "Partner",
      date,
      amount: numAmount,
      mode,
      reference: reference.trim() || undefined,
      purpose: purpose.trim() || "Capital Contribution",
    });

    setIsQuickContributionOpen(false);
    setAmount("");
    setReference("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Record Partner Contribution</h2>
              <p className="text-xs text-blue-100">Money in from investing partner</p>
            </div>
          </div>
          <button
            onClick={() => setIsQuickContributionOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Partner *</label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              required
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.familyGroup} (Share: {formatINR(p.committedAmount)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Date *</label>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Mode *</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                <option value="bank">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 flex justify-between mb-1">
              <span>Contribution Amount (₹ INR) *</span>
              {parseFloat(amount) > 0 && (
                <span className="text-blue-700 font-bold">{formatINR(parseFloat(amount))}</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-lg font-bold text-slate-400">₹</span>
              <input
                type="number"
                placeholder="5,00,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xl font-bold bg-white border border-blue-500 rounded-lg text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Transaction Ref / Cheque No</label>
            <input
              type="text"
              placeholder="e.g. HDFC-NEFT-994182"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Purpose / Notes</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsQuickContributionOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Contribution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
