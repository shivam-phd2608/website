"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useFarm } from "@/lib/store";
import { LoginScreen } from "@/components/login-screen";
import { Sidebar, SidebarContent } from "@/components/sidebar";
import { Header } from "@/components/header";
import { QuickExpenseModal } from "@/components/quick-expense-modal";
import { QuickContributionModal } from "@/components/quick-contribution-modal";
import { QuickHarvestModal } from "@/components/quick-harvest-modal";
import { FlowPipeline } from "@/components/flow-pipeline";
import { FarmLogo } from "@/components/farm-logo";

function Splash() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-tb-forest">
      <div className="flex flex-col items-center gap-5">
        <FarmLogo variant="light" size="md" />
        <div className="w-6 h-6 border-2 border-tb-sage border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, authReady, passwordRecovery } = useFarm();
  const [isMounted, setIsMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Render only in the browser: login state and saved data are not available on the server
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setIsMounted(true), []);

  if (!isMounted || !authReady) return <Splash />;
  if (!currentUser || passwordRecovery) return <LoginScreen />;

  const isHome = (pathname.replace(/\/+$/, "") || "/") === "/";

  return (
    <div className="flex w-full h-[100dvh] overflow-hidden bg-tb-ivory">
      <Sidebar />

      {/* Phone / tablet drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-tb-forest/50 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[300px] bg-tb-forest text-tb-ivory shadow-2xl">
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        <div className="shrink-0 z-30 relative">
          <Header onOpenMenu={() => setMenuOpen(true)} />
          {/* The 6-step flower journey strip: always on the dashboard, on laptops for every page */}
          <div className={isHome ? "px-3 sm:px-6 py-2.5 bg-tb-ivory border-b border-tb-line" : "hidden lg:block px-6 py-2.5 bg-tb-ivory border-b border-tb-line"}>
            <FlowPipeline />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24">{children}</div>
        </main>
      </div>

      <QuickExpenseModal />
      <QuickContributionModal />
      <QuickHarvestModal />
    </div>
  );
}
