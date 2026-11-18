"use client";

import React, { useState } from "react";
import {
  Settings,
  Users,
  Flower2,
  Grid3X3,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Download,
  CheckCircle2,
  Lock,
  Unlock,
  Building,
  UserPlus,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Phone,
  Mail,
  IndianRupee,
  X,
  AlertCircle,
} from "lucide-react";
import { useFarm } from "@/lib/store";
import { UserRole, UserProfile, Partner } from "@/lib/types";
import { formatINR } from "@/lib/formatters";

export default function SettingsPage() {
  const {
    currentUser,
    settings,
    updateSettings,
    users,
    addUser,
    updateUser,
    deleteUser,
    partners,
    addPartner,
    updatePartner,
    deletePartner,
    varieties,
    addVariety,
    deleteVariety,
    polyhouses,
    addPolyhouse,
    deletePolyhouse,
    farms,
    addFarm,
    updateFarm,
    deleteFarm,
    auctionCentres,
    addAuctionCentre,
    updateAuctionCentre,
    deleteAuctionCentre,
    stemLengthCategories,
    addStemLengthCategory,
    updateStemLengthCategory,
    deleteStemLengthCategory,
    bunchSizes,
    addBunchSize,
    updateBunchSize,
    deleteBunchSize,
    clearAllTransactionsToZero,
    loadSamplePracticeData,
    resetAllToDefault,
    isCloud,
    downloadBackup,
    resetUserPassword,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<
    "users" | "partners" | "varieties" | "polyhouses" | "farms" | "auctions" | "stemlengths" | "defaults"
  >("users");

  // General settings state
  const [farmName, setFarmName] = useState(settings.farmName);
  const [stemsPerBunch, setStemsPerBunch] = useState(settings.stemsPerBunch);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [challanPrefix, setChallanPrefix] = useState(settings.challanPrefix);
  const [isMonthLocked, setIsMonthLocked] = useState(settings.isMonthLocked);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  // User View & Edit Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("supervisor");
  const [userPartnerId, setUserPartnerId] = useState("");
  const [userIsActive, setUserIsActive] = useState(true);

  // Partner form modal (Share in Amount INR only)
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerFamily, setPartnerFamily] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerAmount, setPartnerAmount] = useState(""); // Amount INR

  // Variety form modal
  const [isVarietyModalOpen, setIsVarietyModalOpen] = useState(false);
  const [varietyName, setVarietyName] = useState("");
  const [varietyColor, setVarietyColor] = useState("Red");
  const [varietyHex, setVarietyHex] = useState("#DC2626");
  const [varietyNote, setVarietyNote] = useState("");

  // Polyhouse form modal
  const [isPolyModalOpen, setIsPolyModalOpen] = useState(false);
  const [polyName, setPolyName] = useState("");
  const [polyArea, setPolyArea] = useState("3000");
  const [polyVarietyId, setPolyVarietyId] = useState(varieties[0]?.id || "");
  const [polyPlants, setPolyPlants] = useState("23000");

  // Farm entity modal
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [farmModalName, setFarmModalName] = useState("");
  const [farmModalRole, setFarmModalRole] = useState<"production" | "processing" | "aggregator">("processing");
  const [farmModalLocation, setFarmModalLocation] = useState("");
  const [farmModalContact, setFarmModalContact] = useState("");

  // Auction centre modal
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
  const [aucModalName, setAucModalName] = useState("");
  const [aucModalCity, setAucModalCity] = useState("");
  const [aucModalState, setAucModalState] = useState("Karnataka");
  const [aucModalPhone, setAucModalPhone] = useState("");

  // Stem length modal
  const [isStemModalOpen, setIsStemModalOpen] = useState(false);
  const [stemCatName, setStemCatName] = useState("");
  const [stemMinCm, setStemMinCm] = useState("40");
  const [stemMaxCm, setStemMaxCm] = useState("50");

  // Bunch size modal
  const [isBunchModalOpen, setIsBunchModalOpen] = useState(false);
  const [bunchConfigName, setBunchConfigName] = useState("");
  const [bunchStemsCount, setBunchStemsCount] = useState("10");

  const totalCommittedAll = partners.reduce((sum, p) => sum + (p.committedAmount || 0), 0);

  // Handle Saves
  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      farmName,
      stemsPerBunch: Number(stemsPerBunch),
      invoicePrefix,
      challanPrefix,
      isMonthLocked,
    });
    showToast("Farm settings updated successfully!");
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    const partner = partners.find((p) => p.id === userPartnerId);

    if (editingUserId) {
      const newPass = userPassword.trim();
      if (isCloud && newPass) {
        if (newPass.length < 8) {
          showToast("A new password needs at least 8 characters.");
          return;
        }
        const r = await resetUserPassword(userEmail.trim().toLowerCase(), newPass);
        if (!r.success) {
          showToast(r.error || "Could not set the new password.");
          return;
        }
      }
      updateUser(editingUserId, {
        fullName: userName.trim(),
        phone: userPhone.trim() || undefined,
        role: userRole,
        partnerId: userRole === "partner" ? userPartnerId : undefined,
        partnerName: userRole === "partner" ? partner?.name : undefined,
        isActive: userIsActive,
      });
      showToast(isCloud && newPass ? `${userName} updated with a new password. Share it with them.` : `User ${userName} profile updated!`);
      setEditingUserId(null);
    } else {
      if (isCloud && userPassword.trim().length < 8) {
        showToast("Please set a password of at least 8 characters.");
        return;
      }
      const res = await addUser({
        fullName: userName.trim(),
        email: userEmail.trim().toLowerCase(),
        password: userPassword.trim() || "Password@123",
        phone: userPhone.trim() || undefined,
        role: userRole,
        partnerId: userRole === "partner" ? userPartnerId : undefined,
        partnerName: userRole === "partner" ? partner?.name : undefined,
        isActive: true,
      });
      if (!res.success) {
        showToast(res.error || "Could not create this user.");
        return;
      }
      showToast(isCloud ? `${userName} added. Share the email and password with them.` : `User ${userName} created with login password!`);
    }

    setIsUserModalOpen(false);
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserPhone("");
  };

  const startEditUser = (u: UserProfile) => {
    setEditingUserId(u.id);
    setUserName(u.fullName);
    setUserEmail(u.email);
    setUserPassword(isCloud ? "" : u.password || "Password@123");
    setUserPhone(u.phone || "");
    setUserRole(u.role);
    setUserPartnerId(u.partnerId || "");
    setUserIsActive(u.isActive);
    setIsUserModalOpen(true);
  };

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) return;
    const amountNum = parseFloat(partnerAmount) || 0;

    if (editingPartnerId) {
      updatePartner(editingPartnerId, {
        name: partnerName.trim(),
        familyGroup: partnerFamily.trim() || `${partnerName} Family`,
        phone: partnerPhone.trim() || "",
        email: partnerEmail.trim() || "",
        committedAmount: amountNum,
      });
      showToast(`Partner ${partnerName} share updated to ${formatINR(amountNum)}!`);
      setEditingPartnerId(null);
    } else {
      addPartner({
        name: partnerName.trim(),
        familyGroup: partnerFamily.trim() || `${partnerName} Family`,
        phone: partnerPhone.trim() || "",
        email: partnerEmail.trim() || "",
        committedAmount: amountNum,
        isActive: true,
      });
      showToast(`Partner ${partnerName} created with share of ${formatINR(amountNum)}!`);
    }

    setIsPartnerModalOpen(false);
    setPartnerName("");
    setPartnerFamily("");
    setPartnerPhone("");
    setPartnerEmail("");
    setPartnerAmount("");
  };

  const startEditPartner = (p: Partner) => {
    setEditingPartnerId(p.id);
    setPartnerName(p.name);
    setPartnerFamily(p.familyGroup);
    setPartnerPhone(p.phone);
    setPartnerEmail(p.email);
    setPartnerAmount(p.committedAmount.toString());
    setIsPartnerModalOpen(true);
  };

  const handleAddVariety = (e: React.FormEvent) => {
    e.preventDefault();
    if (!varietyName.trim()) return;

    addVariety({
      name: varietyName.trim(),
      color: varietyColor.trim(),
      hexCode: varietyHex,
      stemLengthNote: varietyNote.trim() || undefined,
      isActive: true,
    });

    setIsVarietyModalOpen(false);
    setVarietyName("");
    setVarietyNote("");
    showToast(`Flower variety ${varietyName} added!`);
  };

  const handleAddPolyhouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!polyName.trim()) return;

    const selectedVar = varieties.find((v) => v.id === polyVarietyId);

    addPolyhouse({
      name: polyName.trim(),
      blockId: "b-01",
      blockName: "Block A",
      areaSqm: parseFloat(polyArea) || 3000,
      varietyId: polyVarietyId,
      varietyName: selectedVar ? `${selectedVar.name} (${selectedVar.color})` : "Roses",
      plantCount: parseInt(polyPlants) || 23000,
      status: "active",
      isActive: true,
    });

    setIsPolyModalOpen(false);
    setPolyName("");
    showToast(`Polyhouse ${polyName} added!`);
  };

  const handleAddFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmModalName.trim()) return;
    addFarm({
      code: "FRM-" + Date.now().toString().slice(-4),
      name: farmModalName.trim(),
      role: farmModalRole,
      location: farmModalLocation.trim() || undefined,
      phone: farmModalContact.trim() || undefined,
      isActive: true,
    });
    setIsFarmModalOpen(false);
    setFarmModalName("");
    showToast(`Farm entity ${farmModalName} created!`);
  };

  const handleAddAuction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aucModalName.trim()) return;
    addAuctionCentre({
      name: aucModalName.trim(),
      city: aucModalCity.trim() || "Bangalore",
      state: aucModalState.trim() || "Karnataka",
      phone: aucModalPhone.trim() || undefined,
      isActive: true,
    });
    setIsAuctionModalOpen(false);
    setAucModalName("");
    showToast(`Auction centre ${aucModalName} registered!`);
  };

  const handleAddStemLength = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stemCatName.trim()) return;
    addStemLengthCategory({
      name: stemCatName.trim(),
      minLengthCm: parseInt(stemMinCm) || 30,
      maxLengthCm: parseInt(stemMaxCm) || 40,
      isActive: true,
    });
    setIsStemModalOpen(false);
    setStemCatName("");
    showToast(`Stem length category ${stemCatName} added!`);
  };

  const handleAddBunchSize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bunchConfigName.trim()) return;
    addBunchSize({
      name: bunchConfigName.trim(),
      stemsPerBunch: parseInt(bunchStemsCount) || 10,
      isActive: true,
    });
    setIsBunchModalOpen(false);
    setBunchConfigName("");
    showToast(`Bunch specification ${bunchConfigName} saved!`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase">
              Farm Control Center
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Customization & Masters Hub</h1>
          <p className="text-xs text-slate-500">Manage user logins, passwords, partner INR shares, flower varieties, and polyhouses</p>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs animate-in fade-in">
          ✓ {toastMessage}
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "users"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>Team ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("partners")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "partners"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Building className="w-3.5 h-3.5 text-blue-400" />
          <span>Partner Share ({partners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("varieties")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "varieties"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Flower2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Varieties ({varieties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("polyhouses")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "polyhouses"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5 text-teal-400" />
          <span>Polyhouses ({polyhouses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("farms")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "farms"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Building className="w-3.5 h-3.5 text-amber-500" />
          <span>Farms ({farms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("auctions")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "auctions"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Building className="w-3.5 h-3.5 text-purple-400" />
          <span>Auction Centres ({auctionCentres.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stemlengths")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "stemlengths"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-indigo-400" />
          <span>Stem Lengths & Bunch Sizes</span>
        </button>

        <button
          onClick={() => setActiveTab("defaults")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "defaults"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>Defaults & Reset</span>
        </button>
      </div>

      {/* TAB 1: USERS & PASSWORDS */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Team Login Accounts & Password Management</h2>
              <p className="text-xs text-slate-500">View team members, edit credentials, set passwords, and assign role privileges</p>
            </div>
            <button
              onClick={() => {
                setEditingUserId(null);
                setUserName("");
                setUserEmail("");
                setUserPassword("Password@123");
                setUserPhone("");
                setUserRole("supervisor");
                setIsUserModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Login Email</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4">Role Assigned</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const adminCount = users.filter((x) => x.role === "admin").length;
                  const isSoleAdmin = u.role === "admin" && adminCount <= 1;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#1F3A2B] text-[#B89B5E] flex items-center justify-center font-bold text-[11px] shrink-0">
                            {u.fullName.charAt(0)}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{u.fullName}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black uppercase">
                                You
                              </span>
                            )}
                            {!u.isActive && (
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase">
                                No access
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{u.email}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                          ••••••••
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : u.role === "partner"
                              ? "bg-blue-100 text-blue-800"
                              : u.role === "supervisor"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{u.phone || "—"}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingUser(u)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-[11px] font-semibold cursor-pointer"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => startEditUser(u)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                            title="Edit User Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isSelf || isSoleAdmin ? (
                            <button
                              disabled
                              className="p-1 rounded text-slate-300 cursor-not-allowed"
                              title={
                                isSelf
                                  ? "Cannot delete your own active login session"
                                  : "Cannot delete the sole remaining Administrator"
                              }
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm(`Remove login access for ${u.fullName}?`)) deleteUser(u.id);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PARTNER MANAGEMENT (SHARE IN AMOUNT INR ONLY) */}
      {activeTab === "partners" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Partner Capital Commitment (Amount in INR)</h2>
              <p className="text-xs text-slate-500">Every partner&apos;s share is recorded and displayed in Amount (₹ INR) only</p>
            </div>
            <button
              onClick={() => {
                setEditingPartnerId(null);
                setPartnerName("");
                setPartnerFamily("");
                setPartnerPhone("");
                setPartnerEmail("");
                setPartnerAmount("");
                setIsPartnerModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Partner</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
            <span className="font-semibold">Total Capital Pool Committed across all partners:</span>
            <span className="text-base font-black text-blue-950">{formatINR(totalCommittedAll)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Partner Name</th>
                  <th className="py-3 px-4">Family Group</th>
                  <th className="py-3 px-4 text-right">Committed Share (Amount in INR)</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {partners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.familyGroup}</td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-900 text-sm">
                      {formatINR(p.committedAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{p.phone}</td>
                    <td className="py-3.5 px-4 text-slate-700">{p.email}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEditPartner(p)}
                          className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove partner ${p.name}?`)) deletePartner(p.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FLOWER VARIETIES */}
      {activeTab === "varieties" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Rose & Flower Varieties</h2>
              <p className="text-xs text-slate-500">Add or remove cut rose varieties grown in the polyhouses</p>
            </div>
            <button
              onClick={() => setIsVarietyModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Flower Variety</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {varieties.map((v) => (
              <div key={v.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: v.hexCode }} />
                      <h3 className="font-bold text-slate-900 text-sm">{v.name}</h3>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete variety ${v.name}?`)) deleteVariety(v.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Color: {v.color}</p>
                  {v.stemLengthNote && <p className="text-[11px] text-slate-500 mt-1">{v.stemLengthNote}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: POLYHOUSES & CROP ASSIGNMENT */}
      {activeTab === "polyhouses" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Polyhouses & Variety Allocations</h2>
              <p className="text-xs text-slate-500">Configure total polyhouses (currently exactly 4 polyhouses) and what variety is grown in each</p>
            </div>
            <button
              onClick={() => setIsPolyModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Polyhouse</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {polyhouses.map((ph) => (
              <div key={ph.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                      PH
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{ph.name}</h3>
                      <p className="text-[11px] text-slate-500">{ph.areaSqm} sqm protected area</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Remove polyhouse ${ph.name}?`)) deletePolyhouse(ph.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Planted Variety:</span>
                    <span className="font-bold text-slate-900">{ph.varietyName || "Taj Mahal (Red)"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mother Plant Population:</span>
                    <span className="font-semibold text-slate-800">~{ph.plantCount || 23000} plants</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FARM DEFAULTS & CLEAN SLATE */}
      {activeTab === "defaults" && (
        <div className="space-y-6">
          <form onSubmit={handleSaveDefaults} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Operational Defaults</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Farm / Plantation Name</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Stems Per Commercial Bunch</label>
                <input
                  type="number"
                  value={stemsPerBunch}
                  min="1"
                  onChange={(e) => setStemsPerBunch(parseInt(e.target.value) || 20)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-medium"
                  required
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Save Operational Defaults
              </button>
            </div>
          </form>

          {/* Data Reset & Maintenance Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 text-slate-800">
                <RotateCcw className="w-4 h-4 text-slate-600" />
                Data Reset & Maintenance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download a backup of all farm records{isCloud ? "." : ", reset transactions or load sample entries for testing."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  downloadBackup();
                  showToast("Backup file downloaded.");
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download full backup (.json)</span>
              </button>
            </div>
            {isCloud ? (
              <p className="text-[11px] text-slate-500">
                Your data is stored in the TriBloom cloud database and shared with the whole team. Download a backup every week and keep it safe.
              </p>
            ) : (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Reset all transactions to ZERO (0)? This will clear all current transaction logs.")) {
                    clearAllTransactionsToZero();
                    showToast("All transaction records reset to ZERO!");
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Transactions to ZERO</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  loadSamplePracticeData();
                  showToast("Sample practice data loaded!");
                }}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl"
              >
                Load Sample Test Entry
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Reset everything back to factory defaults?")) {
                    resetAllToDefault();
                    showToast("Reset to factory defaults completed!");
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl ml-auto"
              >
                Factory Reset
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: CONFIGURABLE FARMS */}
      {activeTab === "farms" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Configurable Farm Entities</h2>
              <p className="text-xs text-slate-500">Configure origin production farms and destination processing farms (e.g. TriBloom Farm, Nitin Farm)</p>
            </div>
            <button
              onClick={() => {
                setFarmModalName("");
                setFarmModalLocation("");
                setFarmModalContact("");
                setFarmModalRole("processing");
                setIsFarmModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Farm</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farms.map((f) => (
              <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{f.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                    {f.role}
                  </span>
                </div>
                {f.location && <p className="text-xs text-slate-500">📍 {f.location}</p>}
                {f.phone && <p className="text-xs text-slate-500">📞 {f.phone}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: AUCTION CENTRES */}
      {activeTab === "auctions" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Destination Auction Centres</h2>
              <p className="text-xs text-slate-500">Registered auction trading floors (e.g. IFAB Bangalore, APMC Mumbai, APMC Pune)</p>
            </div>
            <button
              onClick={() => {
                setAucModalName("");
                setAucModalCity("Bangalore");
                setAucModalState("Karnataka");
                setAucModalPhone("");
                setIsAuctionModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Auction Centre</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auctionCentres.map((auc) => (
              <div key={auc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{auc.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                    {auc.city}
                  </span>
                </div>
                <p className="text-xs text-slate-500">State: {auc.state}</p>
                {auc.phone && <p className="text-xs text-slate-500">Desk: {auc.phone}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: STEM LENGTHS & BUNCH SIZES */}
      {activeTab === "stemlengths" && (
        <div className="space-y-6">
          {/* Stem Length Categories */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Configurable Stem-Length Categories</h2>
                <p className="text-xs text-slate-500">Grading specifications used at the receiving farm (Short, Medium, Long, Extra Long)</p>
              </div>
              <button
                onClick={() => {
                  setStemCatName("");
                  setStemMinCm("50");
                  setStemMaxCm("60");
                  setIsStemModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Length Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {stemLengthCategories.map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl border border-slate-200 bg-indigo-50/30 space-y-1">
                  <span className="font-bold text-indigo-950 block text-sm">{cat.name}</span>
                  <span className="text-xs font-mono font-bold text-indigo-700">{cat.minLengthCm} cm - {cat.maxLengthCm} cm</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bunch Sizes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Configurable Bunch Size Specifications</h2>
                <p className="text-xs text-slate-500">Standard stems per bunch count prepared for auction packing (10 stems, 20 stems)</p>
              </div>
              <button
                onClick={() => {
                  setBunchConfigName("");
                  setBunchStemsCount("10");
                  setIsBunchModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Bunch Size</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {bunchSizes.map((bs) => (
                <div key={bs.id} className="p-4 rounded-xl border border-slate-200 bg-emerald-50/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-950 block text-sm">{bs.name}</span>
                    <span className="text-xs text-slate-500">{bs.stemsPerBunch} stems per commercial pack</span>
                  </div>
                  <span className="text-lg font-black text-emerald-800">{bs.stemsPerBunch}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FARM MODAL */}
      {isFarmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Farm Entity</h3>
            <form onSubmit={handleAddFarm} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Farm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nitin Farm Aggregator Hub"
                  value={farmModalName}
                  onChange={(e) => setFarmModalName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Farm Role *</label>
                <select
                  value={farmModalRole}
                  onChange={(e) => setFarmModalRole(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold bg-white"
                >
                  <option value="production">TriBloom Farm (Harvesting)</option>
                  <option value="processing">Processing Farm (Grading & Packing)</option>
                  <option value="aggregator">Aggregator Hub</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Location / Address</label>
                <input
                  type="text"
                  placeholder="Doddaballapur Road, Bangalore"
                  value={farmModalLocation}
                  onChange={(e) => setFarmModalLocation(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98450 12345"
                  value={farmModalContact}
                  onChange={(e) => setFarmModalContact(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFarmModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                >
                  Save Farm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUCTION MODAL */}
      {isAuctionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Auction Centre</h3>
            <form onSubmit={handleAddAuction} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Auction Centre Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IFAB Bangalore Flower Auction"
                  value={aucModalName}
                  onChange={(e) => setAucModalName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bangalore"
                    value={aucModalCity}
                    onChange={(e) => setAucModalCity(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Karnataka"
                    value={aucModalState}
                    onChange={(e) => setAucModalState(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuctionModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                >
                  Register Auction Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEM LENGTH MODAL */}
      {isStemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Stem Length Category</h3>
            <form onSubmit={handleAddStemLength} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Long (50-60cm)"
                  value={stemCatName}
                  onChange={(e) => setStemCatName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Length (cm)</label>
                  <input
                    type="number"
                    value={stemMinCm}
                    onChange={(e) => setStemMinCm(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Length (cm)</label>
                  <input
                    type="number"
                    value={stemMaxCm}
                    onChange={(e) => setStemMaxCm(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStemModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BUNCH SIZE MODAL */}
      {isBunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Bunch Size Specification</h3>
            <form onSubmit={handleAddBunchSize} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Specification Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20-Stem Standard Bunch"
                  value={bunchConfigName}
                  onChange={(e) => setBunchConfigName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Stems per Bunch *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={bunchStemsCount}
                  onChange={(e) => setBunchStemsCount(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-black"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBunchModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Save Bunch Size
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  {viewingUser.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{viewingUser.fullName}</h3>
                  <p className="text-xs text-slate-500 capitalize">{viewingUser.role} Account</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Active
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Login Email:
                </span>
                <span className="font-bold text-slate-900">{viewingUser.email}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Key className="w-3.5 h-3.5 text-slate-400" /> Login Password:
                </span>
                <span className="font-mono font-bold text-slate-900">{isCloud ? "Hidden (reset via “Forgot password”)" : (viewingUser.password || "Password@123")}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
                </span>
                <span className="font-semibold text-slate-800">{viewingUser.phone || "—"}</span>
              </div>

              {viewingUser.partnerName && (
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between text-blue-950">
                  <span className="font-medium">Linked Partner Ledger:</span>
                  <span className="font-bold">{viewingUser.partnerName}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const u = viewingUser;
                  setViewingUser(null);
                  startEditUser(u);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {isCloud ? "Edit Details" : "Edit Details / Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER EDIT / CREATE MODAL WITH PASSWORD SETTING */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingUserId ? "Edit User Profile" : "Add New Team User"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingUserId
                    ? "Update permissions and profile details (Email & password are fixed)"
                    : "Create user with email and secure password"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Permanent Security Rule Notice */}
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-900">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                {isCloud ? (
                  <><strong>Login:</strong> the email can&apos;t be changed later. People can change their own password with &ldquo;Forgot password&rdquo; on the sign-in screen.</>
                ) : (
                  <><strong>Permanent Credentials Rule:</strong> User email ID and password are permanently locked once set and cannot be altered.</>
                )}
              </span>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Gowda"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                  <span>Email (Login ID) *</span>
                  {editingUserId && (
                    <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  placeholder="user@tribloom.in"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  disabled={!!editingUserId}
                  className={`w-full text-xs p-2.5 border rounded-lg font-medium ${
                    editingUserId
                      ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                      : "border-slate-300 bg-white"
                  }`}
                  required
                />
              </div>

              {/* Password Input (Active when creating, permanently locked when editing) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                  <span>{editingUserId && isCloud ? "New password" : "Login Password *"}</span>
                  {editingUserId && !isCloud ? (
                    <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      {editingUserId ? "Leave blank to keep the current one" : "At least 8 characters"}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={editingUserId && isCloud ? "Leave blank to keep" : "Password for this person"}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    disabled={!!editingUserId && !isCloud}
                    autoComplete="new-password"
                    className={`w-full text-xs p-2.5 pr-9 border rounded-lg font-mono font-medium ${
                      editingUserId && !isCloud
                        ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                        : "border-slate-300 bg-white"
                    }`}
                    required={!editingUserId}
                  />
                  {(!editingUserId || isCloud) && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98450 00000"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Role Permission *</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="admin">Admin (Full Farm & Financial Control)</option>
                  <option value="partner">Partner (Investor Dashboards & Ledger)</option>
                  <option value="supervisor">Supervisor (Harvest, Expenses & Dispatch)</option>
                  <option value="accounts">Accounts (Sales & Invoices)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>

              {userRole === "partner" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Link to Partner Account</label>
                  <select
                    value={userPartnerId}
                    onChange={(e) => setUserPartnerId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="">Select Partner...</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatINR(p.committedAmount)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingUserId && editingUserId !== currentUser?.id && (
                <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userIsActive}
                    onChange={(e) => setUserIsActive(e.target.checked)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <span className="text-xs text-slate-700">
                    <span className="font-semibold block">Active (can sign in)</span>
                    Untick when someone leaves. They lose access straight away; their past entries stay.
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Save User & Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTNER MODAL (SHARE IN AMOUNT INR ONLY) */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              {editingPartnerId ? "Edit Partner Details" : "Add New Partner"}
            </h3>
            <form onSubmit={handleSavePartner} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Partner Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Reddy"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Family Group / Family Name</label>
                <input
                  type="text"
                  placeholder="e.g. Reddy Family"
                  value={partnerFamily}
                  onChange={(e) => setPartnerFamily(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Partner Share in Amount INR */}
              <div>
                <label className="text-xs font-semibold text-slate-700 flex justify-between mb-1">
                  <span>Partner Share (Amount in INR) *</span>
                  {parseFloat(partnerAmount) > 0 && (
                    <span className="text-blue-700 font-bold">{formatINR(parseFloat(partnerAmount))}</span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-base font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="10000"
                    placeholder="25,00,000"
                    value={partnerAmount}
                    onChange={(e) => setPartnerAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-lg font-bold border border-blue-500 rounded-lg text-blue-950"
                    required
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  {[1000000, 2000000, 2500000, 3500000, 5000000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPartnerAmount(val.toString())}
                      className="text-[10px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 px-2 py-0.5 rounded-md"
                    >
                      ₹{val / 100000}L
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 99000 00000"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="partner@gmail.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Save Partner Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VARIETY MODAL */}
      {isVarietyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Flower Variety</h3>
            <form onSubmit={handleAddVariety} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Variety Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Taj Mahal, Gold Strike, Avalanche..."
                  value={varietyName}
                  onChange={(e) => setVarietyName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Deep Red, Yellow, White"
                    value={varietyColor}
                    onChange={(e) => setVarietyColor(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Color Code (Hex)</label>
                  <input
                    type="color"
                    value={varietyHex}
                    onChange={(e) => setVarietyHex(e.target.value)}
                    className="w-full h-9 p-1 border border-slate-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Characteristics</label>
                <input
                  type="text"
                  placeholder="e.g. 60-70cm stem, high bloom life"
                  value={varietyNote}
                  onChange={(e) => setVarietyNote(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVarietyModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                >
                  Save Variety
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POLYHOUSE MODAL */}
      {isPolyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Polyhouse</h3>
            <form onSubmit={handleAddPolyhouse} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Polyhouse Name / Code *</label>
                <input
                  type="text"
                  placeholder="e.g. PH-5, Polyhouse 5..."
                  value={polyName}
                  onChange={(e) => setPolyName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Area (sqm) *</label>
                  <input
                    type="number"
                    placeholder="3000"
                    value={polyArea}
                    onChange={(e) => setPolyArea(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Plant Count</label>
                  <input
                    type="number"
                    placeholder="23000"
                    value={polyPlants}
                    onChange={(e) => setPolyPlants(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Flower Variety Grown *</label>
                <select
                  value={polyVarietyId}
                  onChange={(e) => setPolyVarietyId(e.target.value)}
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
                  onClick={() => setIsPolyModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
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
