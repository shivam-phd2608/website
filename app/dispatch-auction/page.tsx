"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRightLeft,
  Plus,
  Truck,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Search,
  Filter,
  Check,
  X,
  BadgeIndianRupee,
  Layers,
  ArrowRight,
  Package,
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
import { Dispatch2, Dispatch2Line } from "@/lib/types";
import { formatNumber, formatDate , todayISO } from "@/lib/formatters";

export default function DispatchAuctionPage() {
  const searchParams = useSearchParams();
  const prefillPackingRef = searchParams.get("packingRef");

  const {
    dispatch2Records,
    addDispatch2,
    updateDispatch2Status,
    voidDispatch2,
    packingBatches,
    auctionCentres,
    farms,
    currentUser,
    selectedAuctionFilter,
    setSelectedAuctionFilter,
    matchesPeriod,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<"register" | "analytics">("register");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dispatch2Ref, setDispatch2Ref] = useState("");
  const [dispatchDate, setDispatchDate] = useState(todayISO());
  const [dispatchTime, setDispatchTime] = useState("18:00");
  const [sourceFarmId, setSourceFarmId] = useState("farm-02");
  const [auctionCentreId, setAuctionCentreId] = useState("auc-01");
  const [vehicleNumber, setVehicleNumber] = useState("KA-04-E-8822");
  const [driverName, setDriverName] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [remarks, setRemarks] = useState("");

  // Consignment lines for Dispatch 2
  const [lines, setLines] = useState<
    Array<{
      id: string;
      packingBatchRef: string;
      harvestBatchRef: string;
      polyhouseName: string;
      varietyId: string;
      varietyName: string;
      flowerColor?: string;
      stemLengthCategoryId: string;
      stemLengthCategoryName: string;
      stemsPerBunch: number;
      bunchesDispatched: number;
      totalStemsDispatched: number;
      cartonsDispatched: number;
      remarks: string;
    }>
  >([]);

  // Pre-fill if packingRef query param or action=new
  useEffect(() => {
    if (prefillPackingRef || searchParams.get("action") === "new") {
      openAddModal(prefillPackingRef || undefined);
    }
  }, [prefillPackingRef, searchParams]);

  // Available packed inventory
  const availablePackingBatches = useMemo(() => {
    return packingBatches.filter((b) => !b.isVoid && (b.availableBunches ?? b.bunchesAvailable ?? 0) > 0);
  }, [packingBatches]);

  // Open Add Modal
  const openAddModal = (specificPackingRef?: string) => {
    const dateStr = new Date().toISOString().split("T")[0];
    const seq = String(dispatch2Records.length + 1).padStart(3, "0");
    setDispatch2Ref(`DSP2-${dateStr.replace(/-/g, "")}-${seq}`);
    setDispatchDate(dateStr);
    setDispatchTime("18:00");
    setSourceFarmId(farms[1]?.id || "farm-02");
    setAuctionCentreId(auctionCentres[0]?.id || "auc-01");
    setVehicleNumber("KA-04-E-8822");
    setDriverName("");
    setTransportCost("");
    setRemarks("");

    const targetPack = specificPackingRef
      ? packingBatches.find((b) => b.packingRef === specificPackingRef)
      : availablePackingBatches[0] || packingBatches[0];

    if (targetPack) {
      setSourceFarmId(targetPack.processingFarmId || farms[1]?.id || "farm-02");
      const bCount = Math.min((targetPack.availableBunches ?? targetPack.bunchesAvailable ?? 40), targetPack.bunchesCount);
      setLines([
        {
          id: `dsp2-line-${Date.now()}-0`,
          packingBatchRef: targetPack.packingRef,
          harvestBatchRef: targetPack.harvestBatchRef || "",
          polyhouseName: targetPack.polyhouseName || "PH-1",
          varietyId: targetPack.varietyId,
          varietyName: targetPack.varietyName,
          flowerColor: targetPack.flowerColor,
          stemLengthCategoryId: targetPack.stemLengthCategoryId || targetPack.stemCategoryId || "",
          stemLengthCategoryName: targetPack.stemLengthCategoryName,
          stemsPerBunch: targetPack.stemsPerBunch,
          bunchesDispatched: bCount,
          totalStemsDispatched: bCount * targetPack.stemsPerBunch,
          cartonsDispatched: Math.ceil(bCount / 10),
          remarks: "",
        },
      ]);
    } else {
      setLines([
        {
          id: `dsp2-line-${Date.now()}-0`,
          packingBatchRef: "PCK-20261017-001",
          harvestBatchRef: "HV-20261017-001",
          polyhouseName: "PH-1",
          varietyId: "var-01",
          varietyName: "Peach Avalanche",
          stemLengthCategoryId: "sl-02",
          stemLengthCategoryName: "Medium (40-50cm)",
          stemsPerBunch: 10,
          bunchesDispatched: 40,
          totalStemsDispatched: 400,
          cartonsDispatched: 4,
          remarks: "",
        },
      ]);
    }

    setIsModalOpen(true);
  };

  const addLine = () => {
    const unpicked = availablePackingBatches.find((b) => !lines.some((l) => l.packingBatchRef === b.packingRef)) || availablePackingBatches[0] || packingBatches[0];
    if (!unpicked) return;
    const bCount = Math.min(unpicked.availableBunches || 20, 20);
    setLines((prev) => [
      ...prev,
      {
        id: `dsp2-line-${Date.now()}-${prev.length}`,
        packingBatchRef: unpicked.packingRef,
        harvestBatchRef: unpicked.harvestBatchRef || "",
        polyhouseName: unpicked.polyhouseName || "PH-1",
        varietyId: unpicked.varietyId,
        varietyName: unpicked.varietyName,
        flowerColor: unpicked.flowerColor,
        stemLengthCategoryId: unpicked.stemLengthCategoryId || unpicked.stemCategoryId || "",
        stemLengthCategoryName: unpicked.stemLengthCategoryName,
        stemsPerBunch: unpicked.stemsPerBunch,
        bunchesDispatched: bCount,
        totalStemsDispatched: bCount * unpicked.stemsPerBunch,
        cartonsDispatched: Math.ceil(bCount / 10),
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
        if (field === "packingBatchRef") {
          const matched = packingBatches.find((p) => p.packingRef === val);
          if (matched) {
            const bCount = Math.min(matched.availableBunches || 10, 10);
            return {
              ...l,
              packingBatchRef: val,
              harvestBatchRef: matched.harvestBatchRef || "",
              polyhouseName: matched.polyhouseName || l.polyhouseName,
              varietyId: matched.varietyId,
              varietyName: matched.varietyName,
              flowerColor: matched.flowerColor,
              stemLengthCategoryId: matched.stemLengthCategoryId || matched.stemCategoryId || "",
              stemLengthCategoryName: matched.stemLengthCategoryName,
              stemsPerBunch: matched.stemsPerBunch,
              bunchesDispatched: bCount,
              totalStemsDispatched: bCount * matched.stemsPerBunch,
            };
          }
        }
        if (field === "bunchesDispatched") {
          const num = Math.max(0, parseInt(val) || 0);
          return {
            ...l,
            bunchesDispatched: num,
            totalStemsDispatched: num * l.stemsPerBunch,
            cartonsDispatched: Math.ceil(num / 10),
          };
        }
        return { ...l, [field]: val };
      })
    );
  };

  const handleSubmitDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert("Please add at least one packing batch to dispatch.");
      return;
    }

    const srcFarm = farms.find((f) => f.id === sourceFarmId);
    const aucCentre = auctionCentres.find((a) => a.id === auctionCentreId);

    const calculatedLines: Dispatch2Line[] = lines.map((l) => ({
      id: l.id,
      packingBatchId: `pck-${l.packingBatchRef}`,
      packingBatchRef: l.packingBatchRef,
      harvestBatchRef: l.harvestBatchRef,
      dispatch1Ref: "",
      polyhouseName: l.polyhouseName,
      varietyId: l.varietyId,
      varietyName: l.varietyName,
      flowerColor: l.flowerColor,
      stemLengthCategoryId: l.stemLengthCategoryId,
      stemLengthCategoryName: l.stemLengthCategoryName,
      stemsPerBunch: l.stemsPerBunch,
      bunchesSent: Number(l.bunchesDispatched) || 0,
      bunchesDispatched: Number(l.bunchesDispatched) || 0,
      totalStemsSent: (Number(l.bunchesDispatched) || 0) * l.stemsPerBunch,
      totalStemsDispatched: (Number(l.bunchesDispatched) || 0) * l.stemsPerBunch,
      cartonsDispatched: Number(l.cartonsDispatched) || 1,
      bunchesSold: 0,
      bunchesUnsold: 0,
      remarks: l.remarks.trim() || undefined,
    }));

    const totalBunches = calculatedLines.reduce((s, l) => s + (l.bunchesDispatched ?? l.bunchesSent ?? 0), 0);
    const totalStems = calculatedLines.reduce((s, l) => s + (l.totalStemsDispatched ?? l.totalStemsSent ?? 0), 0);
    const totalCartons = calculatedLines.reduce((s, l) => s + (l.cartonsDispatched || 0), 0);

    addDispatch2({
      dispatchRef: dispatch2Ref.trim() || `DSP2-${Date.now()}`,
      dispatch2Ref: dispatch2Ref.trim() || `DSP2-${Date.now()}`,
      date: dispatchDate,
      dispatchDate,
      time: dispatchTime,
      dispatchTime,
      sourceFarmId,
      sourceFarmName: srcFarm?.name || "Nitin Farm",
      destAuctionCentreId: auctionCentreId,
      destAuctionCentreName: aucCentre?.name || "IFAB Bangalore",
      auctionCentreId,
      auctionCentreName: aucCentre?.name || "IFAB Bangalore",
      lines: calculatedLines,
      totalBunchesSent: totalBunches,
      totalBunchesDispatched: totalBunches,
      totalStemsSent: totalStems,
      totalStemsDispatched: totalStems,
      totalCartonsDispatched: totalCartons,
      cartonsCount: totalCartons,
      vehicleNumber,
      driverName,
      transportCost: parseFloat(transportCost) || 0,
      status: "dispatched",
      dispatchedBy: currentUser?.name || "Ramesh (Dispatch Head)",
      remarks: remarks.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  // Filtered dispatches based on timeline, status, auction centre, and search
  const displayedDispatches = useMemo(() => {
    return dispatch2Records.filter((d) => {
      if (d.isVoid) return false;
      if (!matchesPeriod(d.dispatchDate || d.date)) return false;
      if (selectedStatus !== "all" && d.status !== selectedStatus) return false;
      if (selectedAuctionFilter !== "all" && (d.auctionCentreId || d.destAuctionCentreId) !== selectedAuctionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = (d.dispatch2Ref || d.dispatchRef || "").toLowerCase().includes(q);
        const matchesAuc = (d.auctionCentreName || d.destAuctionCentreName || "").toLowerCase().includes(q);
        const matchesLine = d.lines.some((l) => l.packingBatchRef.toLowerCase().includes(q) || l.varietyName.toLowerCase().includes(q));
        if (!matchesRef && !matchesAuc && !matchesLine) return false;
      }
      return true;
    });
  }, [dispatch2Records, selectedStatus, selectedAuctionFilter, searchQuery, matchesPeriod]);

  // Aggregate stats
  const totalBunchesSent = useMemo(
    () => displayedDispatches.reduce((sum, d) => sum + (d.totalBunchesDispatched ?? d.totalBunchesSent ?? 0), 0),
    [displayedDispatches]
  );
  const totalStemsSent = useMemo(
    () => displayedDispatches.reduce((sum, d) => sum + (d.totalStemsDispatched ?? d.totalStemsSent ?? 0), 0),
    [displayedDispatches]
  );
  const totalCartonsSent = useMemo(
    () => displayedDispatches.reduce((sum, d) => sum + (d.totalCartonsDispatched || 0), 0),
    [displayedDispatches]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider">
              Stage 5 • Market Dispatch
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Dispatch 2: Processing Farm → Auction Centre
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Dispatch 2: To Auction Centre
          </h1>
          <p className="text-xs text-slate-500">
            Dispatch boxed bunches to IFAB Bangalore, APMC Mumbai, and record consignments for auction realization.
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
              Auction Consignments ({displayedDispatches.length})
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
              <span>Destination Split</span>
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Dispatch 2</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50/50 to-white border-2 border-blue-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
            Bunches Sent to Auction
          </p>
          <p className="text-3xl font-black text-blue-950 mt-1">{formatNumber(totalBunchesSent)}</p>
          <p className="text-xs font-semibold text-blue-800/80 mt-1">
            Across registered auction centres
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
            Total Stems Sent
          </p>
          <p className="text-3xl font-black text-emerald-950 mt-1">{formatNumber(totalStemsSent)}</p>
          <p className="text-xs font-semibold text-emerald-800/80 mt-1">
            In {formatNumber(totalCartonsSent)} refrigerated cartons
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-2 border-amber-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
            Active in Transit
          </p>
          <p className="text-3xl font-black text-amber-950 mt-1">
            {displayedDispatches.filter((d) => d.status === "dispatched").length} Consignments
          </p>
          <p className="text-xs font-semibold text-amber-800/80 mt-1">
            En route to auction floors
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border-2 border-purple-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">
            Settlement Status
          </p>
          <p className="text-3xl font-black text-purple-950 mt-1">
            {displayedDispatches.filter((d) => d.realizationRecorded).length} Realized
          </p>
          <p className="text-xs font-semibold text-purple-800/80 mt-1">
            Actual auction price recorded
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
              placeholder="Search dispatch 2 ref, packing ref, lot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Auction Centre:</span>
            <select
              value={selectedAuctionFilter}
              onChange={(e) => setSelectedAuctionFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Auction Centres</option>
              {auctionCentres.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-500">
          Showing {displayedDispatches.length} market dispatches
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "register" ? (
        <div className="space-y-4">
          {displayedDispatches.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Dispatch 2 Consignments Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No market consignments match your filter. Click "+ Create Dispatch 2" to move packed bunches to the auction house.
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
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-slate-900">
                            {dispatch.dispatch2Ref}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              dispatch.status === "dispatched"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : dispatch.status === "received"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : dispatch.status === "closed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {dispatch.status}
                          </span>
                          {dispatch.realizationRecorded ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <BadgeIndianRupee className="w-3 h-3" />
                              Price Realized
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Awaiting Auction Results
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Origin: <strong className="text-slate-800 font-bold">{dispatch.sourceFarmName}</strong> → Auction:{" "}
                          <strong className="text-blue-700 font-bold">{dispatch.auctionCentreName}</strong> • Date:{" "}
                          <span className="text-slate-700">{formatDate(dispatch.dispatchDate)}</span>
                          {dispatch.vehicleNumber && ` • Vehicle: ${dispatch.vehicleNumber}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Record Auction Realization Button */}
                      <Link
                        href={`/auction-sales?dispatch2Ref=${dispatch.dispatch2Ref}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
                      >
                        <BadgeIndianRupee className="w-3.5 h-3.5" />
                        <span>{dispatch.realizationRecorded ? "View / Edit Realization" : "Record Auction Realization"}</span>
                      </Link>

                      {/* Status Lifecycle Control */}
                      {dispatch.status === "dispatched" && (
                        <button
                          onClick={() => updateDispatch2Status(dispatch.id, "received")}
                          className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                        >
                          Mark Received at Auction
                        </button>
                      )}

                      <Link
                        href={`/reports?batchRef=${dispatch.dispatch2Ref}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200"
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
                          <th className="py-2 px-3">Packing Batch Ref</th>
                          <th className="py-2 px-3">Variety & Spec</th>
                          <th className="py-2 px-3">Stem Length</th>
                          <th className="py-2 px-3 text-right">Bunches Dispatched</th>
                          <th className="py-2 px-3 text-right">Total Stems</th>
                          <th className="py-2 px-3 text-right">Cartons</th>
                          <th className="py-2 px-3">Origin Harvest Trace</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dispatch.lines.map((l) => (
                          <tr key={l.id} className="hover:bg-white/80">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              <Link href={`/packing?batchRef=${l.packingBatchRef}`} className="text-emerald-700 hover:underline">
                                {l.packingBatchRef}
                              </Link>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900">{l.varietyName}</span>
                              <span className="block text-[10px] text-slate-400">{l.stemsPerBunch} stems / bunch</span>
                            </td>
                            <td className="py-2.5 px-3 text-purple-700 font-bold">
                              {l.stemLengthCategoryName}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-blue-900">
                              {l.bunchesDispatched ?? l.bunchesSent ?? 0} bunches
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                              {formatNumber(l.totalStemsDispatched ?? l.totalStemsSent ?? 0)} stems
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-700">
                              {l.cartonsDispatched || 1} boxes
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-rose-700">
                              {l.harvestBatchRef} ({l.polyhouseName || "PH"})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
                          <td className="py-2.5 px-3" colSpan={3}>
                            Auction Lot Consignment Total
                          </td>
                          <td className="py-2.5 px-3 text-right text-blue-900 font-black">
                            {dispatch.totalBunchesDispatched ?? dispatch.totalBunchesSent ?? 0} bunches
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 font-black">
                            {formatNumber(dispatch.totalStemsDispatched ?? dispatch.totalStemsSent ?? 0)} stems
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">
                            {dispatch.totalCartonsDispatched || 1} cartons
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                            {dispatch.remarks ? `Note: ${dispatch.remarks}` : ""}
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
              <h3 className="text-sm font-bold text-slate-900">Dispatches by Auction Destination</h3>
              <p className="text-xs text-slate-500">Bunches dispatched to each auction centre</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={auctionCentres.map((a) => ({
                    name: a.name.split(" ")[0],
                    fullName: a.name,
                    bunches: dispatch2Records
                      .filter((d) => (d.auctionCentreId === a.id || d.destAuctionCentreId === a.id) && !d.isVoid)
                      .reduce((s, d) => s + (d.totalBunchesDispatched ?? d.totalBunchesSent ?? 0), 0),
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${formatNumber(Number(val))} bunches`, "Bunches Dispatched"]}
                    contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", color: "#FFF", fontSize: "12px" }}
                  />
                  <Bar dataKey="bunches" name="Bunches" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Auction Flow Status</h3>
              <p className="text-xs text-slate-500">Consignments track record</p>
            </div>
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center text-xs">
                <span className="font-bold text-blue-900">Total Consignments Dispatched</span>
                <span className="font-black text-blue-950 text-sm">{dispatch2Records.length}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-900">Realization Fully Accounted</span>
                <span className="font-black text-emerald-950 text-sm">{dispatch2Records.filter(d => d.realizationRecorded).length}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                <span className="font-bold text-amber-900">Awaiting Price Confirmation</span>
                <span className="font-black text-amber-950 text-sm">{dispatch2Records.filter(d => !d.realizationRecorded).length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DISPATCH 2 MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    Create Dispatch 2: Auction Consignment
                  </h2>
                  <p className="text-xs text-blue-100">
                    Allocate packed bunches to auction centres and deduct from inventory
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

            <form onSubmit={handleSubmitDispatch} className="p-6 space-y-5">
              {/* Route & Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dispatch 2 Ref *
                  </label>
                  <input
                    type="text"
                    required
                    value={dispatch2Ref}
                    onChange={(e) => setDispatch2Ref(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-slate-50"
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
                    Destination Auction *
                  </label>
                  <select
                    value={auctionCentreId}
                    onChange={(e) => setAuctionCentreId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    {auctionCentres.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Logistics */}
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
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Transport Freight (₹)
                  </label>
                  <input
                    type="number"
                    value={transportCost}
                    onChange={(e) => setTransportCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Lines from Available Packed Batches */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Packed Batches for Auction Consignment
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Select packed batches, bunches to dispatch, and cartons
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Packing Line</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50 max-h-56 overflow-y-auto">
                  {lines.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs"
                    >
                      <div className="w-52">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Packing Batch Ref
                        </label>
                        <select
                          value={l.packingBatchRef}
                          onChange={(e) => updateLineField(l.id, "packingBatchRef", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white"
                        >
                          {packingBatches.map((p) => (
                            <option key={p.id} value={p.packingRef}>
                              {p.packingRef} ({p.varietyName} • {p.availableBunches} bch left)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 min-w-[120px]">
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Spec
                        </span>
                        <span className="text-xs font-bold text-slate-800 block">
                          {l.varietyName} ({l.stemLengthCategoryName})
                        </span>
                      </div>

                      <div className="w-24">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Bunches
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={l.bunchesDispatched}
                          onChange={(e) => updateLineField(l.id, "bunchesDispatched", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-bold text-right rounded-lg border border-slate-200"
                        />
                      </div>

                      <div className="w-28 text-right">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Stems
                        </label>
                        <span className="text-xs font-extrabold text-blue-700 block py-1.5">
                          {formatNumber(l.totalStemsDispatched)}
                        </span>
                      </div>

                      <div className="w-20">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Boxes
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={l.cartonsDispatched}
                          onChange={(e) => updateLineField(l.id, "cartonsDispatched", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-right"
                        />
                      </div>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(l.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer self-end mb-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900">
                  Total Dispatched: {lines.reduce((s, l) => s + Number(l.bunchesDispatched || 0), 0)} Bunches ({lines.reduce((s, l) => s + Number(l.cartonsDispatched || 0), 0)} Cartons)
                </span>
                <span className="font-extrabold text-blue-800">
                  Total Stems: {formatNumber(lines.reduce((s, l) => s + l.totalStemsDispatched, 0))} Stems
                </span>
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
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Dispatch Consignment to Auction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
