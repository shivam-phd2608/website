"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Flower2,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  ArrowRight,
  Truck,
  Hash,
  Clock,
  Info,
  Check,
  X,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useFarm } from "@/lib/store";
import { HarvestBatch, HarvestBatchLine } from "@/lib/types";
import { formatNumber, formatDate , todayISO } from "@/lib/formatters";

const VARIETY_COLORS: Record<string, string> = {
  Jumilia: "#E11D48",
  Revival: "#DB2777",
  Hydrangea: "#0284C7",
  "Taj Mahal": "#DC2626",
  "Peach Avalanche": "#F97316",
  "White Avalanche": "#64748B",
  "Sweet Avalanche": "#EC4899",
  "Gold Strike": "#EAB308",
};

export default function HarvestPage() {
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");

  const {
    harvestBatches,
    polyhouses,
    varieties,
    addHarvestBatch,
    updateHarvestBatch,
    voidHarvestBatch,
    selectedPolyhouseFilter,
    setSelectedPolyhouseFilter,
    selectedVarietyFilter,
    setSelectedVarietyFilter,
    currentRole,
    currentUser,
    matchesPeriod,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<"batches" | "analytics">("batches");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  // Form Fields
  const [batchRef, setBatchRef] = useState("");
  const [harvestDate, setHarvestDate] = useState(todayISO());
  const [harvestTime, setHarvestTime] = useState("06:30");
  const [selectedPolyhouseId, setSelectedPolyhouseId] = useState(polyhouses[0]?.id || "ph-01");
  const [harvestedBy, setHarvestedBy] = useState(currentUser?.fullName || "");
  const [remarks, setRemarks] = useState("");

  // Lines for multiple varieties under this batch
  const [lines, setLines] = useState<
    Array<{
      id: string;
      varietyId: string;
      varietyName: string;
      bucketsHarvested: number;
      stemsPerBucket: number;
      remarks: string;
    }>
  >([]);

  // Filter batches based on timeline filter, polyhouse, variety, and search
  const displayedBatches = useMemo(() => {
    return harvestBatches.filter((b) => {
      if (b.isVoid) return false;
      if (!matchesPeriod(b.harvestDate || b.date)) return false;
      if (selectedPolyhouseFilter !== "all" && b.polyhouseId !== selectedPolyhouseFilter) return false;
      if (selectedVarietyFilter !== "all") {
        const hasVariety = b.lines.some((l) => l.varietyId === selectedVarietyFilter);
        if (!hasVariety) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = b.batchRef.toLowerCase().includes(q);
        const matchesPoly = b.polyhouseName.toLowerCase().includes(q);
        const matchesVariety = b.lines.some((l) => l.varietyName.toLowerCase().includes(q));
        if (!matchesRef && !matchesPoly && !matchesVariety) return false;
      }
      return true;
    });
  }, [harvestBatches, selectedPolyhouseFilter, selectedVarietyFilter, searchQuery, matchesPeriod]);

  // Totals
  const totalBuckets = useMemo(
    () => displayedBatches.reduce((sum, b) => sum + b.totalBuckets, 0),
    [displayedBatches]
  );
  const totalStems = useMemo(
    () => displayedBatches.reduce((sum, b) => sum + b.totalEstimatedStems, 0),
    [displayedBatches]
  );

  // Open Add Modal
  const openAddModal = () => {
    setEditingBatchId(null);
    const dateStr = new Date().toISOString().split("T")[0];
    const seq = String(harvestBatches.length + 1).padStart(3, "0");
    setBatchRef(`HV-${dateStr.replace(/-/g, "")}-${seq}`);
    setHarvestDate(dateStr);
    setHarvestTime("06:30");
    const initialPolyId = polyhouses[0]?.id || "ph-01";
    setSelectedPolyhouseId(initialPolyId);
    setHarvestedBy(currentUser?.fullName ? `${currentUser.fullName} (${currentUser.role})` : "");
    setRemarks("");

    // Populate lines with the varieties from the selected polyhouse
    const poly = polyhouses.find((p) => p.id === initialPolyId);
    if (poly && poly.varieties && poly.varieties.length > 0) {
      setLines(
        poly.varieties.map((v, idx) => ({
          id: `line-${Date.now()}-${idx}`,
          varietyId: v.varietyId,
          varietyName: v.varietyName,
          bucketsHarvested: 10,
          stemsPerBucket: 50,
          remarks: "",
        }))
      );
    } else {
      setLines([
        {
          id: `line-${Date.now()}-0`,
          varietyId: varieties[0]?.id || "var-01",
          varietyName: varieties[0]?.name || "Jumilia",
          bucketsHarvested: 12,
          stemsPerBucket: 50,
          remarks: "",
        },
      ]);
    }

    setIsModalOpen(true);
  };

  useEffect(() => {
    if (actionParam === "new") {
      openAddModal();
    }
  }, [actionParam]);

  // Open Edit Modal
  const openEditModal = (batch: HarvestBatch) => {
    setEditingBatchId(batch.id);
    setBatchRef(batch.batchRef);
    setHarvestDate(batch.harvestDate || batch.date || todayISO());
    setHarvestTime(batch.harvestTime || "06:30");
    setSelectedPolyhouseId(batch.polyhouseId);
    setHarvestedBy(batch.harvestedBy || "");
    setRemarks(batch.remarks || "");

    setLines(
      batch.lines.map((l) => ({
        id: l.id,
        varietyId: l.varietyId,
        varietyName: l.varietyName,
        bucketsHarvested: l.bucketsHarvested,
        stemsPerBucket: l.stemsPerBucket || 50,
        remarks: l.remarks || "",
      }))
    );

    setIsModalOpen(true);
  };

  // Handle Polyhouse change in form
  const handlePolyhouseChange = (newPolyId: string) => {
    setSelectedPolyhouseId(newPolyId);
    const poly = polyhouses.find((p) => p.id === newPolyId);
    if (poly && poly.varieties && poly.varieties.length > 0) {
      setLines(
        poly.varieties.map((v, idx) => ({
          id: `line-${Date.now()}-${idx}`,
          varietyId: v.varietyId,
          varietyName: v.varietyName,
          bucketsHarvested: 10,
          stemsPerBucket: 50,
          remarks: "",
        }))
      );
    }
  };

  // Add line to form
  const addLineToForm = () => {
    const unpicked = varieties.find((v) => !lines.some((l) => l.varietyId === v.id)) || varieties[0];
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length}`,
        varietyId: unpicked?.id || "var-01",
        varietyName: unpicked?.name || "Rose",
        bucketsHarvested: 5,
        stemsPerBucket: 50,
        remarks: "",
      },
    ]);
  };

  const removeLineFromForm = (lineId: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const updateLineField = (
    lineId: string,
    field: "varietyId" | "bucketsHarvested" | "stemsPerBucket" | "remarks",
    val: any
  ) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        if (field === "varietyId") {
          const found = varieties.find((v) => v.id === val);
          return { ...l, varietyId: val, varietyName: found ? found.name : l.varietyName };
        }
        return { ...l, [field]: val };
      })
    );
  };

  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert("Please add at least one flower variety to this harvest batch.");
      return;
    }

    const poly = polyhouses.find((p) => p.id === selectedPolyhouseId);
    const calculatedLines: HarvestBatchLine[] = lines.map((l) => {
      const bCount = Math.max(0, Number(l.bucketsHarvested) || 0);
      const spb = Math.max(1, Number(l.stemsPerBucket) || 50);
      const varObj = varieties.find((v) => v.id === l.varietyId);
      return {
        id: l.id,
        varietyId: l.varietyId,
        varietyName: l.varietyName,
        flowerColor: varObj?.color,
        bucketsHarvested: bCount,
        stemsPerBucket: spb,
        totalStemsHarvested: bCount * spb,
        remarks: l.remarks.trim() || undefined,
      };
    });

    const totBuckets = calculatedLines.reduce((s, l) => s + l.bucketsHarvested, 0);
    const totStems = calculatedLines.reduce((s, l) => s + (l.totalStemsHarvested || 0), 0);

    if (totBuckets <= 0) {
      alert("Please enter a valid number of harvested buckets.");
      return;
    }

    if (editingBatchId) {
      updateHarvestBatch(editingBatchId, {
        batchRef,
        harvestDate,
        harvestTime,
        polyhouseId: selectedPolyhouseId,
        polyhouseName: poly?.name || "Polyhouse",
        lines: calculatedLines,
        totalBuckets: totBuckets,
        totalEstimatedStems: totStems,
        harvestedBy,
        remarks: remarks.trim() || undefined,
      });
    } else {
      addHarvestBatch({
        batchRef: batchRef.trim() || `HV-${Date.now()}`,
        harvestDate,
        harvestTime,
        polyhouseId: selectedPolyhouseId,
        polyhouseName: poly?.name || "Polyhouse",
        farmId: "farm-01",
        lines: calculatedLines,
        totalBuckets: totBuckets,
        totalEstimatedStems: totStems,
        harvestedBy,
        remarks: remarks.trim() || undefined,
        status: "available_for_dispatch",
      });
    }

    setIsModalOpen(false);
  };

  // Analytics datasets
  const polyhouseChartData = useMemo(() => {
    const map: Record<string, { name: string; buckets: number; stems: number }> = {};
    displayedBatches.forEach((b) => {
      if (!map[b.polyhouseName]) {
        map[b.polyhouseName] = { name: b.polyhouseName, buckets: 0, stems: 0 };
      }
      map[b.polyhouseName].buckets += b.totalBuckets;
      map[b.polyhouseName].stems += b.totalEstimatedStems;
    });
    return Object.values(map);
  }, [displayedBatches]);

  const varietyChartData = useMemo(() => {
    const map: Record<string, { name: string; buckets: number; stems: number }> = {};
    displayedBatches.forEach((b) => {
      b.lines.forEach((l) => {
        if (!map[l.varietyName]) {
          map[l.varietyName] = { name: l.varietyName, buckets: 0, stems: 0 };
        }
        map[l.varietyName].buckets += l.bucketsHarvested;
        map[l.varietyName].stems += l.totalStemsHarvested || l.bucketsHarvested * (l.stemsPerBucket || 50);
      });
    });
    return Object.values(map);
  }, [displayedBatches]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider">
              Stage 1 • Flower Harvesting
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Bucket-based measurement with configurable stems/bucket
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Daily Harvest Management
          </h1>
          <p className="text-xs text-slate-500">
            Log flower cuts per polyhouse with multi-variety buckets and unique batch traceability references.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tab Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("batches")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "batches"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Harvest Batches ({displayedBatches.length})
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-rose-600" />
              <span>Yield Analytics</span>
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Harvest Batch</span>
          </button>
        </div>
      </div>

      {/* Production KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50/50 to-white border-2 border-rose-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
            Total Buckets Harvested
          </p>
          <p className="text-3xl font-black text-rose-950 mt-1">{formatNumber(totalBuckets)}</p>
          <p className="text-xs font-semibold text-rose-800/80 mt-1">
            Initial harvest measurement unit
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
            Estimated Stems
          </p>
          <p className="text-3xl font-black text-emerald-950 mt-1">{formatNumber(totalStems)}</p>
          <p className="text-xs font-semibold text-emerald-800/80 mt-1">
            Calculated via measured stems/bucket
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50/50 to-white border-2 border-blue-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
            Active Batches
          </p>
          <p className="text-3xl font-black text-blue-950 mt-1">{displayedBatches.length}</p>
          <p className="text-xs font-semibold text-blue-800/80 mt-1">
            Across {polyhouses.length} active polyhouses
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-2 border-amber-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
            Dispatch 1 Ready
          </p>
          <p className="text-3xl font-black text-amber-950 mt-1">
            {displayedBatches.filter((b) => b.status === "available_for_dispatch").length} batches
          </p>
          <p className="text-xs font-semibold text-amber-800/80 mt-1">
            Awaiting transfer to Processing Farm
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search batch ref, variety, polyhouse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 w-60"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Polyhouse:</span>
            <select
              value={selectedPolyhouseFilter}
              onChange={(e) => setSelectedPolyhouseFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Polyhouses (PH1 - PH4)</option>
              {polyhouses.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Variety:</span>
            <select
              value={selectedVarietyFilter}
              onChange={(e) => setSelectedVarietyFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Flower Varieties</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.color})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-500">
          Showing {displayedBatches.length} batch records
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "batches" ? (
        <div className="space-y-4">
          {displayedBatches.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Flower2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Harvest Batches Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No harvest records match your current filter criteria. Click "+ Record Harvest Batch" to log your first harvest batch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-rose-300 transition-all p-5 space-y-4"
                >
                  {/* Top Bar: Batch Ref, Polyhouse, Date, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 font-bold">
                        <Flower2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-slate-900">
                            {batch.batchRef}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              (batch.status || "harvested") === "available_for_dispatch" || (batch.status || "harvested") === "harvested"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : (batch.status || "harvested") === "partially_dispatched"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {(batch.status || "harvested").replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Polyhouse: <strong className="text-slate-800 font-bold">{batch.polyhouseName}</strong> • Date:{" "}
                          <span className="text-slate-700">{formatDate(batch.harvestDate || (batch as any).date || "")}</span> at{" "}
                          <span className="text-slate-700">{batch.harvestTime || "06:30"}</span>
                          {batch.harvestedBy && ` • Supervisor: ${batch.harvestedBy}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(batch)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                        title="Edit Batch"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <Link
                        href={`/dispatch?batchRef=${batch.batchRef}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#3E7D57] hover:bg-[#438a5d] rounded-xl transition-all shadow-2xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch to Farm</span>
                      </Link>

                      <Link
                        href={`/reports?batchRef=${batch.batchRef}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-200"
                        title="Trace full batch lineage"
                      >
                        <span>Trace Batch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Multi-variety Breakdown Table for this Batch */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Harvested Varieties & Buckets in this Batch
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 bg-slate-100/60 font-semibold">
                            <th className="py-2 px-3">Flower Variety</th>
                            <th className="py-2 px-3 text-right">Buckets Harvested</th>
                            <th className="py-2 px-3 text-right">Measured Stems / Bucket</th>
                            <th className="py-2 px-3 text-right">Estimated Stems</th>
                            <th className="py-2 px-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {batch.lines.map((line) => (
                            <tr key={line.id} className="hover:bg-white/80">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor:
                                        VARIETY_COLORS[line.varietyName] || "#94A3B8",
                                    }}
                                  />
                                  <span className="font-bold text-slate-900">{line.varietyName}</span>
                                  {line.flowerColor && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      ({line.flowerColor})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                                {line.bucketsHarvested} buckets
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                                {line.stemsPerBucket || 50} stems/bkt
                              </td>
                              <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                                {formatNumber(line.totalStemsHarvested || line.bucketsHarvested * (line.stemsPerBucket || 50))} stems
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 italic">
                                {line.remarks || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
                            <td className="py-2.5 px-3">Batch Total</td>
                            <td className="py-2.5 px-3 text-right text-rose-800">
                              {batch.totalBuckets} buckets
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                              Average ~{Math.round(batch.totalEstimatedStems / (batch.totalBuckets || 1))} / bkt
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-800 font-black">
                              {formatNumber(batch.totalEstimatedStems)} stems
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                              {batch.remarks ? `Note: ${batch.remarks}` : ""}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ANALYTICS TAB */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buckets by Polyhouse Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Harvest Volume by Polyhouse</h3>
              <p className="text-xs text-slate-500">Total buckets harvested per greenhouse</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={polyhouseChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val} ${name === "buckets" ? "Buckets" : "Stems"}`,
                      name === "buckets" ? "Buckets Harvested" : "Stems",
                    ]}
                    contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", color: "#FFF", fontSize: "12px" }}
                  />
                  <Legend />
                  <Bar dataKey="buckets" name="Buckets Harvested" fill="#E11D48" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Buckets by Variety Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Harvest Yield by Flower Variety</h3>
              <p className="text-xs text-slate-500">Buckets per variety across all polyhouses</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={varietyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} Buckets`, "Buckets Harvested"]}
                    contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", color: "#FFF", fontSize: "12px" }}
                  />
                  <Bar dataKey="buckets" name="Buckets" fill="#3E7D57" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* RECORD / EDIT HARVEST BATCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-700 to-pink-800 text-white p-5 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Flower2 className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {editingBatchId ? "Edit Harvest Batch" : "Record New Harvest Batch"}
                  </h2>
                  <p className="text-xs text-rose-100">
                    Capture multi-variety buckets with separate quantities per variety
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitBatch} className="p-6 space-y-5">
              {/* Batch Metadata Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batch Reference ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={batchRef}
                    onChange={(e) => setBatchRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 bg-slate-50"
                    placeholder="HV-20261017-001"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Unique traceability batch ID</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harvest Date & Time *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      required
                      value={harvestDate}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      className="w-2/3 px-2 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                    />
                    <input
                      type="time"
                      value={harvestTime}
                      onChange={(e) => setHarvestTime(e.target.value)}
                      className="w-1/3 px-2 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Polyhouse ID *
                  </label>
                  <select
                    value={selectedPolyhouseId}
                    onChange={(e) => handlePolyhouseChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    {polyhouses.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.varieties?.map((v) => v.varietyName).join(", ") || "Active"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Varieties & Buckets Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Harvested Varieties & Bucket Quantities
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Enter separate bucket counts for each variety under this polyhouse and date
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addLineToForm}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variety</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50 max-h-60 overflow-y-auto">
                  {lines.map((line, idx) => (
                    <div
                      key={line.id}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs"
                    >
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Flower Variety
                        </label>
                        <select
                          value={line.varietyId}
                          onChange={(e) => updateLineField(line.id, "varietyId", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white"
                        >
                          {varieties.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.color})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Buckets
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={line.bucketsHarvested}
                          onChange={(e) => updateLineField(line.id, "bucketsHarvested", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-bold text-right rounded-lg border border-slate-200"
                        />
                      </div>

                      <div className="w-28">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Stems / Bucket
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={line.stemsPerBucket}
                          onChange={(e) => updateLineField(line.id, "stemsPerBucket", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-right rounded-lg border border-slate-200"
                        />
                      </div>

                      <div className="w-28 text-right">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Est. Stems
                        </label>
                        <span className="text-xs font-extrabold text-emerald-700 block py-1.5">
                          {formatNumber(Number(line.bucketsHarvested || 0) * Number(line.stemsPerBucket || 50))}
                        </span>
                      </div>

                      <div className="flex-1 min-w-[120px]">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Remarks
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Morning flush"
                          value={line.remarks}
                          onChange={(e) => updateLineField(line.id, "remarks", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                        />
                      </div>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineFromForm(line.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer self-end mb-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">
                  Total Harvested: {lines.reduce((s, l) => s + Number(l.bucketsHarvested || 0), 0)} Buckets
                </span>
                <span className="font-extrabold text-emerald-800">
                  Total Calculated: {formatNumber(lines.reduce((s, l) => s + Number(l.bucketsHarvested || 0) * Number(l.stemsPerBucket || 50), 0))} Stems
                </span>
              </div>

              {/* Supervisor & Batch Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harvested By (Supervisor / Staff)
                  </label>
                  <input
                    type="text"
                    value={harvestedBy}
                    onChange={(e) => setHarvestedBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                    placeholder="Suresh (Field Supervisor)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batch Operational Remarks
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                    placeholder="e.g. Cut before 8:00 AM, stems healthy"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBatchId ? "Save Batch Updates" : "Save Harvest Batch"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
