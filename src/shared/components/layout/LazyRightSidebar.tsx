"use client";

import dynamic from "next/dynamic";
import { useLayoutStore } from "@/stores/layout.store";
import { ChevronLeft } from "lucide-react";

// Lazy load the full RightSidebarMenu only when expanded
const RightSidebarMenu = dynamic(
  () => import("./RightSidebarMenu").then((mod) => ({ default: mod.RightSidebarMenu })),
  {
    ssr: false,
    loading: () => <RightSidebarSkeleton />,
  }
);

function RightSidebarSkeleton() {
  return (
    <div className="flex h-full w-full">
      {/* Icon menu skeleton */}
      <div className="w-12 flex-shrink-0 border-l bg-card/50 flex flex-col items-center py-4 gap-1">
        <div className="p-2 mb-2">
          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-2">
            <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Lazy-loaded right sidebar that:
 * - Shows minimal collapsed state when sidebar is collapsed
 * - Only loads full RightSidebarMenu component when expanded
 * - Defers data fetching until component is visible
 */
export function LazyRightSidebar() {
  const { rightSidebarCollapsed, setRightSidebarCollapsed } = useLayoutStore();

  // When collapsed, show minimal UI without loading the full component
  if (rightSidebarCollapsed) {
    return (
      <div className="flex items-start pt-4 w-full h-full bg-card border-l">
        <button
          onClick={() => setRightSidebarCollapsed(false)}
          className="p-2 hover:bg-accent rounded-md"
          aria-label="Expand sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // When expanded, lazy-load the full component
  return <RightSidebarMenu />;
}
