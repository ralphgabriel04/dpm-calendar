import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HabitFilters {
  search: string;
  showInactive: boolean;
  goalId: string | null;
}

interface HabitState {
  // Filters
  filters: HabitFilters;
  setFilter: <K extends keyof HabitFilters>(key: K, value: HabitFilters[K]) => void;
  resetFilters: () => void;

  // Modal
  habitModalOpen: boolean;
  editingHabitId: string | null;
  openHabitModal: (habitId?: string) => void;
  closeHabitModal: () => void;

  // Selection
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const defaultFilters: HabitFilters = {
  search: "",
  showInactive: false,
  goalId: null,
};

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      resetFilters: () => set({ filters: defaultFilters }),

      habitModalOpen: false,
      editingHabitId: null,
      openHabitModal: (habitId) =>
        set({ habitModalOpen: true, editingHabitId: habitId ?? null }),
      closeHabitModal: () => set({ habitModalOpen: false, editingHabitId: null }),

      selectedDate: new Date(),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: "dpm-habit-storage",
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);
