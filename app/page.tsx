"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Flower2,
  PackageCheck,
  BadgeIndianRupee,
  Receipt,
  ArrowRight,
  AlertTriangle,
  Truck,
  Clock,
  Users,
  Plus,
  Grid3X3,
  History,
} from "lucide-react";
import { useFarm } from "@/lib/store";
import { formatINR, formatNumber, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const PERIOD_TEXT: Record<string, string> = {
  today: "Today",
  this_week: "This week",
  this_month: "This month",
  all: "All time",
  custom: "Selected dates",
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  href,
  tone = "forest",
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  tone?: "forest" | "rose" | "gold" | "sage";
}) {
  const toneCls = {
    forest: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    gold: "bg-amber-50 text-amber-800",
    sage: "bg-slate-100 text-slate-700",
  }[tone];
  return (
    <Link href={href} className="farm-card farm-card-hover p-4 sm:p-5 block">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-tb-muted">{label}</span>
        <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", toneCls)}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-semibold text-tb-ink tabular-nums tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-tb-muted">{sub}</div>
    </Link>
  );
}

function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("farm-card p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-serif-brand text-xl text-tb-forest">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Simple horizontal bars: one hue, value labels in ink, hover shows exact numbers. */
function BarList({ rows, unit, empty }: { rows: { key: string; label: string; value: number; note?: string; dot?: string }[]; unit: string; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.every((r) => r.value === 0)) {
    return <p className="text-sm text-tb-muted py-6 text-center">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key} title={`${r.label}: ${formatNumber(r.value)} ${unit}${r.note ? ` · ${r.note}` : ""}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              {r.dot && <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10" style={{ background: r.dot }} />}
              <span className="font-medium text-tb-ink truncate">{r.label}</span>
            </span>
            <span className="tabular-nums text-tb-ink font-semibold whitespace-nowrap">
              {formatNumber(r.value)} <span className="text-tb-muted font-normal text-xs">{unit}</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-tb-ivory overflow-hidden">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value > 0 ? 4 : 0 }} />
          </div>
          {r.note && <div className="mt-1 text-[11px] text-tb-muted">{r.note}</div>}
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const {
    currentUser,
    currentRole,
    filterPeriod,
    selectedFY,
    traceabilityKPIs: k,
    kpis,
    polyhouses,
    varieties,
    filteredExpenses,
    filteredAuctionRealizations,
    auditLogs,
    partners,
    partnerLedgers,
    setIsQuickHarvestOpen,
    setIsQuickExpenseOpen,
  } = useFarm();

  const canSeeMoney = currentRole !== "supervisor";
  const period = PERIOD_TEXT[filterPeriod] || "This period";
  const fyText = selectedFY && selectedFY !== "ALL" ? selectedFY : "all years";
  const firstName = (currentUser?.fullName || "").split(/[\s(]/)[0] || "there";

  const expenseTotal = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const expenseByCategory = useMemo(() => {
    const m = new Map<string, number>();
    filteredExpenses.forEach((e) => m.set(e.categoryName || "Other", (m.get(e.categoryName || "Other") || 0) + (e.amount || 0)));
    return Array.from(m.entries())
      .map(([label, value]) => ({ key: label, label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredExpenses]);

  const pendingSettlement = filteredAuctionRealizations
    .filter((r) => !r.isVoid && r.paymentStatus && r.paymentStatus !== "settled")
    .reduce((s, r) => s + (r.totalNetRealization || r.netRealization || 0), 0);

  const harvestRows = k.harvestByPolyhouse.map((p) => ({
    key: p.id,
    label: p.name,
    value: p.buckets,
    note: `≈ ${formatNumber(p.stems)} stems · ${p.varieties.join(", ")}`,
  }));

  const varietyRows = k.harvestByVariety
    .filter((v) => v.buckets > 0)
    .sort((a, b) => b.buckets - a.buckets)
    .map((v) => ({ key: v.id, label: v.name, value: v.buckets, dot: v.hex }));

  const realisationRows = k.avgRealizationByVariety
    .slice()
    .sort((a, b) => b.gross - a.gross)
    .slice(0, 6);

  const alerts: { tone: "warn" | "info"; text: string; href: string }[] = [];
  if (k.transitDiscrepancyBuckets > 0) alerts.push({ tone: "warn", text: `${k.transitDiscrepancyBuckets} ${k.transitDiscrepancyBuckets === 1 ? "bucket" : "buckets"} sent to the packhouse ${k.transitDiscrepancyBuckets === 1 ? "was" : "were"} not received`, href: "/dispatch" });
  if (k.packedInventoryAwaitingDispatch > 0) alerts.push({ tone: "info", text: `${formatNumber(k.packedInventoryAwaitingDispatch)} packed bunches are waiting to be sent to market`, href: "/dispatch-auction" });
  if (canSeeMoney && pendingSettlement > 0) alerts.push({ tone: "info", text: `${formatINR(pendingSettlement)} of sales is not yet settled by the market`, href: "/auction-sales" });
  if (k.rejectedAndLossQuantities.totalLossStems > 0)
    alerts.push({ tone: "warn", text: `${formatNumber(k.rejectedAndLossQuantities.totalLossStems)} stems lost (rejected at grading, damaged or unsold)`, href: "/reports" });

  const statusStyle: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    resting: "bg-slate-50 text-slate-600 border-slate-200",
    replanting: "bg-amber-50 text-amber-800 border-amber-200",
    maintenance: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs text-tb-muted">
            {new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </p>
          <h1 className="font-serif-brand text-3xl sm:text-4xl text-tb-forest mt-0.5">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm text-tb-muted mt-1">
            {period} at TriBloom Farms · {fyText}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsQuickHarvestOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-tb-forest hover:bg-tb-forest-2 text-white text-sm font-semibold px-4 py-2.5 shadow-sm">
            <Plus className="w-4 h-4" /> Record harvest
          </button>
          {currentRole !== "viewer" && currentRole !== "partner" && (
            <button onClick={() => setIsQuickExpenseOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-tb-line hover:border-tb-sage text-tb-forest text-sm font-semibold px-4 py-2.5">
              <Receipt className="w-4 h-4" /> Log expense
            </button>
          )}
        </div>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label="Harvested"
          value={`${formatNumber(k.totalBucketsHarvested)}`}
          sub={`buckets · ≈ ${formatNumber(k.totalEstimatedStems)} stems`}
          icon={Flower2}
          href="/harvest"
        />
        <StatTile
          label="Packed"
          value={formatNumber(k.totalBunchesPacked)}
          sub={`bunches · ${formatNumber(k.packedInventoryAwaitingDispatch)} waiting to ship`}
          icon={PackageCheck}
          href="/packing"
          tone="sage"
        />
        {canSeeMoney ? (
          <>
            <StatTile
              label="Sales (net)"
              value={formatINR(k.netRealization)}
              sub={`${formatNumber(k.totalBunchesSold)} bunches sold · ${k.soldPercent}% of sent`}
              icon={BadgeIndianRupee}
              href="/auction-sales"
              tone="gold"
            />
            <StatTile label="Expenses" value={formatINR(expenseTotal)} sub={`${filteredExpenses.length} bills recorded`} icon={Receipt} href="/expenses" tone="rose" />
          </>
        ) : (
          <>
            <StatTile label="Sent to market" value={formatNumber(k.qtyDispatchedToAuctionBunches)} sub="bunches" icon={Truck} href="/dispatch-auction" tone="gold" />
            <StatTile label="Graded" value={formatNumber(k.totalGradedStems)} sub={`stems · ${formatNumber(k.totalRejectedStems)} rejected`} icon={PackageCheck} href="/processing" tone="rose" />
          </>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-2">
          {alerts.map((a) => (
            <Link
              key={a.text}
              href={a.href}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                a.tone === "warn" ? "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100/60" : "bg-white border-tb-line text-tb-ink hover:border-tb-sage"
              )}
            >
              {a.tone === "warn" ? <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" /> : <Clock className="w-4 h-4 shrink-0 text-tb-muted" />}
              <span className="flex-1">{a.text}</span>
              <ArrowRight className="w-4 h-4 shrink-0 opacity-60" />
            </Link>
          ))}
        </div>
      )}

      {/* Harvest */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        <Section
          title="Harvest by polyhouse"
          action={<Link href="/harvest" className="text-xs font-semibold text-emerald-700 hover:underline">Open harvest log</Link>}
        >
          <BarList rows={harvestRows} unit="buckets" empty={`No harvest recorded ${period.toLowerCase()} yet.`} />
        </Section>
        <Section title="Harvest by variety" action={<span className="text-xs text-tb-muted">{period}</span>}>
          <BarList rows={varietyRows} unit="buckets" empty={`No harvest recorded ${period.toLowerCase()} yet.`} />
        </Section>
      </div>

      {/* Polyhouses */}
      <Section
        title="Polyhouses"
        action={
          <Link href="/farm" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
            <Grid3X3 className="w-3.5 h-3.5" /> Manage
          </Link>
        }
      >
        {polyhouses.length === 0 ? (
          <p className="text-sm text-tb-muted">No polyhouses yet. Add them under Polyhouses &amp; crops.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {polyhouses.map((ph) => {
              const h = k.harvestByPolyhouse.find((x) => x.id === ph.id);
              const vlist = ph.varieties && ph.varieties.length ? ph.varieties : ph.varietyName ? [{ varietyId: ph.varietyId || "", varietyName: ph.varietyName }] : [];
              return (
                <div key={ph.id} className="rounded-xl border border-tb-line bg-tb-ivory/50 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif-brand text-xl text-tb-forest">{ph.name}</span>
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wider border rounded-full px-2 py-0.5", statusStyle[ph.status] || statusStyle.active)}>{ph.status}</span>
                  </div>
                  <div className="text-[11px] text-tb-muted mt-0.5">
                    {formatNumber(ph.areaSqm)} m²{ph.plantCount ? ` · ${formatNumber(ph.plantCount)} plants` : ""}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {vlist.map((v) => {
                      const meta = varieties.find((x) => x.id === v.varietyId || x.name === v.varietyName);
                      return (
                        <span key={v.varietyId + v.varietyName} className="inline-flex items-center gap-1.5 text-[11px] bg-white border border-tb-line rounded-full px-2 py-0.5 text-tb-ink">
                          <span className="w-2 h-2 rounded-full ring-1 ring-black/10" style={{ background: meta?.hexCode || "#ccc" }} />
                          {v.varietyName}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-tb-line flex items-baseline justify-between text-xs">
                    <span className="text-tb-muted">{period}</span>
                    <span className="font-semibold text-tb-ink tabular-nums">{formatNumber(h?.buckets || 0)} buckets</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Money */}
      {canSeeMoney && (
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
          <Section title="Sales by variety" className="lg:col-span-1" action={<Link href="/auction-sales" className="text-xs font-semibold text-emerald-700 hover:underline">Details</Link>}>
            {realisationRows.length === 0 ? (
              <p className="text-sm text-tb-muted py-6 text-center">No sales recorded {period.toLowerCase()}.</p>
            ) : (
              <table className="w-full text-sm !min-w-0">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-tb-muted">
                    <th className="text-left font-semibold pb-2">Variety</th>
                    <th className="text-right font-semibold pb-2">Sales</th>
                    <th className="text-right font-semibold pb-2">Per bunch</th>
                  </tr>
                </thead>
                <tbody>
                  {realisationRows.map((r) => (
                    <tr key={r.varietyName} className="border-t border-tb-line">
                      <td className="py-2 text-tb-ink">{r.varietyName}</td>
                      <td className="py-2 text-right tabular-nums font-semibold">{formatINR(r.gross)}</td>
                      <td className="py-2 text-right tabular-nums text-tb-muted">{formatINR(r.avgRatePerBunch)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="Where the money went" action={<Link href="/expenses" className="text-xs font-semibold text-emerald-700 hover:underline">All expenses</Link>}>
            <BarList
              rows={expenseByCategory.map((r) => ({ ...r, value: Math.round(r.value) }))}
              unit="₹"
              empty={`No expenses recorded ${period.toLowerCase()}.`}
            />
          </Section>

          <Section title="Partner capital" action={<Link href="/partners" className="text-xs font-semibold text-emerald-700 hover:underline">Ledgers</Link>}>
            {partners.length === 0 ? (
              <p className="text-sm text-tb-muted">No partners added yet. Add them in Settings &amp; team.</p>
            ) : (
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold text-tb-ink tabular-nums">{formatINR(kpis.capitalContributed)}</span>
                  <span className="text-xs text-tb-muted">of {formatINR(kpis.capitalCommitted)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-tb-ivory overflow-hidden" title={`${kpis.capitalProgressPercent}% of committed capital received`}>
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${kpis.capitalProgressPercent}%` }} />
                </div>
                <p className="text-[11px] text-tb-muted mt-1.5">{kpis.capitalProgressPercent}% of committed capital received</p>
                <ul className="mt-4 space-y-2">
                  {partnerLedgers.slice(0, 5).map((p) => (
                    <li key={p.partnerId} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        <Users className="w-3.5 h-3.5 text-tb-muted shrink-0" />
                        <span className="truncate text-tb-ink">{p.partnerName}</span>
                      </span>
                      <span className="tabular-nums text-tb-ink">{formatINR(p.contributedAmount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        </div>
      )}

      {/* Recent activity */}
      <Section
        title="Recent activity"
        action={
          ["admin", "supervisor", "accounts"].includes(currentRole) ? (
            <Link href="/audit" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
              <History className="w-3.5 h-3.5" /> Audit trail
            </Link>
          ) : undefined
        }
      >
        {auditLogs.length === 0 ? (
          <p className="text-sm text-tb-muted">Nothing recorded yet. Entries from the whole team will appear here.</p>
        ) : (
          <ul className="divide-y divide-tb-line">
            {auditLogs.slice(0, 8).map((a) => (
              <li key={a.id} className="py-2.5 flex items-start gap-3 text-sm">
                <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="text-tb-ink">{a.details}</span>
                  <span className="block text-[11px] text-tb-muted mt-0.5">
                    {a.userName} · {formatDate(a.timestamp)}
                    {a.recordRef ? ` · ${a.recordRef}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
