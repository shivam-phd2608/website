"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PackageCheck,
  Plus,
  Boxes,
  Layers,
  ArrowRight,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  AlertCircle,
  Truck,
  Sparkles,
  BarChart3,
  Calendar,
  ShieldCheck,
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
} from "recharts";
import { useFarm } from "@/lib/store";
import { PackingBatch } from "@/lib/types";
import { formatNumber, formatDate , todayISO } from "@/lib/formatters";

export default function PackingPage() {
  const searchParams = useSearchParams();
  const prefillGradingRef = searchParams.get("gradingRef");

  const {
    packingBatches,
    addPackingBatch,
    updatePackingBatch,
    voidPackingBatch,
    gradings,
    stemLengthCategories,
    bunchSizes,
    farms,
    varieties,
    currentUser,
    selectedFarmFilter,
    setSelectedFarmFilter,
    matchesPeriod,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<"inventory" | "analytics">("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVarietyFilter, setSelectedVarietyFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackingId, setEditingPackingId] = useState<string | null>(null);

  // Form Fields
  const [packingRef, setPackingRef] = useState("");
  const [processingFarmId, setProcessingFarmId] = useState("farm-02");
  const [gradingRef, setGradingRef] = useState("");
  const [harvestBatchRef, setHarvestBatchRef] = useState("");
  const [polyhouseName, setPolyhouseName] = useState("PH-1");
  const [varietyId, setVarietyId] = useState(varieties[0]?.id || "var-01");
  const [varietyName, setVarietyName] = useState(varieties[0]?.name || "Rose");
  const [flowerColor, setFlowerColor] = useState("Peach");
  const [stemLengthCategoryId, setStemLengthCategoryId] = useState(stemLengthCategories[1]?.id || "sl-02");
  const [stemsPerBunch, setStemsPerBunch] = useState<number>(10);
  const [bunchesCount, setBunchesCount] = useState<number>(0);
  const [cartonsCount, setCartonsCount] = useState<number>(0);
  const [packingDate, setPackingDate] = useState(todayISO());
  const [packedBy, setPackedBy] = useState(currentUser?.fullName || "");
  const [remarks, setRemarks] = useState("");
  const [authorizedOverride, setAuthorizedOverride] = useState(false);

  // Pre-fill from gradingRef if present or action=new
  useEffect(() => {
    if (prefillGradingRef || searchParams.get("action") === "new") {
      openAddModal(prefillGradingRef || undefined);
    }
  }, [prefillGradingRef, searchParams]);

  // Open Add Modal
  const openAddModal = (specificGradingRef?: string) => {
    setEditingPackingId(null);
    const dateStr = new Date().toISOString().split("T")[0];
    const seq = String(packingBatches.length + 1).padStart(3, "0");
    setPackingRef(`PCK-${dateStr.replace(/-/g, "")}-${seq}`);
    setPackingDate(dateStr);
    setPackedBy(currentUser?.fullName ? `${currentUser.fullName} (Packing)` : "");
    setRemarks("");
    setAuthorizedOverride(false);

    const targetGrading = specificGradingRef
      ? gradings.find((g) => g.gradingRef === specificGradingRef)
      : gradings.find((g) => !g.isVoid) || gradings[0];

    if (targetGrading) {
      setGradingRef(targetGrading.gradingRef);
      setProcessingFarmId(targetGrading.processingFarmId);
      setHarvestBatchRef(targetGrading.harvestBatchRef);
      setPolyhouseName(targetGrading.polyhouseName || "PH-1");
      setVarietyId(targetGrading.varietyId);
      setVarietyName(targetGrading.varietyName);
      setFlowerColor(targetGrading.flowerColor || "Standard");

      const firstCat = targetGrading.lines[0]?.stemLengthCategoryId || stemLengthCategories[1]?.id || "sl-02";
      setStemLengthCategoryId(firstCat);
      setStemsPerBunch(bunchSizes[0]?.stemsPerBunch || 10);
      setBunchesCount(0);
      setCartonsCount(0);
    } else {
      setGradingRef("GRD-20261017-001");
      setHarvestBatchRef("HV-20261017-001");
      setPolyhouseName("PH-1");
      setStemsPerBunch(10);
      setBunchesCount(30);
      setCartonsCount(3);
    }

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (batch: PackingBatch) => {
    setEditingPackingId(batch.id);
    setPackingRef(batch.packingRef);
    setProcessingFarmId(batch.processingFarmId || "");
    setGradingRef(batch.gradingRef || "");
    setHarvestBatchRef(batch.harvestBatchRef || "");
    setPolyhouseName(batch.polyhouseName || "PH-1");
    setVarietyId(batch.varietyId);
    setVarietyName(batch.varietyName);
    setFlowerColor(batch.flowerColor || "");
    setStemLengthCategoryId(batch.stemLengthCategoryId || batch.stemCategoryId || "");
    setStemsPerBunch(batch.stemsPerBunch);
    setBunchesCount(batch.bunchesCount);
    setCartonsCount(batch.cartonsCount || 1);
    setPackingDate(batch.packingDate || batch.date || todayISO());
    setPackedBy(batch.packedBy || "");
    setRemarks(batch.remarks || "");
    setAuthorizedOverride(false);

    setIsModalOpen(true);
  };

  const handleGradingChange = (gRef: string) => {
    setGradingRef(gRef);
    const g = gradings.find((item) => item.gradingRef === gRef);
    if (g) {
      setProcessingFarmId(g.processingFarmId);
      setHarvestBatchRef(g.harvestBatchRef);
      setPolyhouseName(g.polyhouseName || "PH-1");
      setVarietyId(g.varietyId);
      setVarietyName(g.varietyName);
      setFlowerColor(g.flowerColor || "");
      if (g.lines[0]) {
        setStemLengthCategoryId(g.lines[0].stemLengthCategoryId);
      }
    }
  };

  const calculatedTotalStems = bunchesCount * stemsPerBunch;

  // Check available graded stems in selected grading record & stem length
  const matchedGrading = gradings.find((g) => g.gradingRef === gradingRef);
  const matchedGradingLine = matchedGrading?.lines.find((l) => l.stemLengthCategoryId === stemLengthCategoryId);
  const availableGradedStems = matchedGradingLine?.stemsCount || 1000;
  const isExceedingGraded = calculatedTotalStems > availableGradedStems;

  const handleSubmitPacking = (e: React.FormEvent) => {
    e.preventDefault();
    if (bunchesCount <= 0 || stemsPerBunch <= 0) {
      alert("Please enter valid bunches and stems per bunch");
      return;
    }

    if (isExceedingGraded && !authorizedOverride) {
      alert(`Validation Warning: Total packed stems (${calculatedTotalStems}) exceeds available graded stems (${availableGradedStems}). Please adjust bunch count or check the authorized override checkbox.`);
      return;
    }

    const farmObj = farms.find((f) => f.id === processingFarmId);
    const catObj = stemLengthCategories.find((c) => c.id === stemLengthCategoryId);

    if (editingPackingId) {
      updatePackingBatch(editingPackingId, {
        packingRef,
        processingFarmId,
        processingFarmName: farmObj?.name || "Nitin Farm",
        gradingRef,
        harvestBatchRef,
        polyhouseName,
        varietyId,
        varietyName,
        flowerColor,
        stemLengthCategoryId,
        stemLengthCategoryName: catObj?.name || "Standard Length",
        stemsPerBunch,
        bunchesCount,
        totalStemsPacked: calculatedTotalStems,
        cartonsCount: Number(cartonsCount) || 1,
        availableBunches: bunchesCount,
        packingDate,
        packedBy,
        remarks: remarks.trim() || undefined,
      });
    } else {
      addPackingBatch({
        packingRef: packingRef.trim() || `PCK-${Date.now()}`,
        processingFarmId,
        processingFarmName: farmObj?.name || "Nitin Farm",
        gradingRef,
        harvestBatchRef,
        polyhouseName,
        varietyId,
        varietyName,
        flowerColor,
        stemLengthCategoryId,
        stemLengthCategoryName: catObj?.name || "Standard Length",
        stemsPerBunch,
        bunchesCount,
        totalStemsPacked: calculatedTotalStems,
        cartonsCount: Number(cartonsCount) || 1,
        bunchesDispatched: 0,
        bunchesAvailable: bunchesCount,
        availableBunches: bunchesCount,
        date: packingDate,
        packingDate,
        packedBy,
        remarks: remarks.trim() || undefined,
        status: "packed",
      });
    }

    setIsModalOpen(false);
  };

  // Filtered records based on timeline, farm, variety, and search
  const displayedBatches = useMemo(() => {
    return packingBatches.filter((b) => {
      if (b.isVoid) return false;
      if (!matchesPeriod(b.date)) return false;
      if (selectedFarmFilter !== "all" && b.processingFarmId !== selectedFarmFilter) return false;
      if (selectedVarietyFilter !== "all" && b.varietyId !== selectedVarietyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = b.packingRef.toLowerCase().includes(q);
        const matchesHarvest = (b.harvestBatchRef || "").toLowerCase().includes(q);
        const matchesVariety = b.varietyName.toLowerCase().includes(q);
        if (!matchesRef && !matchesHarvest && !matchesVariety) return false;
      }
      return true;
    });
  }, [packingBatches, selectedFarmFilter, selectedVarietyFilter, searchQuery, matchesPeriod]);

  // Aggregate stats
  const totalBunchesSum = useMemo(
    () => displayedBatches.reduce((sum, b) => sum + b.bunchesCount, 0),
    [displayedBatches]
  );
  const totalPackedStemsSum = useMemo(
    () => displayedBatches.reduce((sum, b) => sum + b.totalStemsPacked, 0),
    [displayedBatches]
  );
  const availableBunchesSum = useMemo(
    () => displayedBatches.reduce((sum, b) => sum + (b.availableBunches ?? b.bunchesAvailable ?? 0), 0),
    [displayedBatches]
  );
  const totalCartonsSum = useMemo(
    () => displayedBatches.reduce((sum, b) => sum + (b.cartonsCount || 0), 0),
    [displayedBatches]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              Stage 4 • Bunch Formation & Packaging
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Configurable Bunch Sizes (10s / 20s stems) & Packed Stock
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Packing Management & Stock Preparation
          </h1>
          <p className="text-xs text-slate-500">
            Form saleable bunches from graded stems, pack cartons, and maintain live inventory ready for Auction Dispatch 2.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Packed Inventory ({displayedBatches.length})
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bunch Analytics</span>
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Pack New Bunches</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
            Total Bunches Formed
          </p>
          <p className="text-3xl font-black text-emerald-950 mt-1">{formatNumber(totalBunchesSum)}</p>
          <p className="text-xs font-semibold text-emerald-800/80 mt-1">
            Across 10 & 20 stems/bunch
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50/50 to-white border-2 border-blue-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
            Total Stems Packed
          </p>
          <p className="text-3xl font-black text-blue-950 mt-1">{formatNumber(totalPackedStemsSum)}</p>
          <p className="text-xs font-semibold text-blue-800/80 mt-1">
            Bunches × Stems/Bunch calculated
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-2 border-amber-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
            Available for Auction (Dispatch 2)
          </p>
          <p className="text-3xl font-black text-amber-950 mt-1">{formatNumber(availableBunchesSum)} bunches</p>
          <p className="text-xs font-semibold text-amber-800/80 mt-1">
            Unallocated packed stock in cold hub
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white border-2 border-indigo-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">
            Total Cartons Prepared
          </p>
          <p className="text-3xl font-black text-indigo-950 mt-1">{formatNumber(totalCartonsSum)}</p>
          <p className="text-xs font-semibold text-indigo-800/80 mt-1">
            Ready for refrigerated transit
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
              placeholder="Search packing ref, harvest ref, variety..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Variety:</span>
            <select
              value={selectedVarietyFilter}
              onChange={(e) => setSelectedVarietyFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Varieties</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-500">
          Showing {displayedBatches.length} packing batches
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "inventory" ? (
        <div className="space-y-4">
          {displayedBatches.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Packing Batches Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No packed flowers matching criteria. Click "+ Pack New Bunches" to bundle graded stems into standard bunches.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all p-5 space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                        <PackageCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-slate-900">
                            {batch.packingRef}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              (batch.availableBunches ?? batch.bunchesAvailable ?? 0) > 0
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {(batch.availableBunches ?? batch.bunchesAvailable ?? 0) > 0
                              ? `${batch.availableBunches ?? batch.bunchesAvailable ?? 0} Bunches Available`
                              : "Fully Dispatched"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Location: <strong className="text-slate-800 font-bold">{batch.processingFarmName}</strong> • Packed on{" "}
                          <span className="text-slate-700">{formatDate(batch.packingDate || batch.date || "")}</span>
                          {batch.packedBy && ` by ${batch.packedBy}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(batch)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {(batch.availableBunches ?? batch.bunchesAvailable ?? 0) > 0 && (
                        <Link
                          href={`/dispatch-auction?packingRef=${batch.packingRef}`}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch to Auction</span>
                        </Link>
                      )}

                      <Link
                        href={`/reports?batchRef=${batch.packingRef}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200"
                      >
                        <span>Trace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Batch Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Flower Variety</span>
                      <span className="font-bold text-slate-900">{batch.varietyName} {batch.flowerColor && `(${batch.flowerColor})`}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Stem Length</span>
                      <span className="font-bold text-purple-700">{batch.stemLengthCategoryName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Bunch Spec</span>
                      <span className="font-bold text-slate-800">{batch.stemsPerBunch} stems / bunch</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Origin Trace</span>
                      <span className="font-mono font-bold text-rose-700">{batch.harvestBatchRef}</span>
                    </div>
                  </div>

                  {/* Quantity Breakdown Bar */}
                  <div className="flex flex-wrap items-center justify-between p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-emerald-800 text-[11px] font-bold uppercase">Prepared Bunches:</span>
                        <span className="ml-1.5 font-black text-emerald-950 text-sm">{batch.bunchesCount} bunches</span>
                      </div>
                      <span className="text-emerald-300">×</span>
                      <div>
                        <span className="text-emerald-800 text-[11px] font-bold uppercase">Stems/Bunch:</span>
                        <span className="ml-1.5 font-bold text-emerald-950">{batch.stemsPerBunch}</span>
                      </div>
                      <span className="text-emerald-300">=</span>
                      <div>
                        <span className="text-emerald-800 text-[11px] font-bold uppercase">Total Stems:</span>
                        <span className="ml-1.5 font-black text-emerald-900 text-sm">{formatNumber(batch.totalStemsPacked)} stems</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold text-xs shadow-2xs">
                        📦 {batch.cartonsCount || 1} Master Cartons
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-xs">
                        {batch.availableBunches ?? batch.bunchesAvailable ?? 0} Bunches Available
                      </span>
                    </div>
                  </div>

                  {batch.remarks && (
                    <p className="text-xs text-slate-500 italic">
                      Remarks: {batch.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ANALYTICS TAB */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bunches Formed by Variety</h3>
              <p className="text-xs text-slate-500">Total bunches prepared per flower variety</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={varieties.map((v) => ({
                    name: v.name,
                    bunches: packingBatches
                      .filter((b) => b.varietyId === v.id && !b.isVoid)
                      .reduce((s, b) => s + b.bunchesCount, 0),
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", color: "#FFF", fontSize: "12px" }}
                  />
                  <Bar dataKey="bunches" name="Bunches" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bunch Size Specifications</h3>
              <p className="text-xs text-slate-500">Distribution across 10 and 20 stem packs</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              {bunchSizes.map((bs) => {
                const count = packingBatches
                  .filter((b) => b.stemsPerBunch === bs.stemsPerBunch && !b.isVoid)
                  .reduce((s, b) => s + b.bunchesCount, 0);
                return (
                  <div key={bs.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800">{bs.name} ({bs.stemsPerBunch} stems/bch)</span>
                    <span className="font-black text-emerald-800">{formatNumber(count)} bunches prepared</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PACK BUNCHES MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-5 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <PackageCheck className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {editingPackingId ? "Edit Packing Batch" : "Bunch Formation & Packing"}
                  </h2>
                  <p className="text-xs text-emerald-100">
                    Bundle graded stems into standard bunches for auction dispatch
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

            <form onSubmit={handleSubmitPacking} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Packing Ref *
                  </label>
                  <input
                    type="text"
                    required
                    value={packingRef}
                    onChange={(e) => setPackingRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Source Grading Ref *
                  </label>
                  <select
                    value={gradingRef}
                    onChange={(e) => handleGradingChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    {gradings.map((g) => (
                      <option key={g.id} value={g.gradingRef}>
                        {g.gradingRef} ({g.varietyName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stem-Length Category *
                  </label>
                  <select
                    value={stemLengthCategoryId}
                    onChange={(e) => setStemLengthCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    {stemLengthCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.minLengthCm}-{c.maxLengthCm}cm)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source Lineage Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Harvest Batch Ref</span>
                  <span className="font-mono font-bold text-slate-900">{harvestBatchRef}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Flower Variety</span>
                  <span className="font-bold text-slate-900">{varietyName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Available Graded Stems</span>
                  <span className="font-extrabold text-purple-700">{formatNumber(availableGradedStems)} stems</span>
                </div>
              </div>

              {/* Bunch Formation Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Stems per Bunch *
                  </label>
                  <select
                    value={stemsPerBunch}
                    onChange={(e) => setStemsPerBunch(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-white"
                  >
                    {bunchSizes.map((bs) => (
                      <option key={bs.id} value={bs.stemsPerBunch}>
                        {bs.name} ({bs.stemsPerBunch} stems)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Number of Bunches *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bunchesCount}
                    onChange={(e) => setBunchesCount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-black text-right rounded-xl border border-emerald-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Total Calculated Stems
                  </label>
                  <div className="px-3 py-2 text-sm font-black text-emerald-900 rounded-xl bg-emerald-100 border border-emerald-300 text-right">
                    {formatNumber(calculatedTotalStems)} stems
                  </div>
                </div>
              </div>

              {/* Validation Alert if exceeding graded stems */}
              {isExceedingGraded && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Warning: Packed stems ({calculatedTotalStems}) exceeds graded stock ({availableGradedStems})</span>
                  </div>
                  <label className="flex items-center gap-2 mt-2 text-amber-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authorizedOverride}
                      onChange={(e) => setAuthorizedOverride(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>Authorized Manager Override (Allow packing with variance note)</span>
                  </label>
                </div>
              )}

              {/* Cartons, Supervisor, Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cartons / Boxes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cartonsCount}
                    onChange={(e) => setCartonsCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Packed By (Staff)
                  </label>
                  <input
                    type="text"
                    value={packedBy}
                    onChange={(e) => setPackedBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Packing Date
                  </label>
                  <input
                    type="date"
                    value={packingDate}
                    onChange={(e) => setPackingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Packing Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  placeholder="e.g. Sleeved with kraft paper, cold stored at 4°C"
                />
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
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPackingId ? "Save Packing Updates" : "Save Packed Stock"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
