"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Users,
  Flower2,
  Truck,
  BadgeIndianRupee,
  Grid3X3,
  Settings,
  PackageCheck,
  Split,
  History,
  GitFork,
  ArrowRightLeft,
  X,
  Cloud,
  CloudOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm } from "@/lib/store";
import { FarmLogo } from "@/components/farm-logo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  rolesAllowed?: string[];
  step?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Polyhouses & crops", href: "/farm", icon: Grid3X3 },
    ],
  },
  {
    title: "Flower journey",
    items: [
      { label: "Harvest", href: "/harvest", icon: Flower2, step: 1 },
      { label: "Send to packhouse", href: "/dispatch", icon: Truck, step: 2 },
      { label: "Grading", href: "/processing", icon: Split, step: 3 },
      { label: "Bunching & packing", href: "/packing", icon: PackageCheck, step: 4 },
      { label: "Send to market", href: "/dispatch-auction", icon: ArrowRightLeft, step: 5 },
      { label: "Sales & realisation", href: "/auction-sales", icon: BadgeIndianRupee, step: 6 },
    ],
  },
  {
    title: "Money",
    items: [
      { label: "Expenses", href: "/expenses", icon: Receipt },
      { label: "Partners & capital", href: "/partners", icon: Users, rolesAllowed: ["admin", "partner", "accounts", "viewer"] },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Traceability & reports", href: "/reports", icon: GitFork, rolesAllowed: ["admin", "partner", "accounts", "viewer"] },
      { label: "Audit trail", href: "/audit", icon: History, rolesAllowed: ["admin", "supervisor", "accounts"] },
      { label: "Settings & team", href: "/settings", icon: Settings, rolesAllowed: ["admin"] },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (href === "/") return p === "/";
  return p === href || p.startsWith(href + "/");
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { currentRole, isCloud, syncStatus, settings } = useFarm();

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/" onClick={onNavigate} className="block">
          <FarmLogo variant="light" size="sm" />
        </Link>
        {onNavigate && (
          <button onClick={onNavigate} className="lg:hidden p-2 -mr-2 rounded-lg text-tb-ivory/80 hover:bg-white/10" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.rolesAllowed || i.rolesAllowed.includes(currentRole));
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-tb-sage">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-colors",
                        active
                          ? "bg-tb-ivory text-tb-forest font-semibold shadow-sm"
                          : "text-tb-ivory/85 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      {item.step ? (
                        <span
                          className={cn(
                            "w-5 h-5 shrink-0 rounded-full text-[10px] font-bold flex items-center justify-center",
                            active ? "bg-tb-forest text-tb-ivory" : "bg-white/10 text-tb-ivory/90"
                          )}
                        >
                          {item.step}
                        </span>
                      ) : (
                        <Icon className={cn("w-4 h-4 shrink-0", active ? "text-emerald-600" : "text-tb-sage group-hover:text-tb-ivory")} />
                      )}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-[11px] text-tb-sage flex items-center gap-2">
        {isCloud ? (
          syncStatus === "offline" || syncStatus === "error" ? (
            <CloudOff className="w-3.5 h-3.5 text-amber-300" />
          ) : (
            <Cloud className="w-3.5 h-3.5 text-emerald-300" />
          )
        ) : (
          <CloudOff className="w-3.5 h-3.5 text-amber-300" />
        )}
        <span className="truncate">
          {isCloud ? `${settings.farmName} · cloud` : "Demo mode · this browser only"}
        </span>
      </div>
    </div>
  );
}

/** Fixed sidebar on laptops; on phones the same content opens as a drawer (see AppShell). */
export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 h-screen shrink-0 sticky top-0 z-40 bg-tb-forest text-tb-ivory">
      <SidebarContent />
    </aside>
  );
}
