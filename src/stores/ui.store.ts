import { create } from "zustand";

interface UIState {
  // Modals
  eventModalOpen: boolean;
  eventModalMode: "create" | "edit";
  selectedEventId: string | null;
  eventModalDefaultDate: Date | null;

  taskModalOpen: boolean;
  selectedTaskId: string | null;

  commandPaletteOpen: boolean;

  // Sidebar
  sidebarCollapsed: boolean;

  // Actions
  openEventModal: (
    mode: "create" | "edit",
    eventId?: string,
    defaultDate?: Date
  ) => void;
  closeEventModal: () => void;
  openTaskModal: (taskId?: string) => void;
  closeTaskModal: () => void;
  toggleCommandPalette: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  eventModalOpen: false,
  eventModalMode: "create",
  selectedEventId: null,
  eventModalDefaultDate: null,
  taskModalOpen: false,
  selectedTaskId: null,
  commandPaletteOpen: false,
  sidebarCollapsed: false,

  openEventModal: (mode, eventId, defaultDate) =>
    set({
      eventModalOpen: true,
      eventModalMode: mode,
      selectedEventId: eventId || null,
      eventModalDefaultDate: defaultDate || null,
    }),

  closeEventModal: () =>
    set({
      eventModalOpen: false,
      selectedEventId: null,
      eventModalDefaultDate: null,
    }),

  openTaskModal: (taskId) =>
    set({
      taskModalOpen: true,
      selectedTaskId: taskId || null,
    }),

  closeTaskModal: () =>
    set({
      taskModalOpen: false,
      selectedTaskId: null,
    }),

  toggleCommandPalette: () =>
    set((state) => ({
      commandPaletteOpen: !state.commandPaletteOpen,
    })),

  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
