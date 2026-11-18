"use client";

import React, { useState } from "react";
import {
  Grid3X3,
  Plus,
  Flower2,
  Calendar,
  Trash2,
  Edit2,
  Sparkles,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useFarm } from "@/lib/store";
import { formatNumber } from "@/lib/formatters";

export default function FarmPage() {
  const {
    polyhouses,
    varieties,
    addPolyhouse,
    updatePolyhouse,
    deletePolyhouse,
    assignVarietyToPolyhouse,
    removeVarietyFromPolyhouse,
    harvests,
  } = useFarm();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPolyId, setEditingPolyId] = useState<string | null>(null);
  const [selectedPolyToAddVariety, setSelectedPolyToAddVariety] = useState<string | null>(null);
  const [varietyToAssign, setVarietyToAssign] = useState(varieties[0]?.id || "");

  const [name, setName] = useState("");
  const [areaSqm, setAreaSqm] = useState("3000");
  const [varietyId, setVarietyId] = useState(varieties[0]?.id || "");
  const [plantCount, setPlantCount] = useState("23000");

  const totalFarmArea = polyhouses.reduce((sum, p) => sum + p.areaSqm, 0);

  const handleSavePolyhouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedVar = varieties.find((v) => v.id === varietyId);
    const varName = selectedVar ? `${selectedVar.name} (${selectedVar.color})` : "Roses";

    if (editingPolyId) {
      updatePolyhouse(editingPolyId, {
        name: name.trim(),
        areaSqm: parseFloat(areaSqm) || 3000,
        varietyId,
        varietyName: varName,
        plantCount: parseInt(plantCount) || 23000,
      });
      setEditingPolyId(null);
    } else {
      addPolyhouse({
        name: name.trim(),
        blockId: "b-01",
        blockName: "Block A",
        areaSqm: parseFloat(areaSqm) || 3000,
        varietyId,
        varietyName: varName,
        plantCount: parseInt(plantCount) || 23000,
        status: "active",
        isActive: true,
      });
      setIsAddOpen(false);
    }

    setName("");
  };

  const startEdit = (ph: typeof polyhouses[0]) => {
    setEditingPolyId(ph.id);
    setName(ph.name);
    setAreaSqm(ph.areaSqm.toString());
    setVarietyId(ph.varietyId || varieties[0]?.id || "");
    setPlantCount((ph.plantCount || 23000).toString());
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase">
              Farm Layout & Infrastructure
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Polyhouse Setup & Variety Allocations
          </h1>
          <p className="text-xs text-slate-500">
            {polyhouses.length} Active Polyhouses • {totalFarmArea.toLocaleString()} sqm Protected Area (Late October Harvest Ready)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPolyId(null);
            setName(`PH-${polyhouses.length + 1}`);
            setIsAddOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Polyhouse</span>
        </button>
      </div>

      {/* Polyhouse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {polyhouses.map((ph) => {
          const phHarvests = harvests.filter((h) => !h.isVoid && h.polyhouseId === ph.id);
          const totalGoodStems = phHarvests.reduce((sum, h) => sum + h.totalGoodStems, 0);

          return (
            <div
              key={ph.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    PH
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{ph.name}</h3>
                    <p className="text-xs text-slate-500">{ph.areaSqm} sqm protected area</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEdit(ph)}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                    title="Edit Polyhouse"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${ph.name}?`)) deletePolyhouse(ph.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Delete Polyhouse"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Multi-variety Section */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-bold flex items-center gap-1.5">
                    <Flower2 className="w-4 h-4 text-rose-600" />
                    Planted Flower Varieties ({ph.varieties?.length || 1}):
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPolyToAddVariety(ph.id);
                      setVarietyToAssign(varieties[0]?.id || "");
                    }}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Variety</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ph.varieties && ph.varieties.length > 0 ? (
                    ph.varieties.map((v) => (
                      <span
                        key={v.varietyId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-800 shadow-2xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>{v.varietyName}</span>
                        {ph.varieties && ph.varieties.length > 1 && (
                          <button
                            onClick={() => removeVarietyFromPolyhouse(ph.id, v.varietyId)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5 font-bold"
                            title="Remove variety from polyhouse"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-white text-slate-800 font-bold">
                      {ph.varietyName}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
                  <span>Plant Population: ~{ph.plantCount || 23000} plants</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    Late October Flush
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Harvest Recorded:</span>
                <span className="font-bold text-emerald-700">{formatNumber(totalGoodStems)} stems</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD VARIETY TO POLYHOUSE MODAL */}
      {selectedPolyToAddVariety && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-sm">Add Variety to Polyhouse</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-bold">Select Flower Variety *</label>
                <select
                  value={varietyToAssign}
                  onChange={(e) => setVarietyToAssign(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold bg-white"
                >
                  {varieties.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.color})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPolyToAddVariety(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    assignVarietyToPolyhouse(selectedPolyToAddVariety, varietyToAssign);
                    setSelectedPolyToAddVariety(null);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Add to Polyhouse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Polyhouse Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              {editingPolyId ? "Edit Polyhouse Details" : "Add New Polyhouse"}
            </h3>
            <form onSubmit={handleSavePolyhouse} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Polyhouse Name / Code *</label>
                <input
                  type="text"
                  placeholder="e.g. PH-1 (Taj Mahal)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Area (sqm) *</label>
                  <input
                    type="number"
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Plant Count</label>
                  <input
                    type="number"
                    value={plantCount}
                    onChange={(e) => setPlantCount(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Flower Variety Grown *</label>
                <select
                  value={varietyId}
                  onChange={(e) => setVarietyId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-medium"
                >
                  {varieties.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.color})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Save Polyhouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
