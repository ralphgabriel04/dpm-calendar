import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PanelSizes {
  leftSidebar: number;
  rightSidebar: number;
  mainContentSplit: number;
}

interface LayoutState {
  // Panel sizes (percentages)
  panelSizes: PanelSizes;

  // Collapse states
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;

  // Actions
  setPanelSize: (panel: keyof PanelSizes, size: number) => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  resetToDefaults: () => void;
}

const DEFAULT_PANEL_SIZES: PanelSizes = {
  leftSidebar: 15,
  rightSidebar: 18,
  mainContentSplit: 50,
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      panelSizes: DEFAULT_PANEL_SIZES,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,

      setPanelSize: (panel, size) =>
        set((state) => ({
          panelSizes: { ...state.panelSizes, [panel]: size },
        })),

      setLeftSidebarCollapsed: (collapsed) =>
        set({ leftSidebarCollapsed: collapsed }),

      setRightSidebarCollapsed: (collapsed) =>
        set({ rightSidebarCollapsed: collapsed }),

      toggleLeftSidebar: () =>
        set((state) => ({
          leftSidebarCollapsed: !state.leftSidebarCollapsed,
        })),

      toggleRightSidebar: () =>
        set((state) => ({
          rightSidebarCollapsed: !state.rightSidebarCollapsed,
        })),

      resetToDefaults: () =>
        set({
          panelSizes: DEFAULT_PANEL_SIZES,
          leftSidebarCollapsed: false,
          rightSidebarCollapsed: false,
        }),
    }),
    {
      name: "dpm-layout-storage",
      partialize: (state) => ({
        panelSizes: state.panelSizes,
        leftSidebarCollapsed: state.leftSidebarCollapsed,
        rightSidebarCollapsed: state.rightSidebarCollapsed,
      }),
    }
  )
);
