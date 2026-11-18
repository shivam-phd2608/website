"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flower2, Truck, Split, PackageCheck, ArrowRightLeft, BadgeIndianRupee, ChevronRight } from "lucide-react";
import { useFarm } from "@/lib/store";
import { formatINR, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const PERIOD_LABEL: Record<string, string> = {
  today: "today",
  this_week: "this week",
  this_month: "this month",
  all: "all time",
  custom: "selected dates",
};

/** The six steps every flower goes through, with this period's numbers. */
export function FlowPipeline({ className = "" }: { className?: string }) {
  const pathname = (usePathname() || "/").replace(/\/+$/, "") || "/";
  const { traceabilityKPIs: k, filteredGradings, filterPeriod, selectedFY } = useFarm();

  const graded = filteredGradings.reduce((sum, g) => sum + (g.totalGradedStems || 0), 0);
  const transitLoss = k.transitDiscrepancyBuckets > 0;

  const stages = [
    { n: 1, title: "Harvest", icon: Flower2, value: `${formatNumber(k.totalBucketsHarvested)} buckets`, sub: "cut in polyhouses", href: "/harvest" },
    {
      n: 2,
      title: "To packhouse",
      icon: Truck,
      value: `${formatNumber(k.qtyDispatched1Buckets)} buckets`,
      sub: transitLoss ? `${k.transitDiscrepancyBuckets} lost in transit` : `${formatNumber(k.qtyReceivedAtFarmBuckets)} received`,
      warn: transitLoss,
      href: "/dispatch",
    },
    { n: 3, title: "Graded", icon: Split, value: `${formatNumber(graded)} stems`, sub: "by stem length", href: "/processing" },
    { n: 4, title: "Packed", icon: PackageCheck, value: `${formatNumber(k.totalBunchesPacked)} bunches`, sub: `${formatNumber(k.totalStemsPacked)} stems`, href: "/packing" },
    { n: 5, title: "To market", icon: ArrowRightLeft, value: `${formatNumber(k.qtyDispatchedToAuctionBunches)} bunches`, sub: "sent to auction / buyers", href: "/dispatch-auction" },
    { n: 6, title: "Sold", icon: BadgeIndianRupee, value: formatINR(k.grossAuctionRealization), sub: `${formatNumber(k.totalBunchesSold)} bunches · ${k.soldPercent}% sold`, href: "/auction-sales" },
  ];

  return (
    <div className={cn("flex items-stretch gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5", className)} aria-label={`Flower journey, ${PERIOD_LABEL[filterPeriod]}${selectedFY && selectedFY !== "ALL" ? `, ${selectedFY}` : ""}`}>
      {stages.map((s, i) => {
        const Icon = s.icon;
        const active = pathname === s.href;
        return (
          <React.Fragment key={s.n}>
            <Link
              href={s.href}
              className={cn(
                "group min-w-[150px] flex-1 rounded-xl border px-3 py-2 transition-colors",
                active ? "bg-tb-forest border-tb-forest text-white" : "bg-white border-tb-line hover:border-tb-sage"
              )}
            >
              <div className={cn("flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider", active ? "text-tb-sage" : "text-tb-muted")}>
                <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[9px]", active ? "bg-white/15 text-white" : "bg-tb-ivory text-tb-forest")}>{s.n}</span>
                {s.title}
                <Icon className="w-3.5 h-3.5 ml-auto opacity-60" />
              </div>
              <div className={cn("mt-1 text-sm font-semibold tabular-nums whitespace-nowrap", active ? "text-white" : "text-tb-ink")}>{s.value}</div>
              <div className={cn("text-[10px] truncate", s.warn ? (active ? "text-amber-200" : "text-amber-700") : active ? "text-tb-ivory/70" : "text-tb-muted")}>{s.sub}</div>
            </Link>
            {i < stages.length - 1 && <ChevronRight className="w-3.5 h-3.5 self-center shrink-0 text-tb-sage hidden xl:block" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
