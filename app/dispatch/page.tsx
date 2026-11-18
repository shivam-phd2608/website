"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Truck,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  MapPin,
  Package,
  Building2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Split,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  AlertTriangle,
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
import { Dispatch1, Dispatch1Line } from "@/lib/types";
import { formatNumber, formatDate , todayISO } from "@/lib/formatters";

export default function DispatchPage() {
  const searchParams = useSearchParams();
  const prefillBatchRef = searchParams.get("batchRef");

  const {
    dispatch1Records,
    addDispatch1,
    updateDispatch1,
    confirmDispatch1Receipt,
    voidDispatch1,
    farms,
    harvestBatches,
    polyhouses,
    varieties,
    currentUser,
    selectedFarmFilter,
    setSelectedFarmFilter,
    matchesPeriod,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<"register" | "analytics">("register");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Dispatch 1 Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDispatchId, setEditingDispatchId] = useState<string | null>(null);

  const [dispatchRef, setDispatchRef] = useState("");
  const [dispatchDate, setDispatchDate] = useState(todayISO());
  const [dispatchTime, setDispatchTime] = useState("09:00");
  const [sourceFarmId, setSourceFarmId] = useState("farm-01");
  const [destinationFarmId, setDestinationFarmId] = useState("farm-02");
  const [vehicleNumber, setVehicleNumber] = useState("KA-04-E-8822");
  const [driverName, setDriverName] = useState("");
  const [driverContact, setDriverContact] = useState("+91 98450 12345");
  const [transportCost, setTransportCost] = useState("");
  const [remarks, setRemarks] = useState("");

  // Dispatch lines
  const [lines, setLines] = useState<
    Array<{
      id: string;
      harvestBatchRef: string;
      polyhouseId: string;
      polyhouseName: string;
      varietyId: string;
      varietyName: string;
      flowerColor?: string;
      bucketsDispatched: number;
      stemsDispatched: number;
      remarks: string;
    }>
  >([]);

  // Receipt Confirmation Modal State
  const [confirmingDispatch, setConfirmingDispatch] = useState<Dispatch1 | null>(null);
  const [receiptLines, setReceiptLines] = useState<
    Array<{
      lineId: string;
      varietyName: string;
      bucketsDispatched: number;
      bucketsReceived: number;
      stemsDispatched: number;
      stemsReceived: number;
      discrepancyReason: string;
    }>
  >([]);
  const [receiverName, setReceiverName] = useState(currentUser?.fullName || "");
  const [receiptRemarks, setReceiptRemarks] = useState("");

  // Pre-fill modal if query param is passed or action=new
  useEffect(() => {
    if (prefillBatchRef || searchParams.get("action") === "new") {
      openCreateModal(prefillBatchRef || undefined);
    }
  }, [prefillBatchRef, searchParams]);

  // Open Create Modal
  const openCreateModal = (specificBatchRef?: string) => {
    setEditingDispatchId(null);
    const dateStr = new Date().toISOString().split("T")[0];
    const seq = String(dispatch1Records.length + 1).padStart(3, "0");
    setDispatchRef(`DSP1-${dateStr.replace(/-/g, "")}-${seq}`);
    setDispatchDate(dateStr);
    setDispatchTime("09:00");
    setSourceFarmId(farms[0]?.id || "farm-01");
    setDestinationFarmId(farms[1]?.id || "farm-02");
    setVehicleNumber("KA-04-E-8822");
    setDriverName("");
    setDriverContact("+91 98450 12345");
    setTransportCost("");
    setRemarks("");

    // Build default lines from eligible harvest batches
    const targetBatches = specificBatchRef
      ? harvestBatches.filter((b) => b.batchRef === specificBatchRef)
      : harvestBatches.filter((b) => b.status === "available_for_dispatch" || b.status === "partially_dispatched");

    const batchToUse = targetBatches[0] || harvestBatches[0];
    if (batchToUse) {
      setLines(
        batchToUse.lines.map((l, idx) => ({
          id: `dsp1-line-${Date.now()}-${idx}`,
          harvestBatchRef: batchToUse.batchRef,
          polyhouseId: batchToUse.polyhouseId,
          polyhouseName: batchToUse.polyhouseName,
          varietyId: l.varietyId,
          varietyName: l.varietyName,
          flowerColor: l.flowerColor,
          bucketsDispatched: l.bucketsHarvested,
          stemsDispatched: l.totalStemsHarvested || l.bucketsHarvested * (l.stemsPerBucket || 50),
          remarks: "",
        }))
      );
    } else {
      setLines([
        {
          id: `dsp1-line-${Date.now()}-0`,
          harvestBatchRef: "HV-20261017-001",
          polyhouseId: "ph-01",
          polyhouseName: "PH-1",
          varietyId: "var-01",
          varietyName: "Jumilia",
          flowerColor: "Bicolor Pink",
          bucketsDispatched: 10,
          stemsDispatched: 500,
          remarks: "",
        },
      ]);
    }

    setIsCreateModalOpen(true);
  };

  const addLine = () => {
    const unpickedBatch = harvestBatches[0];
    const unpickedLine = unpickedBatch?.lines[0];
    setLines((prev) => [
      ...prev,
      {
        id: `dsp1-line-${Date.now()}-${prev.length}`,
        harvestBatchRef: unpickedBatch?.batchRef || "HV-20261017-001",
        polyhouseId: unpickedBatch?.polyhouseId || "ph-01",
        polyhouseName: unpickedBatch?.polyhouseName || "PH-1",
        varietyId: unpickedLine?.varietyId || "var-01",
        varietyName: unpickedLine?.varietyName || "Flower",
        flowerColor: unpickedLine?.flowerColor,
        bucketsDispatched: 5,
        stemsDispatched: 250,
        remarks: "",
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLineField = (id: string, field: string, val: any) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (field === "harvestBatchRef") {
          const matchBatch = harvestBatches.find((b) => b.batchRef === val);
          const firstLine = matchBatch?.lines[0];
          return {
            ...l,
            harvestBatchRef: val,
            polyhouseId: matchBatch?.polyhouseId || l.polyhouseId,
            polyhouseName: matchBatch?.polyhouseName || l.polyhouseName,
            varietyId: firstLine?.varietyId || l.varietyId,
            varietyName: firstLine?.varietyName || l.varietyName,
            flowerColor: firstLine?.flowerColor,
            bucketsDispatched: firstLine?.bucketsHarvested || l.bucketsDispatched,
            stemsDispatched: firstLine?.totalStemsHarvested || l.stemsDispatched,
          };
        }
        if (field === "bucketsDispatched") {
          const num = Math.max(0, parseInt(val) || 0);
          return { ...l, bucketsDispatched: num, stemsDispatched: num * 50 };
        }
        return { ...l, [field]: val };
      })
    );
  };

  // Submit Create / Edit Dispatch 1
  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert("Please add at least one consignment line");
      return;
    }

    const src = farms.find((f) => f.id === sourceFarmId);
    const dest = farms.find((f) => f.id === destinationFarmId);

    const calculatedLines: Dispatch1Line[] = lines.map((l) => ({
      id: l.id,
      harvestBatchRef: l.harvestBatchRef,
      polyhouseId: l.polyhouseId,
      polyhouseName: l.polyhouseName,
      varietyId: l.varietyId,
      varietyName: l.varietyName,
      flowerColor: l.flowerColor,
      bucketsSent: Number(l.bucketsDispatched) || 0,
      bucketsDispatched: Number(l.bucketsDispatched) || 0,
      stemsSent: Number(l.stemsDispatched) || (Number(l.bucketsDispatched) || 0) * 50,
      stemsDispatched: Number(l.stemsDispatched) || (Number(l.bucketsDispatched) || 0) * 50,
      remarks: l.remarks.trim() || undefined,
    }));

    const totalBuckets = calculatedLines.reduce((s, l) => s + (l.bucketsDispatched ?? l.bucketsSent ?? 0), 0);
    const totalStems = calculatedLines.reduce((s, l) => s + (l.stemsDispatched ?? l.stemsSent ?? 0), 0);

    if (editingDispatchId) {
      updateDispatch1(editingDispatchId, {
        dispatchRef,
        dispatchDate,
        dispatchTime,
        sourceFarmId,
        sourceFarmName: src?.name || "TriBloom Farm",
        destinationFarmId,
        destinationFarmName: dest?.name || "Nitin Farm",
        vehicleNumber,
        driverName,
        driverContact,
        transportCost: parseFloat(transportCost) || 0,
        remarks: remarks.trim() || undefined,
        lines: calculatedLines,
        totalBucketsDispatched: totalBuckets,
        totalStemsDispatched: totalStems,
      });
    } else {
      addDispatch1({
        dispatchRef: dispatchRef.trim() || `DSP1-${Date.now()}`,
        date: dispatchDate,
        dispatchDate,
        time: dispatchTime,
        dispatchTime,
        sourceFarmId,
        sourceFarmName: src?.name || "TriBloom Farm",
        destinationFarmId,
        destFarmId: destinationFarmId,
        destinationFarmName: dest?.name || "Nitin Farm",
        lines: calculatedLines,
        totalBucketsSent: totalBuckets,
        totalBucketsDispatched: totalBuckets,
        totalStemsSent: totalStems,
        totalStemsDispatched: totalStems,
        vehicleNumber,
        driverName,
        driverContact,
        transportCost: parseFloat(transportCost) || 0,
        status: "in_transit",
        dispatchedBy: currentUser?.name || "Shiva Kumar (Farm Ops)",
        remarks: remarks.trim() || undefined,
      });
    }

    setIsCreateModalOpen(false);
  };

  // Open Receiving Confirmation Modal
  const openConfirmModal = (dispatch: Dispatch1) => {
    setConfirmingDispatch(dispatch);
    setReceiverName(currentUser?.fullName || "");
    setReceiptRemarks("");
    setReceiptLines(
      dispatch.lines.map((l) => ({
        lineId: l.id,
        varietyName: l.varietyName,
        bucketsDispatched: l.bucketsDispatched ?? l.bucketsSent ?? 0,
        bucketsReceived: l.bucketsReceived !== undefined ? l.bucketsReceived : (l.bucketsDispatched ?? l.bucketsSent ?? 0),
        stemsDispatched: l.stemsDispatched ?? l.stemsSent ?? ((l.bucketsDispatched ?? l.bucketsSent ?? 0) * 50),
        stemsReceived: l.stemsReceived !== undefined ? l.stemsReceived : (l.stemsDispatched ?? l.stemsSent ?? ((l.bucketsDispatched ?? l.bucketsSent ?? 0) * 50)),
        discrepancyReason: l.discrepancyReason || "",
      }))
    );
  };

  // Submit Receiving Confirmation
  const handleConfirmReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingDispatch) return;

    confirmDispatch1Receipt(
      confirmingDispatch.id,
      receiptLines.map((r) => ({
        lineId: r.lineId,
        bucketsReceived: Number(r.bucketsReceived) || 0,
        stemsReceived: Number(r.stemsReceived) || (Number(r.bucketsReceived) || 0) * 50,
        discrepancyReason: r.discrepancyReason.trim() || undefined,
      })),
      receiverName,
      receiptRemarks.trim() || undefined
    );

    setConfirmingDispatch(null);
  };

  // Filtered dispatches based on timeline filter, status, farm, and search
  const displayedDispatches = useMemo(() => {
    return dispatch1Records.filter((d) => {
      if (d.isVoid) return false;
      if (!matchesPeriod(d.dispatchDate || d.date)) return false;
      if (selectedStatus !== "all" && d.status !== selectedStatus) return false;
      if (selectedFarmFilter !== "all" && d.destinationFarmId !== selectedFarmFilter && d.sourceFarmId !== selectedFarmFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = d.dispatchRef.toLowerCase().includes(q);
        const matchesDest = (d.destinationFarmName || d.destFarmName || "").toLowerCase().includes(q);
        const matchesVehicle = (d.vehicleNumber || "").toLowerCase().includes(q);
        const matchesBatch = d.lines.some((l) => l.harvestBatchRef.toLowerCase().includes(q) || l.varietyName.toLowerCase().includes(q));
        if (!matchesRef && !matchesDest && !matchesVehicle && !matchesBatch) return false;
      }
      return true;
    });
  }, [dispatch1Records, selectedStatus, selectedFarmFilter, searchQuery, matchesPeriod]);

  // Aggregate stats
  const totalBucketsSent = useMemo(
    () => displayedDispatches.reduce((sum, d) => sum + (d.totalBucketsDispatched ?? d.totalBucketsSent ?? 0), 0),
    [displayedDispatches]
  );
  const totalStemsSent = useMemo(
    () => displayedDispatches.reduce((sum, d) => sum + (d.totalStemsDispatched ?? d.totalStemsSent ?? 0), 0),
    [displayedDispatches]
  );
  const totalBucketsConfirmed = useMemo(
    () => displayedDispatches.reduce((sum, d) => sum + (d.totalBucketsReceived ?? (d.status === "received" ? (d.totalBucketsDispatched ?? d.totalBucketsSent ?? 0) : 0)), 0),
    [displayedDispatches]
  );
  const discrepancyCount = useMemo(
    () => displayedDispatches.filter((d) => d.status === "discrepancy_flagged").length,
    [displayedDispatches]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider">
              Stage 2 • Farm Transfer
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Dispatch 1: TriBloom Farm → Processing Farm (e.g. Nitin Farm)
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Dispatch 1: Farm to Processing Farm
          </h1>
          <p className="text-xs text-slate-500">
            Track movement of harvested buckets, confirm arrival at the receiving farm, and record transit discrepancies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("register")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "register"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Dispatch Register ({displayedDispatches.length})
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Transit Insights</span>
            </button>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Dispatch 1</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50/50 to-white border-2 border-blue-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
            Total Buckets Dispatched
          </p>
          <p className="text-3xl font-black text-blue-950 mt-1">{formatNumber(totalBucketsSent)}</p>
          <p className="text-xs font-semibold text-blue-800/80 mt-1">
            ~{formatNumber(totalStemsSent)} estimated stems sent
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
            Received at Processing Farm
          </p>
          <p className="text-3xl font-black text-emerald-950 mt-1">{formatNumber(totalBucketsConfirmed)}</p>
          <p className="text-xs font-semibold text-emerald-800/80 mt-1">
            Confirmed by receiving supervisor
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-2 border-amber-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
            In Transit / Pending
          </p>
          <p className="text-3xl font-black text-amber-950 mt-1">
            {displayedDispatches.filter((d) => d.status === "in_transit").length} consignments
          </p>
          <p className="text-xs font-semibold text-amber-800/80 mt-1">
            Awaiting receipt verification
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50/50 to-white border-2 border-rose-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
            Discrepancies Flagged
          </p>
          <p className="text-3xl font-black text-rose-950 mt-1">{discrepancyCount}</p>
          <p className="text-xs font-semibold text-rose-800/80 mt-1">
            Transit damages / variance logged
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
              placeholder="Search dispatch ref, batch ref, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="in_transit">In Transit</option>
              <option value="received">Received & Verified</option>
              <option value="discrepancy_flagged">Discrepancy Flagged</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Farm:</span>
            <select
              value={selectedFarmFilter}
              onChange={(e) => setSelectedFarmFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Farms</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-500">
          Showing {displayedDispatches.length} dispatch entries
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "register" ? (
        <div className="space-y-4">
          {displayedDispatches.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Dispatch 1 Records Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No transfer consignments match your filter. Click "+ Create Dispatch 1" to dispatch flowers from production farm to a processing farm.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayedDispatches.map((dispatch) => (
                <div
                  key={dispatch.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all p-5 space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-slate-900">
                            {dispatch.dispatchRef}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                              (dispatch.status || "in_transit") === "in_transit"
                                ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                                : dispatch.status === "discrepancy_flagged"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : dispatch.status === "received"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {(dispatch.status || "in_transit").replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Route: <strong className="text-slate-800 font-bold">{dispatch.sourceFarmName}</strong> →{" "}
                          <strong className="text-blue-700 font-bold">{dispatch.destinationFarmName}</strong> • Date:{" "}
                          <span className="text-slate-700">{formatDate(dispatch.dispatchDate || (dispatch as any).date || "")}</span> at{" "}
                          <span className="text-slate-700">{dispatch.dispatchTime || "09:00"}</span>
                          {dispatch.vehicleNumber && ` • Vehicle: ${dispatch.vehicleNumber}`}
                          {dispatch.driverName && ` (${dispatch.driverName})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Receiving Confirmation Button */}
                      {dispatch.status === "in_transit" && (
                        <button
                          onClick={() => openConfirmModal(dispatch)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Farm Receipt</span>
                        </button>
                      )}

                      {/* Proceed to Stem Grading */}
                      <Link
                        href={`/processing?dispatch1Ref=${dispatch.dispatchRef}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all border border-purple-200"
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Stem Grading</span>
                      </Link>

                      <Link
                        href={`/reports?batchRef=${dispatch.dispatchRef}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-200"
                        title="Trace batch journey"
                      >
                        <span>Trace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Consignment Lines Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600 bg-slate-100/60 font-semibold">
                          <th className="py-2 px-3">Harvest Batch Ref</th>
                          <th className="py-2 px-3">Polyhouse & Variety</th>
                          <th className="py-2 px-3 text-right">Buckets Dispatched</th>
                          <th className="py-2 px-3 text-right">Buckets Received</th>
                          <th className="py-2 px-3 text-right">Variance / Discrepancy</th>
                          <th className="py-2 px-3">Status / Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dispatch.lines.map((line) => {
                          const hasDiscrepancy =
                            line.bucketsReceived !== undefined &&
                            line.bucketsReceived !== line.bucketsDispatched;

                          return (
                            <tr key={line.id} className="hover:bg-white/80">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                <Link
                                  href={`/harvest?batchRef=${line.harvestBatchRef}`}
                                  className="text-rose-700 hover:underline flex items-center gap-1"
                                >
                                  <span>{line.harvestBatchRef}</span>
                                </Link>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">
                                  {line.varietyName}
                                  {line.flowerColor && (
                                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                                      ({line.flowerColor})
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {line.polyhouseName}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                                {line.bucketsDispatched ?? line.bucketsSent ?? 0} buckets
                                <span className="block text-[10px] text-slate-400">
                                  ~{formatNumber(line.stemsDispatched ?? line.stemsSent ?? ((line.bucketsDispatched ?? line.bucketsSent ?? 0) * 50))} stems
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                                {line.bucketsReceived !== undefined
                                  ? `${line.bucketsReceived} buckets`
                                  : "Pending Receipt"}
                                {line.stemsReceived !== undefined && (
                                  <span className="block text-[10px] text-slate-400">
                                    ~{formatNumber(line.stemsReceived)} stems
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {hasDiscrepancy ? (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                                    -{((line.bucketsDispatched ?? line.bucketsSent ?? 0) - (line.bucketsReceived || 0))} buckets lost
                                  </span>
                                ) : line.bucketsReceived !== undefined ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    100% Reconciled
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {line.discrepancyReason ? (
                                  <span className="text-rose-700 font-medium italic text-[11px]">
                                    Reason: {line.discrepancyReason}
                                  </span>
                                ) : line.remarks ? (
                                  <span className="italic">{line.remarks}</span>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
                          <td className="py-2.5 px-3" colSpan={2}>
                            Consignment Total
                          </td>
                          <td className="py-2.5 px-3 text-right text-blue-800">
                            {dispatch.totalBucketsDispatched ?? dispatch.totalBucketsSent ?? 0} buckets ({formatNumber(dispatch.totalStemsDispatched ?? dispatch.totalStemsSent ?? 0)} stems)
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-800">
                            {dispatch.totalBucketsReceived !== undefined
                              ? `${dispatch.totalBucketsReceived} buckets`
                              : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right" colSpan={2}>
                            {dispatch.receivedBy && (
                              <span className="text-[10px] text-slate-500">
                                Verified by: {dispatch.receivedBy}
                              </span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
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
              <h3 className="text-sm font-bold text-slate-900">Transfer Volumes by Destination Farm</h3>
              <p className="text-xs text-slate-500">Buckets received at each processing farm</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={farms.map((f) => ({
                    name: f.name,
                    dispatched: dispatch1Records
                      .filter((d) => d.destinationFarmId === f.id && !d.isVoid)
                      .reduce((s, d) => s + (d.totalBucketsDispatched ?? d.totalBucketsSent ?? 0), 0),
                    received: dispatch1Records
                      .filter((d) => d.destinationFarmId === f.id && !d.isVoid)
                      .reduce((s, d) => s + (d.totalBucketsReceived || 0), 0),
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", color: "#FFF", fontSize: "12px" }}
                  />
                  <Legend />
                  <Bar dataKey="dispatched" name="Buckets Sent" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="received" name="Buckets Received" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transit Discrepancies & Quality Losses</h3>
              <p className="text-xs text-slate-500">Summary of variance flagged between Farm 1 and Receiving Farm</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
              <p className="text-2xl font-black text-slate-900">{discrepancyCount} Flagged Consignments</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Full discrepancy audit logs are maintained for insurance and partner ledger reconciliation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DISPATCH 1 MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {editingDispatchId ? "Edit Dispatch 1" : "Create Dispatch 1: Farm Transfer"}
                  </h2>
                  <p className="text-xs text-blue-100">
                    Dispatch harvested buckets from production farm to designated processing farm
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch} className="p-6 space-y-5">
              {/* Route & Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dispatch Ref *
                  </label>
                  <input
                    type="text"
                    required
                    value={dispatchRef}
                    onChange={(e) => setDispatchRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date & Time *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      required
                      value={dispatchDate}
                      onChange={(e) => setDispatchDate(e.target.value)}
                      className="w-2/3 px-2 py-2 text-xs rounded-xl border border-slate-300"
                    />
                    <input
                      type="time"
                      value={dispatchTime}
                      onChange={(e) => setDispatchTime(e.target.value)}
                      className="w-1/3 px-2 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Source Farm *
                  </label>
                  <select
                    value={sourceFarmId}
                    onChange={(e) => setSourceFarmId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Destination Farm *
                  </label>
                  <select
                    value={destinationFarmId}
                    onChange={(e) => setDestinationFarmId(e.target.value)}
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

              {/* Vehicle & Logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    placeholder="KA-04-E-8822"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Driver Name & Contact
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    placeholder="Manjunath Swamy (+91 98450 12345)"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Transport Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={transportCost}
                    onChange={(e) => setTransportCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    placeholder="1200"
                  />
                </div>
              </div>

              {/* Lines Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Consignment Lines (Harvest Batches & Varieties)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Select harvest batches, polyhouses, varieties and buckets dispatched
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Batch Line</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50 max-h-56 overflow-y-auto">
                  {lines.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs"
                    >
                      <div className="w-48">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Harvest Batch Ref
                        </label>
                        <select
                          value={l.harvestBatchRef}
                          onChange={(e) => updateLineField(l.id, "harvestBatchRef", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white"
                        >
                          {harvestBatches.map((b) => (
                            <option key={b.id} value={b.batchRef}>
                              {b.batchRef} ({b.polyhouseName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Variety
                        </label>
                        <select
                          value={l.varietyId}
                          onChange={(e) => updateLineField(l.id, "varietyId", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white"
                        >
                          {varieties.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Buckets
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={l.bucketsDispatched}
                          onChange={(e) => updateLineField(l.id, "bucketsDispatched", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-bold text-right rounded-lg border border-slate-200"
                        />
                      </div>

                      <div className="w-28 text-right">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Est. Stems
                        </label>
                        <span className="text-xs font-extrabold text-blue-700 block py-1.5">
                          {formatNumber(l.stemsDispatched || l.bucketsDispatched * 50)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-[100px]">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Remarks
                        </label>
                        <input
                          type="text"
                          placeholder="Batch note"
                          value={l.remarks}
                          onChange={(e) => updateLineField(l.id, "remarks", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                        />
                      </div>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(l.id)}
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
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900">
                  Total Dispatched: {lines.reduce((s, l) => s + Number(l.bucketsDispatched || 0), 0)} Buckets
                </span>
                <span className="font-extrabold text-blue-800">
                  Total Stems: {formatNumber(lines.reduce((s, l) => s + (l.stemsDispatched || l.bucketsDispatched * 50), 0))} Stems
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDispatchId ? "Save Updates" : "Create & Dispatch to Farm"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVING CONFIRMATION MODAL */}
      {confirmingDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-5 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    Confirm Farm Receipt: {confirmingDispatch.dispatchRef}
                  </h2>
                  <p className="text-xs text-emerald-100">
                    Verify physical buckets and stems received at {confirmingDispatch.destinationFarmName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmingDispatch(null)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceipt} className="p-6 space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                Origin: <strong className="text-slate-800">{confirmingDispatch.sourceFarmName}</strong> • Vehicle:{" "}
                <strong className="text-slate-800">{confirmingDispatch.vehicleNumber}</strong> • Dispatched:{" "}
                <span className="font-bold text-blue-700">{confirmingDispatch.totalBucketsDispatched} buckets</span>
              </div>

              {/* Receipt Verification Table */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Line-by-Line Receipt Count & Discrepancy
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {receiptLines.map((r, idx) => {
                    const variance = r.bucketsDispatched - r.bucketsReceived;
                    return (
                      <div
                        key={r.lineId}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{r.varietyName}</span>
                          <span className="text-slate-500">
                            Dispatched: <strong className="text-blue-700">{r.bucketsDispatched} buckets</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Buckets Actually Received *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={r.bucketsReceived}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setReceiptLines((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? { ...item, bucketsReceived: val, stemsReceived: val * 50 }
                                      : item
                                  )
                                );
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Estimated Stems Received
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={r.stemsReceived}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setReceiptLines((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, stemsReceived: val } : item
                                  )
                                );
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                            />
                          </div>
                        </div>

                        {variance !== 0 && (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                            <label className="text-[10px] font-bold text-rose-800 block mb-0.5">
                              Discrepancy: {variance > 0 ? `${variance} buckets short` : `${Math.abs(variance)} excess buckets`} — Reason *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Transit bucket spill, stems broken"
                              value={r.discrepancyReason}
                              onChange={(e) => {
                                const text = e.target.value;
                                setReceiptLines((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, discrepancyReason: text } : item
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 text-xs rounded border border-rose-300 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receiver Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmed By (Supervisor) *
                  </label>
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Receipt Notes / Remarks
                  </label>
                  <input
                    type="text"
                    value={receiptRemarks}
                    onChange={(e) => setReceiptRemarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    placeholder="Temperature good, unloaded directly to grading floor"
                  />
                </div>
              </div>

              {/* Submit Confirmation */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConfirmingDispatch(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Receipt & Update Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
