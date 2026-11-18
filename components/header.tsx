"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Receipt,
  Flower2,
  Users,
  ChevronDown,
  Truck,
  LogOut,
  Split,
  PackageCheck,
  ArrowRightLeft,
  BadgeIndianRupee,
  Menu,
  Check,
  Loader2,
  CloudOff,
  AlertTriangle,
  Eye,
  KeyRound,
  X,
} from "lucide-react";
import { useFarm, FilterPeriod } from "@/lib/store";
import { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { currentFYLabel } from "@/lib/formatters";
import { FarmLogo } from "@/components/farm-logo";

const PERIODS: { id: FilterPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "this_week", label: "Week" },
  { id: "this_month", label: "Month" },
  { id: "all", label: "All" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  partner: "Partner",
  supervisor: "Farm manager",
  accounts: "Accounts",
  viewer: "Viewer",
};

function fyOptions() {
  const current = currentFYLabel();
  const startYear = parseInt(current.slice(3, 7), 10);
  const list: string[] = [];
  for (let y = startYear + 1; y >= 2024; y--) list.push(`FY ${y}-${String((y + 1) % 100).padStart(2, "0")}`);
  return [...list, "ALL"];
}

function useClickAway<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open, close]);
  return ref;
}

export function SyncBadge() {
  const { isCloud, syncStatus, syncMessage } = useFarm();
  if (!isCloud) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1" title="Data is saved only in this browser. Connect Supabase to share it with the team.">
        <CloudOff className="w-3.5 h-3.5" /> Demo
      </span>
    );
  }
  const map = {
    idle: { icon: <Check className="w-3.5 h-3.5" />, text: "Synced", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    saved: { icon: <Check className="w-3.5 h-3.5" />, text: "Saved", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    saving: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, text: "Saving", cls: "text-slate-700 bg-slate-50 border-slate-200" },
    offline: { icon: <CloudOff className="w-3.5 h-3.5" />, text: "Offline", cls: "text-amber-800 bg-amber-50 border-amber-200" },
    error: { icon: <AlertTriangle className="w-3.5 h-3.5" />, text: "Not saved", cls: "text-rose-700 bg-rose-50 border-rose-200" },
  }[syncStatus];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium border rounded-full px-2.5 py-1", map.cls)}
      title={syncStatus === "error" ? `Last change was not saved: ${syncMessage}. Check your internet and try again.` : undefined}
    >
      {map.icon}
      <span className="hidden sm:inline">{map.text}</span>
    </span>
  );
}

export function Header({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const router = useRouter();
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    logout,
    filterPeriod,
    setFilterPeriod,
    selectedFY,
    setSelectedFY,
    setIsQuickExpenseOpen,
    setIsQuickHarvestOpen,
    setIsQuickContributionOpen,
    isCloud,
    changePassword,
  } = useFarm();

  const [quickOpen, setQuickOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const quickRef = useClickAway<HTMLDivElement>(quickOpen, () => setQuickOpen(false));
  const userRef = useClickAway<HTMLDivElement>(userOpen, () => setUserOpen(false));

  const isRealAdmin = currentUser?.role === "admin";
  const canMoney = ["admin", "supervisor", "accounts"].includes(currentRole);
  const canCapital = ["admin", "accounts"].includes(currentRole);

  const go = (url: string) => {
    setQuickOpen(false);
    router.push(url);
  };

  const quickItems = [
    { label: "Record harvest", hint: "Buckets cut per polyhouse", icon: Flower2, onClick: () => { setQuickOpen(false); setIsQuickHarvestOpen(true); } },
    { label: "Send to packhouse", hint: "Step 2", icon: Truck, onClick: () => go("/dispatch?action=new") },
    { label: "Grade stems", hint: "Step 3", icon: Split, onClick: () => go("/processing?action=new") },
    { label: "Pack bunches", hint: "Step 4", icon: PackageCheck, onClick: () => go("/packing?action=new") },
    { label: "Send to market", hint: "Step 5", icon: ArrowRightLeft, onClick: () => go("/dispatch-auction?action=new") },
    { label: "Record sale price", hint: "Step 6", icon: BadgeIndianRupee, onClick: () => go("/auction-sales?action=new") },
    ...(canMoney ? [{ label: "Log expense", hint: "Bills & payments", icon: Receipt, onClick: () => { setQuickOpen(false); setIsQuickExpenseOpen(true); } }] : []),
    ...(canCapital ? [{ label: "Partner capital in", hint: "Contribution", icon: Users, onClick: () => { setQuickOpen(false); setIsQuickContributionOpen(true); } }] : []),
  ];

  const initials = (currentUser?.fullName || currentUser?.email || "?")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <header className="h-14 sm:h-16 bg-white/95 backdrop-blur border-b border-tb-line px-3 sm:px-6 flex items-center gap-2 sm:gap-3 shrink-0">
      {/* Mobile: menu + logo */}
      <button onClick={onOpenMenu} className="lg:hidden p-2 -ml-1 rounded-lg text-tb-forest hover:bg-tb-ivory" aria-label="Open menu">
        <Menu className="w-5 h-5" />
      </button>
      <div className="lg:hidden shrink-0">
        <FarmLogo size="sm" className="!w-[64px]" />
      </div>

      {/* Period filter */}
      <div className="hidden md:flex items-center bg-tb-ivory p-1 rounded-xl border border-tb-line">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setFilterPeriod(p.id)}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-colors",
              filterPeriod === p.id ? "bg-tb-forest text-white shadow-sm" : "text-tb-muted hover:text-tb-forest"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <select
        aria-label="Time period"
        value={filterPeriod}
        onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
        className="md:hidden text-xs font-semibold bg-tb-ivory border border-tb-line rounded-lg px-2 py-1.5 text-tb-forest"
      >
        {PERIODS.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>

      <select
        aria-label="Financial year"
        value={selectedFY.startsWith("FY") || selectedFY === "ALL" ? selectedFY : `FY ${selectedFY}`}
        onChange={(e) => setSelectedFY(e.target.value)}
        className="hidden sm:block text-xs font-semibold bg-white border border-tb-line rounded-lg px-2.5 py-1.5 text-tb-forest"
      >
        {fyOptions().map((fy) => (
          <option key={fy} value={fy}>{fy === "ALL" ? "All years" : fy}</option>
        ))}
      </select>

      <div className="flex-1" />

      <SyncBadge />

      {/* Quick add */}
      <div className="relative" ref={quickRef}>
        <button
          onClick={() => setQuickOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 bg-tb-forest hover:bg-tb-forest-2 text-white text-xs font-semibold rounded-xl px-3 py-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New entry</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-70 hidden sm:block" />
        </button>
        {quickOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-tb-line shadow-xl p-1.5 z-50">
            {quickItems.map((q) => {
              const Icon = q.icon;
              return (
                <button key={q.label} onClick={q.onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-tb-ivory">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-tb-ink">{q.label}</span>
                    <span className="block text-[11px] text-tb-muted">{q.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User */}
      <div className="relative" ref={userRef}>
        <button onClick={() => setUserOpen((v) => !v)} className="flex items-center gap-2 rounded-xl pl-1 pr-2 py-1 hover:bg-tb-ivory">
          <span className="w-8 h-8 rounded-full bg-tb-forest text-tb-ivory text-xs font-bold flex items-center justify-center">{initials}</span>
          <span className="hidden xl:block text-left leading-tight">
            <span className="block text-xs font-semibold text-tb-ink max-w-[140px] truncate">{currentUser?.fullName}</span>
            <span className="block text-[10px] text-tb-muted">
              {ROLE_LABELS[currentRole]}
              {isRealAdmin && currentRole !== "admin" ? " (preview)" : ""}
            </span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-tb-muted hidden sm:block" />
        </button>
        {userOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-tb-line shadow-xl p-2 z-50">
            <div className="px-3 py-2 border-b border-tb-line mb-1">
              <div className="text-sm font-semibold text-tb-ink truncate">{currentUser?.fullName}</div>
              <div className="text-[11px] text-tb-muted truncate">{currentUser?.email}</div>
            </div>
            {isRealAdmin && (
              <div className="px-1 py-1">
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-tb-muted flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Preview the app as
                </div>
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => { setCurrentRole(r); setUserOpen(false); }}
                    className={cn("w-full text-left text-xs px-2 py-1.5 rounded-lg flex items-center justify-between hover:bg-tb-ivory", currentRole === r && "font-semibold text-tb-forest")}
                  >
                    {ROLE_LABELS[r]}
                    {currentRole === r && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
            {isCloud && (
              <button
                onClick={() => { setUserOpen(false); setPwOpen(true); }}
                className="w-full mt-1 flex items-center gap-2 text-xs font-semibold text-tb-ink px-3 py-2 rounded-lg hover:bg-tb-ivory"
              >
                <KeyRound className="w-4 h-4" /> Change password
              </button>
            )}
            <button
              onClick={() => { setUserOpen(false); logout(); }}
              className="w-full mt-1 flex items-center gap-2 text-xs font-semibold text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </div>
      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} changePassword={changePassword} />}
    </header>
  );
}

function ChangePasswordModal({
  onClose,
  changePassword,
}: {
  onClose: () => void;
  changePassword: (current: string, next: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setMsg({ ok: false, text: "Use at least 8 characters." });
    if (next !== again) return setMsg({ ok: false, text: "The new passwords don't match." });
    setBusy(true);
    const r = await changePassword(current, next);
    setBusy(false);
    setMsg(r.success ? { ok: true, text: "Password changed." } : { ok: false, text: r.error || "Could not change the password." });
    if (r.success) setTimeout(onClose, 1200);
  };

  const input = "mt-1 w-full rounded-xl border border-tb-line bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-tb-forest/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-brand text-xl text-tb-forest">Change password</h3>
          <button type="button" onClick={onClose} className="p-1 text-tb-muted hover:text-tb-forest" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <label className="block text-xs font-semibold text-tb-ink">Current password<input type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={input} /></label>
        <label className="block text-xs font-semibold text-tb-ink">New password<input type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} className={input} /></label>
        <label className="block text-xs font-semibold text-tb-ink">Repeat new password<input type="password" autoComplete="new-password" required value={again} onChange={(e) => setAgain(e.target.value)} className={input} /></label>
        {msg && <p className={cn("text-xs rounded-lg px-3 py-2 border", msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-700")}>{msg.text}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-tb-forest hover:bg-tb-forest-2 disabled:opacity-70 text-white text-sm font-semibold py-2.5 flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save new password
        </button>
      </form>
    </div>
  );
}
