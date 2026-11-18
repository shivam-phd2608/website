"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Receipt,
  Users,
  FlaskConical,
  ShieldAlert,
  Zap,
  Package,
  Truck,
  Wrench,
  Droplets,
  BadgeIndianRupee,
  Landmark,
  Camera,
  RotateCcw,
} from "lucide-react";
import { useFarm } from "@/lib/store";
import { formatINR , todayISO } from "@/lib/formatters";

export function QuickExpenseModal() {
  const {
    isQuickExpenseOpen,
    setIsQuickExpenseOpen,
    categories,
    partners,
    polyhouses,
    addExpense,
    currentRole,
  } = useFarm();

  const [date, setDate] = useState(todayISO());
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "cat-01");
  const [amount, setAmount] = useState<string>("");
  const [paidByType, setPaidByType] = useState<"farm_cash" | "bank" | "partner">("farm_cash");
  const [paidByPartnerId, setPaidByPartnerId] = useState<string>(partners[0]?.id || "");
  const [polyhouseId, setPolyhouseId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank" | "UPI" | "card" | "cheque">("cash");
  const [reimbursable, setReimbursable] = useState(true);
  const [countsAsContribution, setCountsAsContribution] = useState(false);
  const [hasBillPhoto, setHasBillPhoto] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!isQuickExpenseOpen) return null;

  const categoryIcons: Record<string, React.ReactNode> = {
    "cat-01": <Users className="w-5 h-5" />,
    "cat-02": <FlaskConical className="w-5 h-5" />,
    "cat-03": <ShieldAlert className="w-5 h-5" />,
    "cat-04": <Zap className="w-5 h-5" />,
    "cat-05": <Package className="w-5 h-5" />,
    "cat-06": <Truck className="w-5 h-5" />,
    "cat-07": <Wrench className="w-5 h-5" />,
    "cat-08": <Droplets className="w-5 h-5" />,
    "cat-09": <BadgeIndianRupee className="w-5 h-5" />,
    "cat-10": <Landmark className="w-5 h-5" />,
    "cat-11": <Receipt className="w-5 h-5" />,
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addValue).toString());
  };

  const handleSubmit = (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid expense amount");
      return;
    }

    const partner = partners.find((p) => p.id === paidByPartnerId);
    const poly = polyhouses.find((p) => p.id === polyhouseId);

    addExpense({
      date,
      categoryId: selectedCategoryId,
      categoryName: selectedCategory?.name || "General Expense",
      description: description.trim() || `${selectedCategory?.name || "Expense"} entry`,
      amount: numAmount,
      paidByType,
      paidByPartnerId: paidByType === "partner" ? paidByPartnerId : undefined,
      paidByPartnerName: paidByType === "partner" ? partner?.name : undefined,
      polyhouseId: polyhouseId || undefined,
      polyhouseName: poly ? poly.name : "Whole Farm",
      paymentMode,
      billPhotoUrl: hasBillPhoto ? "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400" : undefined,
      reimbursable: paidByType === "partner" ? reimbursable : false,
      countsAsContribution: paidByType === "partner" ? countsAsContribution : false,
      reimbursementStatus: paidByType === "partner" && reimbursable ? "pending" : "none",
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);

    if (addAnother) {
      setAmount("");
      setDescription("");
      setHasBillPhoto(false);
    } else {
      setIsQuickExpenseOpen(false);
      setAmount("");
      setDescription("");
      setHasBillPhoto(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Quick Add Expense</h2>
              <p className="text-xs text-emerald-100">Log farm spending in under 30 seconds</p>
            </div>
          </div>
          <button
            onClick={() => setIsQuickExpenseOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="bg-emerald-500 text-white text-xs font-semibold px-4 py-2 text-center animate-in slide-in-from-top-2">
            ✓ Expense recorded successfully into farm ledger!
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Date & Amount in Large Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Expense Date</label>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 flex justify-between mb-1">
                <span>Amount (₹ INR) *</span>
                {parseFloat(amount) > 0 && (
                  <span className="text-emerald-700 font-bold">{formatINR(parseFloat(amount))}</span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-lg font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xl font-bold bg-white border border-emerald-500 rounded-lg text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  autoFocus
                  required
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="flex gap-2 mt-2">
                {[500, 1000, 5000, 10000, 25000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAddAmount(val)}
                    className="text-[11px] font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 px-2 py-0.5 rounded-md transition-colors"
                  >
                    +₹{val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
                {amount && (
                  <button
                    type="button"
                    onClick={() => setAmount("")}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-0.5 ml-auto"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Category Icon Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-1 ring-emerald-500"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {categoryIcons[cat.id] || <Receipt className="w-4 h-4" />}
                    </div>
                    <span className="truncate leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Paid By (Farm Cash / Bank / Partner) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Who Paid For This? *</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaidByType("farm_cash");
                    setPaymentMode("cash");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    paidByType === "farm_cash"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  💵 Farm Cash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaidByType("bank");
                    setPaymentMode("bank");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    paidByType === "bank"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  🏦 Farm Bank / UPI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaidByType("partner");
                    setPaymentMode("UPI");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    paidByType === "partner"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  👤 Paid by Partner
                </button>
              </div>
            </div>

            {/* Partner Specific Toggles */}
            {paidByType === "partner" && (
              <div className="pt-2 border-t border-slate-200 space-y-2.5 animate-in fade-in duration-150">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Paying Partner</label>
                  <select
                    value={paidByPartnerId}
                    onChange={(e) => setPaidByPartnerId(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatINR(p.committedAmount)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reimbursable}
                      onChange={(e) => {
                        setReimbursable(e.target.checked);
                        if (e.target.checked) setCountsAsContribution(false);
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Reimbursable (Farm owes partner)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={countsAsContribution}
                      onChange={(e) => {
                        setCountsAsContribution(e.target.checked);
                        if (e.target.checked) setReimbursable(false);
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-slate-700 font-medium">Counts as Capital Contribution</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Polyhouse & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Cost Tagging (Polyhouse)</label>
              <select
                value={polyhouseId}
                onChange={(e) => setPolyhouseId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
              >
                <option value="">🌳 Whole Farm / General Cost</option>
                {polyhouses.map((ph) => (
                  <option key={ph.id} value={ph.id}>
                    {ph.name} ({ph.blockName || "Block"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Description / Notes</label>
              <input
                type="text"
                placeholder="e.g. Fertilizer bag, pruning wages, diesel"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Step 5: Bill Photo / Receipt Attachment */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Receipt / Bill Photo:</span>
              <span className="text-xs text-slate-500">
                {hasBillPhoto ? "✓ Photo attached (bill-receipt.jpg)" : "Optional"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHasBillPhoto(!hasBillPhoto)}
              className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors ${
                hasBillPhoto
                  ? "bg-rose-50 text-rose-700 border-rose-300"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {hasBillPhoto ? "Remove" : "+ Attach Receipt"}
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsQuickExpenseOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg"
            >
              Save & Add Another
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
