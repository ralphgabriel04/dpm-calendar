import { create } from "zustand";
import { persist } from "zustand/middleware";

type TaskViewType = "list" | "kanban" | "calendar";

type SortBy = "dueAt" | "priority" | "createdAt" | "title";
type SortOrder = "asc" | "desc";

interface TaskFilters {
  status: string[];
  priority: string[];
  tags: string[];
  search: string;
  showCompleted: boolean;
}

interface TaskState {
  // View
  viewType: TaskViewType;
  setViewType: (viewType: TaskViewType) => void;

  // Filters
  filters: TaskFilters;
  setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  resetFilters: () => void;

  // Sorting
  sortBy: SortBy;
  sortOrder: SortOrder;
  setSortBy: (sortBy: SortBy) => void;
  toggleSortOrder: () => void;

  // Selection
  selectedTaskIds: string[];
  selectTask: (taskId: string) => void;
  deselectTask: (taskId: string) => void;
  toggleTaskSelection: (taskId: string) => void;
  clearSelection: () => void;
  selectAll: (taskIds: string[]) => void;
}

const defaultFilters: TaskFilters = {
  status: [],
  priority: [],
  tags: [],
  search: "",
  showCompleted: false,
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      viewType: "list",
      setViewType: (viewType) => set({ viewType }),

      filters: defaultFilters,
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      resetFilters: () => set({ filters: defaultFilters }),

      sortBy: "dueAt",
      sortOrder: "asc",
      setSortBy: (sortBy) => set({ sortBy }),
      toggleSortOrder: () =>
        set((state) => ({
          sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
        })),

      selectedTaskIds: [],
      selectTask: (taskId) =>
        set((state) => ({
          selectedTaskIds: [...state.selectedTaskIds, taskId],
        })),
      deselectTask: (taskId) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.filter((id) => id !== taskId),
        })),
      toggleTaskSelection: (taskId) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.includes(taskId)
            ? state.selectedTaskIds.filter((id) => id !== taskId)
            : [...state.selectedTaskIds, taskId],
        })),
      clearSelection: () => set({ selectedTaskIds: [] }),
      selectAll: (taskIds) => set({ selectedTaskIds: taskIds }),
    }),
    {
      name: "dpm-task-storage",
      partialize: (state) => ({
        viewType: state.viewType,
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);
