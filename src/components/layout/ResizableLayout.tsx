"use client";

import { Panel, Group } from "react-resizable-panels";
import { useLayoutStore } from "@/stores/layout.store";
import { ResizableHandle } from "./ResizableHandle";
import { cn } from "@/lib/utils";

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  mainContent: React.ReactNode;
  rightPanel?: React.ReactNode;
  className?: string;
}

export function ResizableLayout({
  leftPanel,
  mainContent,
  rightPanel,
  className,
}: ResizableLayoutProps) {
  const {
    panelSizes,
    leftSidebarCollapsed,
    rightSidebarCollapsed,
    setPanelSize,
  } = useLayoutStore();

  return (
    <Group
      orientation="horizontal"
      id="dpm-main-layout"
      className={cn("h-full", className)}
    >
      {/* Left Sidebar Panel */}
      <Panel
        id="left-sidebar"
        defaultSize={leftSidebarCollapsed ? "4%" : `${panelSizes.leftSidebar}%`}
        minSize="4%"
        maxSize="30%"
        collapsible
        collapsedSize="4%"
        onResize={(panelSize) => {
          if (!leftSidebarCollapsed && panelSize.asPercentage > 4) {
            setPanelSize("leftSidebar", panelSize.asPercentage);
          }
        }}
      >
        {leftPanel}
      </Panel>

      <ResizableHandle disabled={leftSidebarCollapsed} />

      {/* Main Content Panel */}
      <Panel
        id="main-content"
        minSize="30%"
      >
        {mainContent}
      </Panel>

      {rightPanel && (
        <>
          <ResizableHandle disabled={rightSidebarCollapsed} />

          {/* Right Sidebar Panel */}
          <Panel
            id="right-sidebar"
            defaultSize={rightSidebarCollapsed ? "3%" : `${panelSizes.rightSidebar}%`}
            minSize="3%"
            maxSize="35%"
            collapsible
            collapsedSize="3%"
            onResize={(panelSize) => {
              if (!rightSidebarCollapsed && panelSize.asPercentage > 3) {
                setPanelSize("rightSidebar", panelSize.asPercentage);
              }
            }}
          >
            {rightPanel}
          </Panel>
        </>
      )}
    </Group>
  );
}
