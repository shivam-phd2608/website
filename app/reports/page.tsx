"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  GitFork,
  Search,
  Flower2,
  Truck,
  Split,
  PackageCheck,
  Building2,
  BadgeIndianRupee,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Calendar,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  BarChart3,
  Check,
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
import { formatNumber, formatDate, formatCurrency } from "@/lib/formatters";

export default function ReportsAndTraceabilityPage() {
  const searchParams = useSearchParams();
  const initialBatchRef = searchParams.get("batchRef") || "HV-20261017-001";

  const {
    harvestBatches,
    dispatch1Records,
    gradings,
    packingBatches,
    dispatch2Records,
    auctionRealizations,
    getBatchTraceability,
    traceabilityKPIs,
    farms,
    auctionCentres,
    varieties,
    stemLengthCategories,
    polyhouses,
    matchesPeriod,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<"explorer" | "reconciliation" | "economics">("explorer");
  const [selectedBatchRef, setSelectedBatchRef] = useState<string>(initialBatchRef);
  const [searchInput, setSearchInput] = useState<string>(initialBatchRef);

  useEffect(() => {
    if (searchParams.get("batchRef")) {
      const ref = searchParams.get("batchRef")!;
      setSelectedBatchRef(ref);
      setSearchInput(ref);
    }
  }, [searchParams]);

  // Retrieve full batch lineage using store helper
  const lineage = useMemo(() => {
    return getBatchTraceability(selectedBatchRef);
  }, [getBatchTraceability, selectedBatchRef]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSelectedBatchRef(searchInput.trim());
    }
  };

  // 7-Stage Reconciliation Table Dataset
  const reconciliationData = useMemo(() => {
    return harvestBatches.filter((b) => !b.isVoid && matchesPeriod(b.harvestDate || b.date)).map((hv) => {
      // Find matching downstream records
      const d1 = dispatch1Records.find((d) => !d.isVoid && d.lines.some((l) => l.harvestBatchRef === hv.batchRef));
      const grd = gradings.find((g) => !g.isVoid && g.harvestBatchRef === hv.batchRef);
      const pckList = packingBatches.filter((p) => !p.isVoid && p.harvestBatchRef === hv.batchRef);
      const totalPackedBunches = pckList.reduce((s, p) => s + p.bunchesCount, 0);
      const totalPackedStems = pckList.reduce((s, p) => s + p.totalStemsPacked, 0);

      const d2List = dispatch2Records.filter((d) => !d.isVoid && d.lines.some((l) => l.harvestBatchRef === hv.batchRef));
      const totalAuctionBunches = d2List.reduce((s, d) => s + (d.totalBunchesDispatched ?? d.totalBunchesSent ?? 0), 0);

      const arList = auctionRealizations.filter((r) => !r.isVoid && r.lines.some((l) => l.harvestBatchRef === hv.batchRef));
      const totalSoldBunches = arList.reduce((s, r) => s + (r.totalBunchesSold ?? 0), 0);
      const totalUnsoldBunches = arList.reduce((s, r) => s + (r.totalBunchesUnsold ?? 0), 0);
      const totalGross = arList.reduce((s, r) => s + (r.totalGrossRealization ?? r.totalGrossValue ?? 0), 0);
      const totalNet = arList.reduce((s, r) => s + (r.netRealization ?? r.totalNetRealization ?? 0), 0);

      const primaryVariety = hv.lines.map((l) => l.varietyName).join(", ");

      return {
        harvestBatchRef: hv.batchRef,
        polyhouseName: hv.polyhouseName,
        variety: primaryVariety,
        harvestDate: hv.harvestDate,
        harvestBuckets: hv.totalBuckets,
        harvestStems: hv.totalEstimatedStems,
        // Dispatch 1
        dispatch1Ref: d1?.dispatchRef,
        d1BucketsSent: d1?.totalBucketsDispatched ?? d1?.totalBucketsSent ?? 0,
        d1BucketsReceived: d1?.totalBucketsReceived ?? d1?.totalBucketsDispatched ?? d1?.totalBucketsSent ?? 0,
        d1Discrepancy: d1?.status === "discrepancy_flagged",
        // Grading
        gradingRef: grd?.gradingRef,
        gradedStems: grd?.totalGradedStems || 0,
        rejectedStems: grd?.rejectedStems || 0,
        unexplainedStems: grd?.unexplainedVariance || 0,
        // Packing
        packedBunches: totalPackedBunches,
        packedStems: totalPackedStems,
        // Dispatch 2
        auctionBunchesSent: totalAuctionBunches,
        // Realization
        soldBunches: totalSoldBunches,
        unsoldBunches: totalUnsoldBunches,
        grossRealization: totalGross,
        netRealization: totalNet,
        status: arList.length > 0 ? "Settled" : d2List.length > 0 ? "At Auction" : pckList.length > 0 ? "Packed" : grd ? "Graded" : d1 ? "In Transit" : "Harvested",
      };
    });
  }, [harvestBatches, dispatch1Records, gradings, packingBatches, dispatch2Records, auctionRealizations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              Complete Traceability System
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Harvest → Dispatch 1 → Grading → Packing → Dispatch 2 → Auction Realization
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            End-to-End Flower Traceability & Reconciliation
          </h1>
          <p className="text-xs text-slate-500">
            Inspect the complete lineage of any flower batch from greenhouse harvest to final auction revenue settlement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("explorer")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "explorer"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Lineage Explorer
            </button>
            <button
              onClick={() => setActiveTab("reconciliation")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "reconciliation"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>7-Stage Quantity Reconciliation</span>
            </button>
            <button
              onClick={() => setActiveTab("economics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "economics"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Realization Analytics</span>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Trace Audit</span>
          </button>
        </div>
      </div>

      {/* 15 Consolidated KPIs Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase">1. Total Harvest</p>
          <p className="text-xl font-black text-rose-900 mt-0.5">{formatNumber(traceabilityKPIs.totalBucketsHarvested)}</p>
          <p className="text-[10px] text-slate-400">Buckets (~{formatNumber(traceabilityKPIs.totalEstimatedStems)} stems)</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase">2. Farm Transfer</p>
          <p className="text-xl font-black text-blue-900 mt-0.5">{formatNumber(traceabilityKPIs.totalBucketsDispatched1)}</p>
          <p className="text-[10px] text-slate-400">{traceabilityKPIs.totalBucketsReceivedProcessing} confirmed at farm</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase">3. Graded Stems</p>
          <p className="text-xl font-black text-purple-900 mt-0.5">{formatNumber(traceabilityKPIs.totalGradedStems)}</p>
          <p className="text-[10px] text-rose-600 font-semibold">{traceabilityKPIs.totalRejectedStems} culls accounted</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase">4. Bunches Packed</p>
          <p className="text-xl font-black text-emerald-900 mt-0.5">{formatNumber(traceabilityKPIs.totalBunchesPacked)}</p>
          <p className="text-[10px] text-emerald-700 font-semibold">{traceabilityKPIs.packedBunchesAwaitingDispatch} awaiting dispatch</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase">5. Market Sent</p>
          <p className="text-xl font-black text-blue-900 mt-0.5">{formatNumber(traceabilityKPIs.totalBunchesDispatchedAuction)}</p>
          <p className="text-[10px] text-slate-400">{traceabilityKPIs.totalBunchesSold} sold / {traceabilityKPIs.totalBunchesUnsold} unsold</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-800 uppercase">6. Net Realized</p>
          <p className="text-xl font-black text-emerald-950 mt-0.5">{formatCurrency(traceabilityKPIs.totalNetRealization)}</p>
          <p className="text-[10px] text-emerald-700 font-bold">Gross: {formatCurrency(traceabilityKPIs.totalGrossRealization)}</p>
        </div>
      </div>

      {/* LINEAGE EXPLORER TAB */}
      {activeTab === "explorer" && (
        <div className="space-y-6">
          {/* Batch Selector / Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter any batch ID (HV-..., DSP1-..., GRD-..., PCK-..., DSP2-..., AR-...)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Trace Journey
              </button>
            </form>

            {/* Quick Batch Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Quick Pick:</span>
              {harvestBatches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBatchRef(b.batchRef);
                    setSearchInput(b.batchRef);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-all cursor-pointer ${
                    selectedBatchRef === b.batchRef
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {b.batchRef} ({b.polyhouseName})
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Visual Traceability Journey Tree */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                  Batch Traceability Verification Tree
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  Journey for: <span className="font-mono text-emerald-800">{selectedBatchRef}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Full lineage connecting greenhouse harvest through grading, packing, and auction price realization
                </p>
              </div>

              {lineage.realizationsList[0] && (
                <div className="text-right bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Net Realized Revenue</span>
                  <span className="text-lg font-black text-emerald-900">
                    {formatCurrency(lineage.realizationsList.reduce((s, r) => s + (r.netRealization ?? r.totalNetRealization ?? 0), 0))}
                  </span>
                </div>
              )}
            </div>

            {/* Stage-by-Stage Journey Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* STAGE 1: Polyhouse & Harvest */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border-2 border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 text-[10px] font-extrabold uppercase">
                    Stage 1 • Harvest
                  </span>
                  <Flower2 className="w-4 h-4 text-rose-600" />
                </div>

                {lineage.harvest ? (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-mono font-black text-slate-900 text-sm">{lineage.harvest.batchRef}</p>
                    <p className="text-slate-600">
                      Polyhouse: <strong className="text-slate-900 font-bold">{lineage.harvest.polyhouseName}</strong>
                    </p>
                    <p className="text-slate-600">
                      Date: <span className="text-slate-800 font-semibold">{formatDate(lineage.harvest.harvestDate)}</span> at {lineage.harvest.harvestTime || "06:30"}
                    </p>
                    <div className="p-2 bg-white rounded-xl border border-rose-200 space-y-1">
                      {lineage.harvest.lines.map((l) => (
                        <div key={l.id} className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-800">{l.varietyName}</span>
                          <span className="font-mono font-bold text-rose-700">{l.bucketsHarvested} buckets ({l.totalStemsHarvested} stems)</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] font-bold text-rose-950 pt-1">
                      Total: {lineage.harvest.totalBuckets} Buckets (~{formatNumber(lineage.harvest.totalEstimatedStems)} stems)
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No direct harvest batch matched</p>
                )}
              </div>

              {/* STAGE 2: Dispatch 1 Farm Transfer */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border-2 border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-blue-200 text-blue-900 text-[10px] font-extrabold uppercase">
                    Stage 2 • Farm Transfer
                  </span>
                  <Truck className="w-4 h-4 text-blue-600" />
                </div>

                {lineage.dispatch1List.length > 0 ? (
                  lineage.dispatch1List.map((d1) => (
                    <div key={d1.id} className="space-y-1.5 text-xs">
                      <p className="font-mono font-black text-slate-900 text-sm">{d1.dispatchRef}</p>
                      <p className="text-slate-600">
                        Route: <strong className="text-slate-800">{d1.sourceFarmName}</strong> → <strong className="text-blue-700">{d1.destinationFarmName}</strong>
                      </p>
                      <div className="p-2 bg-white rounded-xl border border-blue-200 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Buckets Sent:</span>
                          <span className="font-bold text-blue-700">{d1.totalBucketsDispatched} buckets</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Buckets Received:</span>
                          <span className="font-bold text-emerald-700">{d1.totalBucketsReceived || d1.totalBucketsDispatched} buckets</span>
                        </div>
                        {d1.status === "discrepancy_flagged" && (
                          <p className="text-[10px] font-bold text-rose-700">⚠ Discrepancy logged by receiving supervisor</p>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Status: <strong className="text-slate-800">{d1.status.toUpperCase()}</strong></p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Pending Dispatch 1 transfer</p>
                )}
              </div>

              {/* STAGE 3: Stem-Length Grading */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border-2 border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 text-[10px] font-extrabold uppercase">
                    Stage 3 • Stem Grading
                  </span>
                  <Split className="w-4 h-4 text-purple-600" />
                </div>

                {lineage.gradingsList.length > 0 ? (
                  lineage.gradingsList.map((grd) => (
                    <div key={grd.id} className="space-y-1.5 text-xs">
                      <p className="font-mono font-black text-slate-900 text-sm">{grd.gradingRef}</p>
                      <p className="text-slate-600">
                        Facility: <strong className="text-slate-800">{grd.processingFarmName}</strong>
                      </p>
                      <div className="p-2 bg-white rounded-xl border border-purple-200 space-y-1">
                        {grd.lines.map((l) => (
                          <div key={l.id} className="flex justify-between text-[11px]">
                            <span className="text-slate-600">{l.stemLengthCategoryName}</span>
                            <span className="font-bold text-purple-800">{formatNumber(l.stemsCount ?? l.stemsGraded ?? 0)} stems</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[11px] pt-1">
                        <span className="font-bold text-purple-900">Total Graded: {formatNumber(grd.totalGradedStems)}</span>
                        <span className="text-rose-700 font-bold">Culls: {grd.rejectedStems}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Pending stem-length grading</p>
                )}
              </div>

              {/* STAGE 4: Bunch Packing */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border-2 border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-[10px] font-extrabold uppercase">
                    Stage 4 • Bunch Packing
                  </span>
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                </div>

                {lineage.packingList.length > 0 ? (
                  lineage.packingList.map((pck) => (
                    <div key={pck.id} className="space-y-1.5 text-xs">
                      <p className="font-mono font-black text-slate-900 text-sm">{pck.packingRef}</p>
                      <p className="text-slate-600">
                        Variety: <strong className="text-slate-800">{pck.varietyName}</strong> ({pck.stemLengthCategoryName})
                      </p>
                      <div className="p-2 bg-white rounded-xl border border-emerald-200 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Spec:</span>
                          <span className="font-bold text-slate-800">{pck.stemsPerBunch} stems / bunch</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Prepared Bunches:</span>
                          <span className="font-black text-emerald-800">{pck.bunchesCount} bunches</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Stems Packed:</span>
                          <span className="font-bold text-slate-900">{formatNumber(pck.totalStemsPacked)} stems</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Master Boxes:</span>
                          <span className="font-bold text-slate-700">{pck.cartonsCount || 1} Cartons</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Pending bunch formation</p>
                )}
              </div>

              {/* STAGE 5: Dispatch 2 to Auction */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border-2 border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-blue-200 text-blue-900 text-[10px] font-extrabold uppercase">
                    Stage 5 • Auction Dispatch
                  </span>
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>

                {lineage.dispatch2List.length > 0 ? (
                  lineage.dispatch2List.map((d2) => (
                    <div key={d2.id} className="space-y-1.5 text-xs">
                      <p className="font-mono font-black text-slate-900 text-sm">{d2.dispatch2Ref}</p>
                      <p className="text-slate-600">
                        Destination: <strong className="text-blue-700 font-bold">{d2.auctionCentreName}</strong>
                      </p>
                      <div className="p-2 bg-white rounded-xl border border-blue-200 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bunches Dispatched:</span>
                          <span className="font-black text-blue-900">{d2.totalBunchesDispatched ?? d2.totalBunchesSent ?? 0} bunches</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Stems:</span>
                          <span className="font-bold text-slate-900">{formatNumber(d2.totalStemsDispatched ?? d2.totalStemsSent ?? 0)} stems</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Status:</span>
                          <span className="font-bold uppercase text-slate-800">{d2.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Pending market dispatch</p>
                )}
              </div>

              {/* STAGE 6: Auction Realization & Revenue */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-300 text-emerald-950 text-[10px] font-extrabold uppercase">
                    Stage 6 • Settlement
                  </span>
                  <BadgeIndianRupee className="w-4 h-4 text-emerald-700" />
                </div>

                {lineage.realizationsList.length > 0 ? (
                  lineage.realizationsList.map((ar) => (
                    <div key={ar.id} className="space-y-1.5 text-xs">
                      <p className="font-mono font-black text-slate-900 text-sm">{ar.realizationRef}</p>
                      <p className="text-slate-600">
                        Auction: <strong className="text-slate-900">{ar.auctionCentreName}</strong> {ar.auctionLotRef && `(Lot: ${ar.auctionLotRef})`}
                      </p>
                      <div className="p-2 bg-white rounded-xl border border-emerald-300 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bunches Sold:</span>
                          <span className="font-bold text-emerald-800">{ar.totalBunchesSold} of {ar.totalBunchesSent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Gross Sale Value:</span>
                          <span className="font-black text-slate-900">{formatCurrency(ar.totalGrossRealization ?? ar.totalGrossValue ?? 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Deductions (Comm + Hall):</span>
                          <span className="font-bold text-amber-800">-₹{(ar.auctionCommission ?? ar.totalCommission ?? 0) + (ar.otherCharges ?? ar.totalOtherCharges ?? 0)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1 font-black text-emerald-900 text-xs">
                          <span>Net Revenue Realized:</span>
                          <span>{formatCurrency(ar.netRealization ?? ar.totalNetRealization ?? 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Awaiting auction sale statement</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-STAGE QUANTITY RECONCILIATION TABLE TAB */}
      {activeTab === "reconciliation" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h2 className="text-base font-bold text-slate-900">7-Stage Quantity & Revenue Reconciliation Matrix</h2>
            <p className="text-xs text-slate-500">
              Complete multi-stage accountability: verifying that harvested buckets are tracked into dispatched, received, graded, packed, and sold quantities without unexplained loss.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold text-[11px]">
                  <th className="py-3 px-3">Harvest Batch</th>
                  <th className="py-3 px-3">Polyhouse & Variety</th>
                  <th className="py-3 px-3 text-right">Harvest (Bkts)</th>
                  <th className="py-3 px-3 text-right">Disp 1 (Sent)</th>
                  <th className="py-3 px-3 text-right">Farm Recv</th>
                  <th className="py-3 px-3 text-right">Graded Stems</th>
                  <th className="py-3 px-3 text-right">Packed (Bch)</th>
                  <th className="py-3 px-3 text-right">Auction Sent</th>
                  <th className="py-3 px-3 text-right">Sold (Bch)</th>
                  <th className="py-3 px-3 text-right">Unsold</th>
                  <th className="py-3 px-3 text-right">Gross (₹)</th>
                  <th className="py-3 px-3 text-right font-black">Net Realized</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reconciliationData.map((row) => (
                  <tr key={row.harvestBatchRef} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <button
                        onClick={() => {
                          setSelectedBatchRef(row.harvestBatchRef);
                          setActiveTab("explorer");
                        }}
                        className="text-rose-700 hover:underline cursor-pointer"
                      >
                        {row.harvestBatchRef}
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{row.variety}</span>
                      <span className="block text-[10px] text-slate-400">{row.polyhouseName}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-rose-700">
                      {row.harvestBuckets} bkt
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-blue-700">
                      {row.d1BucketsSent > 0 ? `${row.d1BucketsSent} bkt` : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {row.d1BucketsReceived > 0 ? `${row.d1BucketsReceived} bkt` : "—"}
                      {row.d1Discrepancy && (
                        <span className="block text-[9px] text-rose-600 font-extrabold">Variance</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-purple-900">
                      {row.gradedStems > 0 ? formatNumber(row.gradedStems) : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-800">
                      {row.packedBunches > 0 ? `${row.packedBunches} bch` : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-blue-900">
                      {row.auctionBunchesSent > 0 ? `${row.auctionBunchesSent} bch` : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-900">
                      {row.soldBunches > 0 ? `${row.soldBunches} bch` : "—"}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      {row.unsoldBunches > 0 ? (
                        <span className="text-rose-700 font-bold">{row.unsoldBunches}</span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {row.grossRealization > 0 ? formatCurrency(row.grossRealization) : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-800 text-sm">
                      {row.netRealization > 0 ? formatCurrency(row.netRealization) : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        row.status === "Settled"
                          ? "bg-emerald-100 text-emerald-800"
                          : row.status === "At Auction"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REALIZATION ECONOMICS TAB */}
      {activeTab === "economics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Average Price Realized per Variety</h3>
              <p className="text-xs text-slate-500">Benchmarked auction price per bunch across varieties</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={varieties.map((v) => {
                    const lines = auctionRealizations.flatMap((r) => r.lines || []).filter((l) => l.varietyId === v.id);
                    const sold = lines.reduce((s, l) => s + l.bunchesSold, 0);
                    const gross = lines.reduce((s, l) => s + (l.grossRealization ?? l.grossSaleValue ?? 0), 0);
                    const avg = sold > 0 ? Math.round(gross / sold) : 0;
                    return { name: v.name, avgPrice: avg };
                  })}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`₹${val} / bunch`, "Avg Realization"]}
                    contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", color: "#FFF", fontSize: "12px" }}
                  />
                  <Bar dataKey="avgPrice" name="Avg Price (₹)" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Harvest to Auction Yield Efficiency</h3>
              <p className="text-xs text-slate-500">Conversion of field cuts to finalized revenue</p>
            </div>
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-emerald-950 block">Harvest to Sale Conversion</span>
                  <span className="text-[10px] text-emerald-700">Effective bunches sold from initial harvest buckets</span>
                </div>
                <span className="text-lg font-black text-emerald-900">
                  {traceabilityKPIs.totalBucketsHarvested > 0
                    ? ((traceabilityKPIs.totalBunchesSold / (traceabilityKPIs.totalBucketsHarvested * 5)) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-blue-950 block">Sell-Through Rate at Auction</span>
                  <span className="text-[10px] text-blue-700">Bunches sold divided by bunches sent to auction</span>
                </div>
                <span className="text-lg font-black text-blue-900">
                  {traceabilityKPIs.totalBunchesDispatchedAuction > 0
                    ? ((traceabilityKPIs.totalBunchesSold / traceabilityKPIs.totalBunchesDispatchedAuction) * 100).toFixed(1)
                    : 100}%
                </span>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-purple-950 block">Average Net Realization / Harvest Bucket</span>
                  <span className="text-[10px] text-purple-700">Financial return per bucket cut from greenhouse</span>
                </div>
                <span className="text-lg font-black text-purple-900">
                  ₹{traceabilityKPIs.totalBucketsHarvested > 0
                    ? Math.round(traceabilityKPIs.totalNetRealization / traceabilityKPIs.totalBucketsHarvested)
                    : 0} / bucket
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
