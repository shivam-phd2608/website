"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BadgeIndianRupee,
  Plus,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  TrendingUp,
  BarChart3,
  Percent,
  Receipt,
  Tag,
  DollarSign,
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
import { AuctionRealization, AuctionRealizationLine } from "@/lib/types";
import { formatNumber, formatDate, formatCurrency , todayISO } from "@/lib/formatters";

const getStatusBadge = (status?: string) => {
  const s = (status || "settled").toLowerCase();
  if (s === "pending") return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "partially_settled") return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
};

export default function AuctionRealizationPage() {
  const searchParams = useSearchParams();
  const prefillDispatch2Ref = searchParams.get("dispatch2Ref");

  const {
    auctionRealizations,
    addAuctionRealization,
    updateAuctionRealization,
    voidAuctionRealization,
    dispatch2Records,
    auctionCentres,
    varieties,
    currentUser,
    selectedAuctionFilter,
    setSelectedAuctionFilter,
    matchesPeriod,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<"settlements" | "analytics">("settlements");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRealizationId, setEditingRealizationId] = useState<string | null>(null);

  // Form Fields
  const [realizationRef, setRealizationRef] = useState("");
  const [dispatch2Ref, setDispatch2Ref] = useState("");
  const [auctionCentreId, setAuctionCentreId] = useState("auc-01");
  const [auctionDate, setAuctionDate] = useState(todayISO());
  const [auctionLotRef, setAuctionLotRef] = useState("LOT-BLR-892");
  const [settlementRef, setSettlementRef] = useState("SETTLE-OCT-001");
  const [auctionCommission, setAuctionCommission] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [remarks, setRemarks] = useState("");

  // Sale Lines State
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
      bunchesSent: number;
      bunchesSold: number;
      bunchesUnsold: number;
      pricePerUnit: number;
      priceUnit: "per_bunch" | "per_stem";
      grossRealization: number;
      remarks: string;
    }>
  >([]);

  // Pre-fill from query param or action=new
  useEffect(() => {
    if (prefillDispatch2Ref || searchParams.get("action") === "new") {
      openAddModal(prefillDispatch2Ref || undefined);
    }
  }, [prefillDispatch2Ref, searchParams]);

  // Open Add Modal
  const openAddModal = (specificDispatch2Ref?: string) => {
    setEditingRealizationId(null);
    const dateStr = new Date().toISOString().split("T")[0];
    const seq = String(auctionRealizations.length + 1).padStart(3, "0");
    setRealizationRef(`AR-${dateStr.replace(/-/g, "")}-${seq}`);
    setAuctionDate(dateStr);
    setAuctionLotRef(`LOT-${Math.floor(100 + Math.random() * 900)}`);
    setSettlementRef(`SETTLE-${dateStr.replace(/-/g, "")}`);
    setAuctionCommission(350);
    setOtherCharges(150);
    setRemarks("");

    const targetDispatch = specificDispatch2Ref
      ? dispatch2Records.find((d) => d.dispatch2Ref === specificDispatch2Ref)
      : dispatch2Records.find((d) => !d.realizationRecorded && !d.isVoid) || dispatch2Records[0];

    if (targetDispatch) {
      setDispatch2Ref(targetDispatch.dispatch2Ref || targetDispatch.dispatchRef || "");
      setAuctionCentreId(targetDispatch.auctionCentreId || targetDispatch.destAuctionCentreId || "");

      setLines(
        targetDispatch.lines.map((l, idx) => {
          const sent = l.bunchesDispatched ?? l.bunchesSent ?? 0;
          const sold = sent;
          const price = 120;
          return {
            id: `ar-line-${Date.now()}-${idx}`,
            packingBatchRef: l.packingBatchRef,
            harvestBatchRef: l.harvestBatchRef,
            polyhouseName: l.polyhouseName || "PH-1",
            varietyId: l.varietyId,
            varietyName: l.varietyName,
            flowerColor: l.flowerColor,
            stemLengthCategoryId: l.stemLengthCategoryId || "",
            stemLengthCategoryName: l.stemLengthCategoryName,
            stemsPerBunch: l.stemsPerBunch,
            bunchesSent: sent,
            bunchesSold: sold,
            bunchesUnsold: 0,
            pricePerUnit: price,
            priceUnit: "per_bunch" as const,
            grossRealization: sold * price,
            remarks: "",
          };
        })
      );
    } else {
      setDispatch2Ref("DSP2-20261017-001");
      setAuctionCentreId("auc-01");
      setLines([
        {
          id: `ar-line-${Date.now()}-0`,
          packingBatchRef: "PCK-20261017-001",
          harvestBatchRef: "HV-20261017-001",
          polyhouseName: "PH-1",
          varietyId: "var-01",
          varietyName: "Peach Avalanche",
          flowerColor: "Peach",
          stemLengthCategoryId: "sl-02",
          stemLengthCategoryName: "Medium (40-50cm)",
          stemsPerBunch: 10,
          bunchesSent: 40,
          bunchesSold: 40,
          bunchesUnsold: 0,
          pricePerUnit: 120,
          priceUnit: "per_bunch",
          grossRealization: 4800,
          remarks: "",
        },
      ]);
    }

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (realization: AuctionRealization) => {
    setEditingRealizationId(realization.id);
    setRealizationRef(realization.realizationRef);
    setDispatch2Ref(realization.dispatch2Ref);
    setAuctionCentreId(realization.auctionCentreId);
    setAuctionDate(realization.auctionDate);
    setAuctionLotRef(realization.auctionLotRef || "");
    setSettlementRef(realization.settlementRef || "");
    setAuctionCommission(Number(realization.auctionCommission) || Number(realization.totalCommission) || 0);
    setOtherCharges(Number(realization.otherCharges) || Number(realization.totalOtherCharges) || 0);
    setRemarks(realization.remarks || "");

    setLines(
      (realization.lines || []).map((l) => ({
        id: l.id,
        packingBatchRef: l.packingBatchRef || "",
        harvestBatchRef: l.harvestBatchRef || "",
        polyhouseName: l.polyhouseName || "PH-1",
        varietyId: l.varietyId,
        varietyName: l.varietyName,
        flowerColor: l.flowerColor || l.varietyColor || "",
        stemLengthCategoryId: l.stemLengthCategoryId || "sl-02",
        stemLengthCategoryName: l.stemLengthCategoryName || "Medium",
        stemsPerBunch: l.stemsPerBunch || 20,
        bunchesSent: l.bunchesSent || 0,
        bunchesSold: l.bunchesSold || 0,
        bunchesUnsold: l.bunchesUnsold || 0,
        pricePerUnit: l.pricePerUnit || 0,
        priceUnit: l.priceUnit === "per_stem" || l.priceUnit === "stem" ? "per_stem" : "per_bunch",
        grossRealization: Number(l.grossRealization) || Number(l.grossSaleValue) || 0,
        remarks: l.remarks || "",
      }))
    );

    setIsModalOpen(true);
  };

  // Handle Dispatch 2 selection change
  const handleDispatchChange = (d2Ref: string) => {
    setDispatch2Ref(d2Ref);
    const d = dispatch2Records.find((item) => (item.dispatch2Ref || item.dispatchRef) === d2Ref);
    if (d) {
      setAuctionCentreId(d.auctionCentreId || d.destAuctionCentreId || "");
      setLines(
        d.lines.map((l, idx) => {
          const sent = l.bunchesDispatched ?? l.bunchesSent ?? 0;
          return {
            id: `ar-line-${Date.now()}-${idx}`,
            packingBatchRef: l.packingBatchRef,
            harvestBatchRef: l.harvestBatchRef,
            polyhouseName: l.polyhouseName || "PH-1",
            varietyId: l.varietyId,
            varietyName: l.varietyName,
            flowerColor: l.flowerColor,
            stemLengthCategoryId: l.stemLengthCategoryId || "",
            stemLengthCategoryName: l.stemLengthCategoryName,
            stemsPerBunch: l.stemsPerBunch,
            bunchesSent: sent,
            bunchesSold: sent,
            bunchesUnsold: 0,
            pricePerUnit: 120,
            priceUnit: "per_bunch" as const,
            grossRealization: sent * 120,
            remarks: "",
          };
        })
      );
    }
  };

  const updateLineField = (
    id: string,
    field: "bunchesSold" | "pricePerUnit" | "priceUnit" | "remarks",
    val: any
  ) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;

        const updated = { ...l, [field]: val };
        if (field === "bunchesSold") {
          const sold = Math.min(l.bunchesSent, Math.max(0, parseInt(val) || 0));
          updated.bunchesSold = sold;
          updated.bunchesUnsold = l.bunchesSent - sold;
        }

        // Recalculate gross based on price unit
        const soldQty = updated.bunchesSold;
        const price = Number(updated.pricePerUnit) || 0;
        if (updated.priceUnit === "per_bunch") {
          updated.grossRealization = soldQty * price;
        } else {
          // per stem: stems = soldQty * stemsPerBunch
          updated.grossRealization = soldQty * updated.stemsPerBunch * price;
        }

        return updated;
      })
    );
  };

  // Calculations
  const totalGrossCalculated = useMemo(() => {
    return lines.reduce((sum, l) => sum + l.grossRealization, 0);
  }, [lines]);

  const totalNetCalculated = useMemo(() => {
    return totalGrossCalculated - (Number(auctionCommission) || 0) - (Number(otherCharges) || 0);
  }, [totalGrossCalculated, auctionCommission, otherCharges]);

  const handleSubmitRealization = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert("Please enter sale lines for this auction realization");
      return;
    }

    const auc = auctionCentres.find((a) => a.id === auctionCentreId);
    const dsp2 = dispatch2Records.find((d) => d.dispatch2Ref === dispatch2Ref);

    const calculatedLines: AuctionRealizationLine[] = lines.map((l) => ({
      id: l.id,
      dispatch2LineId: "",
      packingBatchRef: l.packingBatchRef,
      harvestBatchRef: l.harvestBatchRef,
      polyhouseName: l.polyhouseName,
      varietyId: l.varietyId,
      varietyName: l.varietyName,
      varietyColor: l.flowerColor,
      flowerColor: l.flowerColor,
      stemLengthCategoryId: l.stemLengthCategoryId,
      stemLengthCategoryName: l.stemLengthCategoryName,
      stemsPerBunch: l.stemsPerBunch,
      bunchesSent: l.bunchesSent,
      bunchesSold: l.bunchesSold,
      bunchesUnsold: l.bunchesUnsold,
      pricePerUnit: l.pricePerUnit,
      priceUnit: l.priceUnit,
      grossSaleValue: l.grossRealization,
      grossRealization: l.grossRealization,
      commissionAmount: Math.round(l.grossRealization * 0.045 * 10) / 10,
      otherCharges: 0,
      netRealization: l.grossRealization - Math.round(l.grossRealization * 0.045 * 10) / 10,
      remarks: l.remarks.trim() || undefined,
    }));

    const totalSent = calculatedLines.reduce((s, l) => s + l.bunchesSent, 0);
    const totalSold = calculatedLines.reduce((s, l) => s + l.bunchesSold, 0);
    const totalUnsold = calculatedLines.reduce((s, l) => s + l.bunchesUnsold, 0);

    if (editingRealizationId) {
      updateAuctionRealization(editingRealizationId, {
        realizationRef,
        dispatch2Id: dsp2?.id || "",
        dispatch2Ref,
        auctionCentreId,
        auctionCentreName: auc?.name || "IFAB Bangalore",
        auctionDate,
        auctionLotRef: auctionLotRef.trim() || undefined,
        lines: calculatedLines,
        totalBunchesSent: totalSent,
        totalBunchesSold: totalSold,
        totalBunchesUnsold: totalUnsold,
        totalGrossValue: totalGrossCalculated,
        totalGrossRealization: totalGrossCalculated,
        totalCommission: Number(auctionCommission) || 0,
        auctionCommission: Number(auctionCommission) || 0,
        totalOtherCharges: Number(otherCharges) || 0,
        otherCharges: Number(otherCharges) || 0,
        totalNetRealization: totalNetCalculated,
        netRealization: totalNetCalculated,
        settlementRef: settlementRef.trim() || undefined,
        paymentStatus: "settled",
        remarks: remarks.trim() || undefined,
      });
    } else {
      addAuctionRealization({
        realizationRef: realizationRef.trim() || `AR-${Date.now()}`,
        dispatch2Id: dsp2?.id || "",
        dispatch2Ref,
        auctionCentreId,
        auctionCentreName: auc?.name || "IFAB Bangalore",
        auctionDate,
        auctionLotRef: auctionLotRef.trim() || undefined,
        lines: calculatedLines,
        totalBunchesSent: totalSent,
        totalBunchesSold: totalSold,
        totalBunchesUnsold: totalUnsold,
        totalGrossValue: totalGrossCalculated,
        totalGrossRealization: totalGrossCalculated,
        totalCommission: Number(auctionCommission) || 0,
        auctionCommission: Number(auctionCommission) || 0,
        totalOtherCharges: Number(otherCharges) || 0,
        otherCharges: Number(otherCharges) || 0,
        totalNetRealization: totalNetCalculated,
        netRealization: totalNetCalculated,
        settlementRef: settlementRef.trim() || undefined,
        paymentStatus: "settled",
        recordedBy: currentUser?.name || "Shiva Kumar (Accounts)",
        remarks: remarks.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  // Filtered list based on timeline, auction centre, and search
  const displayedRealizations = useMemo(() => {
    return auctionRealizations.filter((r) => {
      if (r.isVoid) return false;
      if (!matchesPeriod(r.auctionDate || r.date)) return false;
      if (selectedAuctionFilter !== "all" && r.auctionCentreId !== selectedAuctionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = (r.realizationRef || "").toLowerCase().includes(q);
        const matchesD2 = (r.dispatch2Ref || "").toLowerCase().includes(q);
        const matchesLot = (r.auctionLotRef || "").toLowerCase().includes(q);
        const matchesLine = r.lines?.some((l) => (l.varietyName || "").toLowerCase().includes(q));
        if (!matchesRef && !matchesD2 && !matchesLot && !matchesLine) return false;
      }
      return true;
    });
  }, [auctionRealizations, selectedAuctionFilter, searchQuery, matchesPeriod]);

  // Aggregate stats
  const totalGrossSum = useMemo(
    () => displayedRealizations.reduce((sum, r) => sum + (Number(r.totalGrossRealization) || Number(r.totalGrossValue) || 0), 0),
    [displayedRealizations]
  );
  const totalCommissionsSum = useMemo(
    () => displayedRealizations.reduce((sum, r) => sum + (Number(r.auctionCommission) || Number(r.totalCommission) || 0) + (Number(r.otherCharges) || Number(r.totalOtherCharges) || 0), 0),
    [displayedRealizations]
  );
  const totalNetSum = useMemo(
    () => displayedRealizations.reduce((sum, r) => sum + (Number(r.netRealization) || Number(r.totalNetRealization) || 0), 0),
    [displayedRealizations]
  );
  const totalBunchesSoldSum = useMemo(
    () => displayedRealizations.reduce((sum, r) => sum + (Number(r.totalBunchesSold) || 0), 0),
    [displayedRealizations]
  );
  const totalBunchesSentSum = useMemo(
    () => displayedRealizations.reduce((sum, r) => sum + (Number(r.totalBunchesSent) || 0), 0),
    [displayedRealizations]
  );
  const avgRealizationPerBunch = totalBunchesSoldSum > 0 ? (totalGrossSum / totalBunchesSoldSum).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              Stage 6 • Price Realization
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Auction Sales, Commission Accounting & Net Realization
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Auction Sales & Price Realization
          </h1>
          <p className="text-xs text-slate-500">
            Record actual sale prices against Dispatch 2 consignments, track sell-through vs unsold bunches, and calculate net realization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("settlements")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "settlements"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Settlement Statements ({displayedRealizations.length})
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
              <span>Realization Analytics</span>
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Auction Realization</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
            Gross Auction Realization
          </p>
          <p className="text-3xl font-black text-emerald-950 mt-1">{formatCurrency(totalGrossSum)}</p>
          <p className="text-xs font-semibold text-emerald-800/80 mt-1">
            Avg: ₹{avgRealizationPerBunch} / bunch sold
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-2 border-amber-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
            Commission & Hall Charges
          </p>
          <p className="text-3xl font-black text-amber-950 mt-1">{formatCurrency(totalCommissionsSum)}</p>
          <p className="text-xs font-semibold text-amber-800/80 mt-1">
            {totalGrossSum > 0 ? ((totalCommissionsSum / totalGrossSum) * 100).toFixed(1) : 0}% deduction rate
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50/50 to-white border-2 border-sky-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-sky-800 uppercase tracking-wider">
            Net Realized Revenue
          </p>
          <p className="text-3xl font-black text-sky-950 mt-1">{formatCurrency(totalNetSum)}</p>
          <p className="text-xs font-semibold text-sky-800/80 mt-1">
            Credited to farm bank account
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border-2 border-purple-200/90 shadow-xs">
          <p className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">
            Bunches Clearance
          </p>
          <p className="text-3xl font-black text-purple-950 mt-1">
            {totalBunchesSentSum > 0 ? ((totalBunchesSoldSum / totalBunchesSentSum) * 100).toFixed(0) : 100}%
          </p>
          <p className="text-xs font-semibold text-purple-800/80 mt-1">
            {totalBunchesSoldSum} sold of {totalBunchesSentSum} sent
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
              placeholder="Search realization ref, dispatch 2 ref, lot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 w-64"
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
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-500">
          Showing {displayedRealizations.length} auction realization records
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "settlements" ? (
        <div className="space-y-4">
          {displayedRealizations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <BadgeIndianRupee className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Auction Realizations Recorded</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No realization statements logged. Click "+ Record Auction Realization" to record sold quantities and actual realized prices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayedRealizations.map((realization) => (
                <div
                  key={realization.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all p-5 space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                        <BadgeIndianRupee className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-slate-900">
                            {realization.realizationRef}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(realization.paymentStatus)}`}>
                            {(realization.paymentStatus || "settled").toUpperCase().replace("_", " ")}
                          </span>
                          {realization.auctionLotRef && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                              Lot: {realization.auctionLotRef}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Auction Centre: <strong className="text-slate-800 font-bold">{realization.auctionCentreName}</strong> • Date:{" "}
                          <span className="text-slate-700">{formatDate(realization.auctionDate)}</span>
                          {realization.settlementRef && ` • Settlement: ${realization.settlementRef}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(realization)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Realization</span>
                      </button>

                      <Link
                        href={`/reports?batchRef=${realization.realizationRef}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200"
                      >
                        <span>Full Trace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Origin Dispatch Link */}
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-500">
                      Against Dispatch 2:{" "}
                      <Link href={`/dispatch-auction?batchRef=${realization.dispatch2Ref}`} className="font-mono font-bold text-blue-700 hover:underline">
                        {realization.dispatch2Ref}
                      </Link>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-700">
                      Bunches Sent: <strong className="font-bold text-slate-900">{realization.totalBunchesSent}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-700">
                      Bunches Sold: <strong className="font-bold text-emerald-700">{realization.totalBunchesSold}</strong>
                    </span>
                    {realization.totalBunchesUnsold > 0 && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-700 font-bold">
                          Unsold: {realization.totalBunchesUnsold} bunches
                        </span>
                      </>
                    )}
                  </div>

                  {/* Multi-line Sales Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600 bg-slate-100/60 font-semibold">
                          <th className="py-2 px-3">Flower Variety & Spec</th>
                          <th className="py-2 px-3">Stem Length</th>
                          <th className="py-2 px-3 text-right">Sent</th>
                          <th className="py-2 px-3 text-right">Sold</th>
                          <th className="py-2 px-3 text-right">Unsold</th>
                          <th className="py-2 px-3 text-right">Price Realized</th>
                          <th className="py-2 px-3 text-right">Gross Realization</th>
                          <th className="py-2 px-3">Origin Harvest Trace</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {realization.lines.map((l) => (
                          <tr key={l.id} className="hover:bg-white/80">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900">{l.varietyName}</span>
                              <span className="block text-[10px] text-slate-400">
                                {l.stemsPerBunch} stems/bch {l.flowerColor && `• ${l.flowerColor}`}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-purple-700 font-bold">
                              {l.stemLengthCategoryName}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">
                              {l.bunchesSent} bch
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-800">
                              {l.bunchesSold} bch
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-500">
                              {l.bunchesUnsold > 0 ? (
                                <span className="font-bold text-rose-700">{l.bunchesUnsold} bch</span>
                              ) : (
                                "0"
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900">
                              ₹{l.pricePerUnit} <span className="text-[10px] text-slate-400 font-normal">/{l.priceUnit === "per_bunch" ? "bch" : "stem"}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-700 text-sm">
                              {formatCurrency(l.grossRealization ?? l.grossSaleValue ?? 0)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-rose-700">
                              {l.harvestBatchRef} ({l.polyhouseName || "PH"})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Settlement Breakdown Bar */}
                  <div className="flex flex-wrap items-center justify-between p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs">
                    <div className="flex flex-wrap items-center gap-5">
                      <div>
                        <span className="text-emerald-800 text-[10px] uppercase font-bold">Gross Auction Value:</span>
                        <span className="ml-1.5 font-black text-slate-900 text-sm">
                          {formatCurrency(realization.totalGrossRealization ?? realization.totalGrossValue ?? 0)}
                        </span>
                      </div>
                      <span className="text-emerald-300">−</span>
                      <div>
                        <span className="text-emerald-800 text-[10px] uppercase font-bold">Commission:</span>
                        <span className="ml-1.5 font-bold text-amber-800">
                          ₹{realization.auctionCommission ?? realization.totalCommission ?? 0}
                        </span>
                      </div>
                      <span className="text-emerald-300">−</span>
                      <div>
                        <span className="text-emerald-800 text-[10px] uppercase font-bold">Hall Charges:</span>
                        <span className="ml-1.5 font-bold text-amber-800">
                          ₹{realization.otherCharges ?? realization.totalOtherCharges ?? 0}
                        </span>
                      </div>
                      <span className="text-emerald-300">=</span>
                      <div>
                        <span className="text-emerald-900 text-[10px] uppercase font-black">Net Realization:</span>
                        <span className="ml-1.5 font-black text-emerald-800 text-base">
                          {formatCurrency(realization.netRealization ?? realization.totalNetRealization ?? 0)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-emerald-800">
                      Settled by: {realization.recordedBy || "Accounts"}
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gross Realization by Flower Variety</h3>
              <p className="text-xs text-slate-500">Total revenue generated per variety</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={varieties.map((v) => {
                    const gross = auctionRealizations
                      .flatMap((r) => r.lines || [])
                      .filter((l) => l.varietyId === v.id)
                      .reduce((s, l) => s + (Number(l.grossRealization) || Number(l.grossSaleValue) || 0), 0);
                    return { name: v.name, gross };
                  })}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`₹${formatNumber(Number(val))}`, "Gross Sales"]}
                    contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", color: "#FFF", fontSize: "12px" }}
                  />
                  <Bar dataKey="gross" name="Gross Sales (₹)" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Average Realization Benchmark</h3>
              <p className="text-xs text-slate-500">Realization per bunch across auction centres</p>
            </div>
            <div className="space-y-3 pt-2">
              {auctionCentres.map((auc) => {
                const realizations = auctionRealizations.filter((r) => r.auctionCentreId === auc.id);
                const sold = realizations.reduce((s, r) => s + (Number(r.totalBunchesSold) || 0), 0);
                const gross = realizations.reduce((s, r) => s + (Number(r.totalGrossRealization) || Number(r.totalGrossValue) || 0), 0);
                const avg = sold > 0 ? (gross / sold).toFixed(0) : "0";
                return (
                  <div key={auc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{auc.name}</span>
                      <span className="text-[10px] text-slate-400">{sold} bunches sold</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-800 text-sm">₹{avg} / bch</span>
                      <span className="text-[10px] text-slate-500 block">Total: {formatCurrency(gross)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* RECORD / EDIT REALIZATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-5 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <BadgeIndianRupee className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {editingRealizationId ? "Edit Auction Realization" : "Record Auction Realization"}
                  </h2>
                  <p className="text-xs text-emerald-100">
                    Enter sale prices against Dispatch 2 consignment lines with explicit price unit
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

            <form onSubmit={handleSubmitRealization} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Realization Ref *
                  </label>
                  <input
                    type="text"
                    required
                    value={realizationRef}
                    onChange={(e) => setRealizationRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dispatch 2 Ref *
                  </label>
                  <select
                    value={dispatch2Ref}
                    onChange={(e) => handleDispatchChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    {dispatch2Records.map((d) => (
                      <option key={d.id} value={d.dispatch2Ref}>
                        {d.dispatch2Ref} ({d.auctionCentreName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Auction Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={auctionDate}
                    onChange={(e) => setAuctionDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lot Reference / ID
                  </label>
                  <input
                    type="text"
                    value={auctionLotRef}
                    onChange={(e) => setAuctionLotRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    placeholder="LOT-BLR-892"
                  />
                </div>
              </div>

              {/* Multi-line Sales Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">
                  Sale Lines & Realized Prices (per Bunch or per Stem)
                </span>

                <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50 max-h-60 overflow-y-auto">
                  {lines.map((l) => (
                    <div
                      key={l.id}
                      className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{l.varietyName}</span>
                          <span className="text-slate-500 ml-1.5 font-medium">({l.stemLengthCategoryName})</span>
                        </div>
                        <span className="text-slate-500">
                          Sent: <strong className="text-blue-700">{l.bunchesSent} bunches</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Bunches Sold *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={l.bunchesSent}
                            value={l.bunchesSold}
                            onChange={(e) => updateLineField(l.id, "bunchesSold", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Price Unit *
                          </label>
                          <select
                            value={l.priceUnit}
                            onChange={(e) => updateLineField(l.id, "priceUnit", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="per_bunch">₹ Per Bunch</option>
                            <option value="per_stem">₹ Per Stem</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Actual Sale Price (₹) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={l.pricePerUnit}
                            onChange={(e) => updateLineField(l.id, "pricePerUnit", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-black text-right rounded-lg border border-slate-300"
                          />
                        </div>

                        <div className="text-right">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Gross Line Sales
                          </label>
                          <span className="text-sm font-black text-emerald-700 block py-1.5">
                            {formatCurrency(l.grossRealization)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission & Settlement */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Auction Commission (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={auctionCommission}
                    onChange={(e) => setAuctionCommission(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-right font-bold text-amber-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Other Charges / Hall Fees (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-right font-bold text-amber-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Settlement Sheet Ref
                  </label>
                  <input
                    type="text"
                    value={settlementRef}
                    onChange={(e) => setSettlementRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    placeholder="SETTLE-OCT-001"
                  />
                </div>
              </div>

              {/* Realization Total Calculation */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">
                  Gross Realization: {formatCurrency(totalGrossCalculated)}
                </span>
                <span className="font-extrabold text-emerald-900 text-sm">
                  Net Realization: {formatCurrency(totalNetCalculated)}
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
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRealizationId ? "Save Realization Updates" : "Save Auction Realization"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
