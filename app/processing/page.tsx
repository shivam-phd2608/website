"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Split,
  Plus,
  Flower2,
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  ArrowRight,
  Info,
  Check,
  X,
  AlertCircle,
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
import { ProcessingGrading, GradingStemCategoryLine } from "@/lib/types";
import { formatNumber, formatDate , todayISO } from "@/lib/formatters";

const STEM_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"];

export default function ProcessingGradingPage() {
  const searchParams = useSearchParams();
  const prefillDispatch1Ref = searchParams.get("dispatch1Ref");

  const {
    gradings,
    addGrading,
    updateGrading,
    voidGrading,
    dispatch1Records,
    stemLengthCategories,
    farms,
    varieties,
    currentUser,
    selectedFarmFilter,
    setSelectedFarmFilter,
    matchesPeriod,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<"records" | "analytics">("records");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGradingId, setEditingGradingId] = useState<string | null>(null);

  // Form Fields
  const [gradingRef, setGradingRef] = useState("");
  const [processingFarmId, setProcessingFarmId] = useState("farm-02");
  const [dispatch1Ref, setDispatch1Ref] = useState("");
  const [harvestBatchRef, setHarvestBatchRef] = useState("");
  const [polyhouseName, setPolyhouseName] = useState("PH-1");
  const [varietyId, setVarietyId] = useState(varieties[0]?.id || "var-01");
  const [varietyName, setVarietyName] = useState(varieties[0]?.name || "Rose");
  const [flowerColor, setFlowerColor] = useState("");
  const [totalIncomingStems, setTotalIncomingStems] = useState<number>(0);
  const [rejectedStems, setRejectedStems] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState("Bent stem & minor thrips damage");
  const [gradedDate, setGradedDate] = useState(todayISO());
  const [gradedBy, setGradedBy] = useState(currentUser?.fullName || "");
  const [remarks, setRemarks] = useState("");

  // Stem category counts map: { categoryId: count }
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Auto pre-fill if dispatch1Ref is in url or action=new
  useEffect(() => {
    if (prefillDispatch1Ref || searchParams.get("action") === "new") {
      openAddModal(prefillDispatch1Ref || undefined);
    }
  }, [prefillDispatch1Ref, searchParams]);

  // Available completed or confirmed Dispatch 1 records
  const eligibleDispatches = useMemo(() => {
    return dispatch1Records.filter((d) => !d.isVoid);
  }, [dispatch1Records]);

  // Open Add Modal
  const openAddModal = (specificDispatchRef?: string) => {
    setEditingGradingId(null);
    const dateStr = new Date().toISOString().split("T")[0];
    const seq = String(gradings.length + 1).padStart(3, "0");
    setGradingRef(`GRD-${dateStr.replace(/-/g, "")}-${seq}`);
    setGradedDate(dateStr);
    setGradedBy(currentUser?.fullName ? `${currentUser.fullName} (Grading)` : "");
    setRemarks("");

    const targetDispatch = specificDispatchRef
      ? dispatch1Records.find((d) => d.dispatchRef === specificDispatchRef)
      : eligibleDispatches[0];

    if (targetDispatch) {
      const firstLine = targetDispatch.lines[0];
      setProcessingFarmId(targetDispatch.destinationFarmId || "farm-02");
      setDispatch1Ref(targetDispatch.dispatchRef);
      setHarvestBatchRef(firstLine?.harvestBatchRef || "HV-20261017-001");
      setPolyhouseName(firstLine?.polyhouseName || "PH-1");
      setVarietyId(firstLine?.varietyId || varieties[0]?.id || "var-01");
      setVarietyName(firstLine?.varietyName || varieties[0]?.name || "Rose");
      setFlowerColor(firstLine?.flowerColor || "");
      const incoming = firstLine?.stemsReceived || firstLine?.stemsDispatched || 1000;
      setTotalIncomingStems(incoming);
      setRejectedStems(Math.round(incoming * 0.03));
      setRejectionReason("Bent stem & minor thrips");

      // Distribute stems across stemLengthCategories
      const initialMap: Record<string, number> = {};
      const goodStems = incoming - Math.round(incoming * 0.03);
      if (stemLengthCategories.length >= 3) {
        initialMap[stemLengthCategories[0]?.id || "sl-01"] = Math.round(goodStems * 0.25);
        initialMap[stemLengthCategories[1]?.id || "sl-02"] = Math.round(goodStems * 0.50);
        initialMap[stemLengthCategories[2]?.id || "sl-03"] = goodStems - Math.round(goodStems * 0.25) - Math.round(goodStems * 0.50);
      } else {
        stemLengthCategories.forEach((cat) => {
          initialMap[cat.id] = Math.round(goodStems / stemLengthCategories.length);
        });
      }
      setCategoryCounts(initialMap);
    } else {
      setProcessingFarmId(farms[1]?.id || "farm-02");
      setDispatch1Ref("DSP1-20261017-001");
      setHarvestBatchRef("HV-20261017-001");
      setPolyhouseName("PH-1");
      setTotalIncomingStems(0);
      setRejectedStems(0);
      const initialMap: Record<string, number> = {};
      stemLengthCategories.forEach((cat) => {
        initialMap[cat.id] = 200;
      });
      setCategoryCounts(initialMap);
    }

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (grading: ProcessingGrading) => {
    setEditingGradingId(grading.id);
    setGradingRef(grading.gradingRef);
    setProcessingFarmId(grading.processingFarmId);
    setDispatch1Ref(grading.dispatch1Ref);
    setHarvestBatchRef(grading.harvestBatchRef);
    setPolyhouseName(grading.polyhouseName || "PH-1");
    setVarietyId(grading.varietyId);
    setVarietyName(grading.varietyName);
    setFlowerColor(grading.flowerColor || grading.varietyColor || "");
    setTotalIncomingStems(grading.totalIncomingStems ?? grading.incomingStemsReceived ?? 1000);
    setRejectedStems(grading.rejectedStems ?? grading.rejectedDamagedStems ?? 0);
    setRejectionReason(grading.rejectionReason || "");
    setGradedDate(grading.gradedDate || grading.date || new Date().toISOString().split("T")[0]);
    setGradedBy(grading.gradedBy || "");
    setRemarks(grading.remarks || "");

    const map: Record<string, number> = {};
    (grading.lines || []).forEach((l) => {
      map[l.stemLengthCategoryId] = l.stemsCount ?? l.stemsGraded ?? 0;
    });
    setCategoryCounts(map);

    setIsModalOpen(true);
  };

  // On Dispatch 1 change in form
  const handleDispatchChange = (dRef: string) => {
    setDispatch1Ref(dRef);
    const d = dispatch1Records.find((item) => item.dispatchRef === dRef);
    if (d) {
      setProcessingFarmId(d.destinationFarmId || d.destFarmId || "");
      const line = d.lines[0];
      if (line) {
        setHarvestBatchRef(line.harvestBatchRef);
        setPolyhouseName(line.polyhouseName);
        setVarietyId(line.varietyId);
        setVarietyName(line.varietyName);
        setFlowerColor(line.flowerColor || line.varietyColor || "");
        const inc = line.stemsReceived || line.stemsDispatched || 1000;
        setTotalIncomingStems(inc);
      }
    }
  };

  // Current graded count from modal inputs
  const currentTotalGraded = useMemo(() => {
    return Object.values(categoryCounts).reduce((sum, count) => sum + (count || 0), 0);
  }, [categoryCounts]);

  const unexplainedVariance = totalIncomingStems - (currentTotalGraded + (rejectedStems || 0));

  // Submit Grading Record
  const handleSubmitGrading = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTotalGraded <= 0) {
      alert("Please enter stem counts for at least one stem length category");
      return;
    }

    const farmObj = farms.find((f) => f.id === processingFarmId);
    const targetDispatch = dispatch1Records.find((d) => d.dispatchRef === dispatch1Ref);
    const targetLine = targetDispatch?.lines[0];

    const gradedLines: GradingStemCategoryLine[] = stemLengthCategories
      .map((cat) => ({
        id: `grd-line-${Date.now()}-${cat.id}`,
        stemLengthCategoryId: cat.id,
        stemLengthCategoryName: `${cat.name} (${cat.minLengthCm}-${cat.maxLengthCm}cm)`,
        stemsCount: categoryCounts[cat.id] || 0,
        stemsGraded: categoryCounts[cat.id] || 0,
        stemsPacked: 0,
        stemsAvailable: categoryCounts[cat.id] || 0,
      }))
      .filter((l) => (l.stemsCount || 0) > 0);

    if (editingGradingId) {
      updateGrading(editingGradingId, {
        gradingRef,
        processingFarmId,
        processingFarmName: farmObj?.name || "Nitin Farm",
        dispatch1Ref,
        harvestBatchRef,
        polyhouseName,
        varietyId,
        varietyName,
        varietyColor: flowerColor || undefined,
        flowerColor: flowerColor || undefined,
        totalIncomingStems,
        incomingStemsReceived: totalIncomingStems,
        lines: gradedLines,
        totalGradedStems: currentTotalGraded,
        rejectedStems: rejectedStems || 0,
        rejectedDamagedStems: rejectedStems || 0,
        rejectionReason: rejectionReason.trim() || undefined,
        unexplainedVariance,
        unexplainedDifference: unexplainedVariance,
        gradedDate,
        date: gradedDate,
        gradedBy,
        remarks: remarks.trim() || undefined,
        status: "graded",
      });
    } else {
      addGrading({
        gradingRef: gradingRef.trim() || `GRD-${Date.now()}`,
        processingFarmId,
        processingFarmName: farmObj?.name || "Nitin Farm",
        dispatch1Id: targetDispatch?.id || "dsp1-001",
        dispatch1Ref,
        dispatch1LineId: targetLine?.id || "d1l-001",
        harvestBatchId: targetLine?.harvestBatchId || "hv-001",
        harvestBatchRef,
        polyhouseId: targetLine?.polyhouseId || "ph-01",
        polyhouseName,
        varietyId,
        varietyName,
        varietyColor: flowerColor || undefined,
        flowerColor: flowerColor || undefined,
        totalIncomingStems,
        incomingStemsReceived: totalIncomingStems,
        lines: gradedLines,
        totalGradedStems: currentTotalGraded,
        rejectedStems: rejectedStems || 0,
        rejectedDamagedStems: rejectedStems || 0,
        rejectionReason: rejectionReason.trim() || undefined,
        unexplainedVariance,
        unexplainedDifference: unexplainedVariance,
        gradedDate,
        date: gradedDate,
        gradedBy,
        remarks: remarks.trim() || undefined,
        status: "graded",
      });
    }

    setIsModalOpen(false);
  };

  // Filtered records based on timeline, farm, and search
  const displayedGradings = useMemo(() => {
    return gradings.filter((g) => {
      if (g.isVoid) return false;
      if (!matchesPeriod(g.gradedDate || g.date)) return false;
      if (selectedFarmFilter !== "all" && g.processingFarmId !== selectedFarmFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = g.gradingRef?.toLowerCase().includes(q);
        const matchesBatch = g.harvestBatchRef?.toLowerCase().includes(q);
        const matchesDispatch = g.dispatch1Ref?.toLowerCase().includes(q);
        const matchesVariety = g.varietyName?.toLowerCase().includes(q);
        if (!matchesRef && !matchesBatch && !matchesDispatch && !matchesVariety) return false;
      }
      return true;
    });
  }, [gradings, selectedFarmFilter, searchQuery, matchesPeriod]);

  // Aggregate metrics
  const totalGradedStemsSum = useMemo(
    () => displayedGradings.reduce((sum, g) => sum + (g.totalGradedStems || 0), 0),
    [displayedGradings]
  );
  const totalRejectedStemsSum = useMemo(
    () => displayedGradings.reduce((sum, g) => sum + (g.rejectedStems ?? g.rejectedDamagedStems ?? 0), 0),
    [displayedGradings]
  );
  const totalIncomingStemsSum = useMemo(
    () => displayedGradings.reduce((sum, g) => sum + (g.totalIncomingStems ?? g.incomingStemsReceived ?? 0), 0),
    [displayedGradings]
  );
  const totalUnexplainedDiffSum = useMemo(
    () => displayedGradings.reduce((sum, g) => sum + Math.abs(g.unexplainedVariance ?? g.unexplainedDifference ?? 0), 0),
    [displayedGradings]
  );

  // Category breakdown for chart
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    displayedGradings.forEach((g) => {
      (g.lines || []).forEach((l) => {
        const catName = l.stemLengthCategoryName || "Unknown Category";
        map[catName] = (map[catName] || 0) + (l.stemsCount ?? l.stemsGraded ?? 0);
      });
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [displayedGradings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold uppercase tracking-wider">
              Stage 3 • Stem Segregation
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Processing Farm Grading (Short / Medium / Long / Extra Long)
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Grading & Stem-Length Segregation
          </h1>
          <p className="text-xs text-slate-500">
            Segregate incoming flowers by stem lengths, record quality rejections, and flag unexplained quantity differences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("records")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "records"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Grading Register ({displayedGradings.length})
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Stem Length Breakdown</span>
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Grade Incoming Consignment</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border-2 border-purple-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">
            Total Graded Stems
          </p>
          <p className="text-3xl font-black text-purple-950 mt-1">{formatNumber(totalGradedStemsSum)}</p>
          <p className="text-xs font-semibold text-purple-800/80 mt-1">
            Available for bunch packing
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
            Incoming Stems Accounted
          </p>
          <p className="text-3xl font-black text-emerald-950 mt-1">{formatNumber(totalIncomingStemsSum)}</p>
          <p className="text-xs font-semibold text-emerald-800/80 mt-1">
            From verified Dispatch 1 transfers
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50/50 to-white border-2 border-rose-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
            Rejected / Damaged Stems
          </p>
          <p className="text-3xl font-black text-rose-950 mt-1">{formatNumber(totalRejectedStemsSum)}</p>
          <p className="text-xs font-semibold text-rose-800/80 mt-1">
            {((totalRejectedStemsSum / (totalIncomingStemsSum || 1)) * 100).toFixed(1)}% quality cull rate
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-2 border-amber-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
            Unexplained Difference
          </p>
          <p className="text-3xl font-black text-amber-950 mt-1">
            {totalUnexplainedDiffSum === 0 ? "0 Stems" : `${formatNumber(totalUnexplainedDiffSum)} Stems`}
          </p>
          <p className="text-xs font-semibold text-emerald-700 mt-1">
            {totalUnexplainedDiffSum === 0 ? "✓ 100% Fully Balanced" : "⚠ Variance flagged for audit"}
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
              placeholder="Search grading ref, harvest ref, dispatch ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Processing Farm:</span>
            <select
              value={selectedFarmFilter}
              onChange={(e) => setSelectedFarmFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Processing Farms</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-500">
          Showing {displayedGradings.length} grading records
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "records" ? (
        <div className="space-y-4">
          {displayedGradings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Split className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Grading Records Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No stem segregation records found. Click "+ Grade Incoming Consignment" to segregate flowers into stem length categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayedGradings.map((grading) => {
                const effectiveStatus = grading.status || "graded";
                const effectiveUnexplained = grading.unexplainedVariance ?? grading.unexplainedDifference ?? 0;
                const hasUnexplained = Math.abs(effectiveUnexplained) > 0;
                const effectiveIncoming = grading.totalIncomingStems ?? grading.incomingStemsReceived ?? 0;
                const effectiveRejected = grading.rejectedStems ?? grading.rejectedDamagedStems ?? 0;
                const effectiveGradedDate = grading.gradedDate || grading.date || "";

                return (
                  <div
                    key={grading.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 transition-all p-5 space-y-4"
                  >
                    {/* Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
                          <Split className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-slate-900">
                              {grading.gradingRef}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                effectiveStatus === "graded"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : effectiveStatus === "partially_packed"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {effectiveStatus.replace(/_/g, " ")}
                            </span>
                            {hasUnexplained && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {Math.abs(effectiveUnexplained)} Stems Unexplained
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Processing Farm: <strong className="text-slate-800 font-bold">{grading.processingFarmName || "Processing Hub"}</strong> • Date:{" "}
                            <span className="text-slate-700">{formatDate(effectiveGradedDate)}</span>
                            {grading.gradedBy && ` • Grader: ${grading.gradedBy}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(grading)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <Link
                          href={`/packing?gradingRef=${grading.gradingRef}`}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Pack into Bunches</span>
                        </Link>

                        <Link
                          href={`/reports?batchRef=${grading.gradingRef}`}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200"
                        >
                          <span>Trace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Batch Lineage Tags */}
                    <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-500">
                        Origin Dispatch 1:{" "}
                        <Link href={`/dispatch?batchRef=${grading.dispatch1Ref}`} className="font-mono font-bold text-blue-700 hover:underline">
                          {grading.dispatch1Ref}
                        </Link>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">
                        Harvest Batch:{" "}
                        <Link href={`/harvest?batchRef=${grading.harvestBatchRef}`} className="font-mono font-bold text-rose-700 hover:underline">
                          {grading.harvestBatchRef} ({grading.polyhouseName || "PH"})
                        </Link>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-700 font-bold">
                        Variety: {grading.varietyName} {(grading.flowerColor || grading.varietyColor) && `(${grading.flowerColor || grading.varietyColor})`}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-700">
                        Incoming: <strong className="font-bold text-slate-900">{formatNumber(effectiveIncoming)} stems</strong>
                      </span>
                    </div>

                    {/* Stem-Length Distribution Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 bg-slate-100/60 font-semibold">
                            <th className="py-2 px-3">Stem-Length Category</th>
                            <th className="py-2 px-3 text-right">Number of Stems Graded</th>
                            <th className="py-2 px-3 text-right">% of Incoming</th>
                            <th className="py-2 px-3">Status for Packing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(grading.lines || []).map((line, idx) => {
                            const lineStems = line.stemsCount ?? line.stemsGraded ?? 0;
                            return (
                              <tr key={line.id} className="hover:bg-purple-50/20">
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: STEM_COLORS[idx % STEM_COLORS.length] }}
                                    />
                                    <span className="font-bold text-slate-900">{line.stemLengthCategoryName}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right font-extrabold text-purple-900">
                                  {formatNumber(lineStems)} stems
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                                  {((lineStems / (effectiveIncoming || 1)) * 100).toFixed(1)}%
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                                    Available in Stock
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
                            <td className="py-2.5 px-3">Total Saleable Graded</td>
                            <td className="py-2.5 px-3 text-right text-purple-900 font-black">
                              {formatNumber(grading.totalGradedStems || 0)} stems
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">
                              {(((grading.totalGradedStems || 0) / (effectiveIncoming || 1)) * 100).toFixed(1)}%
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              Rejects: <strong className="text-rose-700">{effectiveRejected} stems</strong>
                              {grading.rejectionReason && ` (${grading.rejectionReason})`}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ANALYTICS TAB */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stem Length Profile Across Farm</h3>
              <p className="text-xs text-slate-500">Distribution of stems across length categories</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} interval={0} angle={-10} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${formatNumber(Number(val))} stems`, "Graded Stems"]}
                    contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", color: "#FFF", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" name="Stems" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quality Grading Accounting</h3>
              <p className="text-xs text-slate-500">Reconciliation between incoming, graded, and rejected</p>
            </div>
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex justify-between items-center text-xs">
                <span className="font-bold text-purple-900">Total Graded Saleable Stems</span>
                <span className="font-black text-purple-950 text-sm">{formatNumber(totalGradedStemsSum)}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex justify-between items-center text-xs">
                <span className="font-bold text-rose-900">Total Culled & Damaged Stems</span>
                <span className="font-black text-rose-950 text-sm">{formatNumber(totalRejectedStemsSum)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Accounted Total</span>
                <span className="font-black text-slate-900 text-sm">{formatNumber(totalGradedStemsSum + totalRejectedStemsSum)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT GRADING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-5 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Split className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {editingGradingId ? "Edit Stem Grading Record" : "Stem-Length Segregation & Grading"}
                  </h2>
                  <p className="text-xs text-purple-100">
                    Split incoming consignment into configurable stem-length categories
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

            <form onSubmit={handleSubmitGrading} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grading Ref *
                  </label>
                  <input
                    type="text"
                    required
                    value={gradingRef}
                    onChange={(e) => setGradingRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Origin Dispatch 1 *
                  </label>
                  <select
                    value={dispatch1Ref}
                    onChange={(e) => handleDispatchChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    {dispatch1Records.map((d) => (
                      <option key={d.id} value={d.dispatchRef}>
                        {d.dispatchRef} ({d.destinationFarmName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Receiving / Processing Farm
                  </label>
                  <select
                    value={processingFarmId}
                    onChange={(e) => setProcessingFarmId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linked Harvest Info */}
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
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Incoming Stems</span>
                  <span className="font-extrabold text-blue-700">{formatNumber(totalIncomingStems)} stems</span>
                </div>
              </div>

              {/* Stem Length Segregation Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Graded Stems per Stem-Length Category
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Graded Total: <strong className="text-purple-700">{formatNumber(currentTotalGraded)} stems</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50/40 rounded-2xl border border-purple-200">
                  {stemLengthCategories.map((cat) => (
                    <div key={cat.id} className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-800">{cat.name}</label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {cat.minLengthCm} - {cat.maxLengthCm} cm
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={categoryCounts[cat.id] || ""}
                        placeholder="0"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCategoryCounts((prev) => ({ ...prev, [cat.id]: val }));
                        }}
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejects and Unexplained Difference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                  <label className="text-xs font-bold text-rose-900 block mb-1">
                    Rejected / Damaged Stems
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={rejectedStems}
                    onChange={(e) => setRejectedStems(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Reason (bent stem, disease, etc.)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-rose-200 bg-white mt-1.5"
                  />
                </div>

                <div className={`p-3 rounded-xl border flex flex-col justify-center ${
                  unexplainedVariance === 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-300 text-amber-900"
                }`}>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    Unexplained Difference
                  </span>
                  <p className="text-xl font-black mt-1">
                    {unexplainedVariance === 0 ? "0 Stems Balanced" : `${Math.abs(unexplainedVariance)} Stems ${unexplainedVariance > 0 ? "Missing" : "Surplus"}`}
                  </p>
                  <span className="text-[10px] mt-0.5">
                    Incoming ({totalIncomingStems}) − [Graded ({currentTotalGraded}) + Rejects ({rejectedStems})]
                  </span>
                </div>
              </div>

              {/* Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Graded By</label>
                  <input
                    type="text"
                    value={gradedBy}
                    onChange={(e) => setGradedBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    placeholder="e.g. Stem thickness excellent, good bud size"
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
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingGradingId ? "Save Grading Updates" : "Save Grading Record"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
