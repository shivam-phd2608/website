"use client";

import React, { useState } from "react";
import { X, Check, Flower2, AlertCircle } from "lucide-react";
import { useFarm } from "@/lib/store";
import { formatNumber , todayISO } from "@/lib/formatters";

export function QuickHarvestModal() {
  const {
    isQuickHarvestOpen,
    setIsQuickHarvestOpen,
    polyhouses,
    varieties,
    grades,
    addHarvest,
    addHarvestBatch,
    harvestBatches,
    currentUser,
  } = useFarm();

  const [date, setDate] = useState(todayISO());
  const [harvestTime, setHarvestTime] = useState("06:30");
  const [polyhouseId, setPolyhouseId] = useState(polyhouses[0]?.id || "ph-01");
  const [pickedBy, setPickedBy] = useState(currentUser?.fullName || "");
  const [selectedVarietyId, setSelectedVarietyId] = useState(varieties[0]?.id || "var-01");
  const [bucketsCount, setBucketsCount] = useState<number>(0);
  const [stemsPerBucket, setStemsPerBucket] = useState<number>(50);

  // Grade stems state
  const [stemsMap, setStemsMap] = useState<Record<string, number>>({
    "gr-01": 0,
    "gr-02": 0,
    "gr-03": 0,
    "gr-04": 0,
    "gr-05": 0,
    "gr-06": 0,
  });

  const [wastageStems, setWastageStems] = useState<number>(0);
  const [wastageReason, setWastageReason] = useState<"disease" | "damage" | "short stem" | "overripe" | "bent stem" | "thrips" | "other">("damage");
  const [notes, setNotes] = useState("");

  if (!isQuickHarvestOpen) return null;

  const totalGood = Object.values(stemsMap).reduce((sum, val) => sum + (val || 0), 0);
  const totalStems = totalGood + (wastageStems || 0);
  const wastageRate = totalStems > 0 ? ((wastageStems / totalStems) * 100).toFixed(1) : "0.0";

  const handleGradeChange = (gradeId: string, val: string) => {
    const num = parseInt(val) || 0;
    setStemsMap((prev) => ({ ...prev, [gradeId]: num }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bucketsCount <= 0 && totalGood <= 0) {
      alert("Please enter harvested buckets count or stem counts");
      return;
    }

    const poly = polyhouses.find((p) => p.id === polyhouseId);
    const variety = varieties.find((v) => v.id === selectedVarietyId);

    const bCount = Math.max(1, bucketsCount || Math.ceil(totalStems / stemsPerBucket) || 10);
    const spb = stemsPerBucket || 50;

    // 1. Add to Traceability Harvest Batches (Section 3)
    const dateFormatted = date.replace(/-/g, "");
    const seq = String(harvestBatches.length + 1).padStart(3, "0");
    const newBatchRef = `HV-${dateFormatted}-${seq}`;

    addHarvestBatch({
      batchRef: newBatchRef,
      harvestDate: date,
      harvestTime,
      polyhouseId,
      polyhouseName: poly?.name || "Polyhouse",
      farmId: "farm-01",
      lines: [
        {
          id: `line-${Date.now()}-0`,
          varietyId: selectedVarietyId,
          varietyName: variety?.name || "Rose",
          flowerColor: variety?.color,
          bucketsHarvested: bCount,
          stemsPerBucket: spb,
          totalStemsHarvested: bCount * spb,
          remarks: notes.trim() || undefined,
        },
      ],
      totalBuckets: bCount,
      totalEstimatedStems: bCount * spb,
      harvestedBy: pickedBy,
      remarks: notes.trim() || undefined,
      status: "available_for_dispatch",
    });

    // 2. Also record legacy harvest entry for backward compatibility
    const lines = grades.map((g) => ({
      id: `hl-${Date.now()}-${g.id}`,
      varietyId: selectedVarietyId,
      varietyName: variety?.name,
      gradeId: g.id,
      gradeName: g.name,
      stemsGood: stemsMap[g.id] || 0,
      stemsWastage: g.id === "gr-06" ? wastageStems : 0,
      wastageReason: g.id === "gr-06" && wastageStems > 0 ? wastageReason : undefined,
    })).filter((l) => l.stemsGood > 0 || l.stemsWastage > 0);

    addHarvest({
      date,
      polyhouseId,
      polyhouseName: poly?.name || "Polyhouse",
      pickedBy,
      lines,
      totalGoodStems: totalGood > 0 ? totalGood : bCount * spb,
      totalWastageStems: wastageStems,
      notes: notes.trim() || undefined,
      isLocked: false,
    });

    setIsQuickHarvestOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-rose-700 to-pink-800 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Flower2 className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Record Daily Harvest</h2>
              <p className="text-xs text-rose-100">Log cut flowers per polyhouse and grade</p>
            </div>
          </div>
          <button
            onClick={() => setIsQuickHarvestOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Harvest Date</label>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Polyhouse *</label>
              <select
                value={polyhouseId}
                onChange={(e) => setPolyhouseId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                {polyhouses.map((ph) => (
                  <option key={ph.id} value={ph.id}>
                    {ph.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Rose Variety *</label>
              <select
                value={selectedVarietyId}
                onChange={(e) => setSelectedVarietyId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                {varieties.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.color})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Harvest Buckets Input (Section 3 Requirement) */}
          <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/80 flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="w-1/2">
              <label className="text-xs font-bold text-rose-900 block mb-1">
                Buckets Harvested *
              </label>
              <input
                type="number"
                min="1"
                value={bucketsCount}
                onChange={(e) => setBucketsCount(parseInt(e.target.value) || 0)}
                className="w-full text-sm font-black p-2 bg-white border border-rose-300 rounded-lg text-rose-950 focus:ring-2 focus:ring-rose-500"
                placeholder="15"
                required
              />
              <span className="text-[10px] text-rose-800 font-medium">Initial field measurement</span>
            </div>
            <div className="w-1/2">
              <label className="text-xs font-bold text-rose-900 block mb-1">
                Measured Stems / Bucket
              </label>
              <input
                type="number"
                min="1"
                value={stemsPerBucket}
                onChange={(e) => setStemsPerBucket(parseInt(e.target.value) || 50)}
                className="w-full text-sm font-bold p-2 bg-white border border-rose-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-rose-500"
                placeholder="50"
              />
              <span className="text-[10px] text-rose-800 font-medium">Configurable conversion (~{bucketsCount * stemsPerBucket} stems)</span>
            </div>
          </div>

          {/* Stems by Grade Grid */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Grade-Wise Good Stems (Lengths)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {grades.filter(g => g.name !== "Reject").map((grade) => (
                <div key={grade.id} className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Grade {grade.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stemsMap[grade.id] || ""}
                    onChange={(e) => handleGradeChange(grade.id, e.target.value)}
                    className="w-full text-sm font-bold p-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Wastage Section */}
          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-rose-900 block mb-1">Wastage / Rejection Stems</label>
              <input
                type="number"
                min="0"
                value={wastageStems}
                onChange={(e) => setWastageStems(parseInt(e.target.value) || 0)}
                className="w-full text-sm font-bold p-2 bg-white border border-rose-300 rounded-lg text-rose-950"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-rose-900 block mb-1">Wastage Reason</label>
              <select
                value={wastageReason}
                onChange={(e) => setWastageReason(e.target.value as typeof wastageReason)}
                className="w-full text-xs p-2 bg-white border border-rose-300 rounded-lg font-medium text-slate-800"
              >
                <option value="damage">Physical Handling Damage</option>
                <option value="disease">Fungal / Powdery Mildew</option>
                <option value="thrips">Thrips / Pest Infestation</option>
                <option value="bent stem">Bent / Crooked Stem</option>
                <option value="short stem">Short Stem (&lt; 35cm)</option>
                <option value="overripe">Overripe / Blown Flower</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Live Summary Bar */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-400">Total Harvested</p>
              <p className="text-base font-bold text-emerald-400">{formatNumber(totalGood)} stems</p>
            </div>
            <div>
              <p className="text-slate-400">Wastage Stems</p>
              <p className="text-base font-bold text-rose-400">{formatNumber(wastageStems)} stems</p>
            </div>
            <div>
              <p className="text-slate-400">Wastage Rate</p>
              <p className="text-base font-bold text-amber-300">{wastageRate}%</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsQuickHarvestOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Harvest Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
