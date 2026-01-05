import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PanelSizes {
  leftSidebar: number;
  rightSidebar: number;
  mainContentSplit: number;
  // Calendar page specific
  calendarSidebar: number;
  calendarTasksSidebar: number;
}

interface LayoutState {
  // Panel sizes (percentages)
  panelSizes: PanelSizes;

  // Collapse states
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  calendarSidebarCollapsed: boolean;
  calendarTasksSidebarCollapsed: boolean;

  // Actions
  setPanelSize: (panel: keyof PanelSizes, size: number) => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
  setCalendarSidebarCollapsed: (collapsed: boolean) => void;
  setCalendarTasksSidebarCollapsed: (collapsed: boolean) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleCalendarSidebar: () => void;
  toggleCalendarTasksSidebar: () => void;
  resetToDefaults: () => void;
}

const DEFAULT_PANEL_SIZES: PanelSizes = {
  leftSidebar: 15,
  rightSidebar: 18,
  mainContentSplit: 50,
  calendarSidebar: 20,
  calendarTasksSidebar: 18,
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      panelSizes: DEFAULT_PANEL_SIZES,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      calendarSidebarCollapsed: false,
      calendarTasksSidebarCollapsed: false,

      setPanelSize: (panel, size) =>
        set((state) => ({
          panelSizes: { ...state.panelSizes, [panel]: size },
        })),

      setLeftSidebarCollapsed: (collapsed) =>
        set({ leftSidebarCollapsed: collapsed }),

      setRightSidebarCollapsed: (collapsed) =>
        set({ rightSidebarCollapsed: collapsed }),

      setCalendarSidebarCollapsed: (collapsed) =>
        set({ calendarSidebarCollapsed: collapsed }),

      setCalendarTasksSidebarCollapsed: (collapsed) =>
        set({ calendarTasksSidebarCollapsed: collapsed }),

      toggleLeftSidebar: () =>
        set((state) => ({
          leftSidebarCollapsed: !state.leftSidebarCollapsed,
        })),

      toggleRightSidebar: () =>
        set((state) => ({
          rightSidebarCollapsed: !state.rightSidebarCollapsed,
        })),

      toggleCalendarSidebar: () =>
        set((state) => ({
          calendarSidebarCollapsed: !state.calendarSidebarCollapsed,
        })),

      toggleCalendarTasksSidebar: () =>
        set((state) => ({
          calendarTasksSidebarCollapsed: !state.calendarTasksSidebarCollapsed,
        })),

      resetToDefaults: () =>
        set({
          panelSizes: DEFAULT_PANEL_SIZES,
          leftSidebarCollapsed: false,
          rightSidebarCollapsed: false,
          calendarSidebarCollapsed: false,
          calendarTasksSidebarCollapsed: false,
        }),
    }),
    {
      name: "dpm-layout-storage",
      partialize: (state) => ({
        panelSizes: state.panelSizes,
        leftSidebarCollapsed: state.leftSidebarCollapsed,
        rightSidebarCollapsed: state.rightSidebarCollapsed,
        calendarSidebarCollapsed: state.calendarSidebarCollapsed,
        calendarTasksSidebarCollapsed: state.calendarTasksSidebarCollapsed,
      }),
    }
  )
);
