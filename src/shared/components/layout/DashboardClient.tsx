"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/shared/hooks";
import { ResizableLayout } from "./ResizableLayout";
import { Sidebar, SidebarTrigger } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { RightSidebarMenu } from "./RightSidebarMenu";
import { SyncStatus, useAutoSync } from "@/features/sync";

interface DashboardClientProps {
  children: React.ReactNode;
}

export function DashboardClient({ children }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  // Initialize auto-sync for calendar accounts
  useAutoSync({ enabled: mounted, showToasts: false });

  // Wait for client-side hydration to complete before rendering
  // This prevents hydration mismatch errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a minimal loading skeleton during SSR/hydration
  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="w-64 bg-card border-r" />
        <div className="flex-1" />
      </div>
    );
  }

  // Mobile layout (no resize)
  if (isMobile) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="flex h-14 items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="font-semibold text-sm">DPM Calendar</h1>
            </div>
            <SyncStatus showDetails={false} />
          </header>

          {/* Main content - add bottom padding for mobile nav */}
          <main className="flex-1 overflow-auto pb-16">{children}</main>
        </div>

        {/* Mobile bottom navigation */}
        <MobileNav />
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ResizableLayout
        leftPanel={<Sidebar />}
        mainContent={
          <div className="flex flex-1 flex-col overflow-hidden h-full">
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        }
        rightPanel={<RightSidebarMenu />}
      />
    </div>
  );
}
