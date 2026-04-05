"use client";

import { useState, useMemo } from "react";
import { Plus, Search, X, Flame, Target, Calendar } from "lucide-react";
import { format, startOfWeek, eachDayOfInterval, endOfWeek, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useHabitStore } from "@/stores/habit.store";
import { trpc } from "@/infrastructure/trpc/client";
import { cn } from "@/shared/lib/utils";

// Components
import { HabitCard, HabitModal, StreakDisplay, type HabitFormData } from "@/components/habits";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";

export default function HabitsPage() {
  const { filters, setFilter, habitModalOpen, editingHabitId, openHabitModal, closeHabitModal } =
    useHabitStore();

  // Fetch habits with today status
  const { data: habitsData, refetch: refetchHabits } = trpc.habit.getTodayStatus.useQuery();

  // Get a specific habit for editing
  const { data: editingHabit } = trpc.habit.get.useQuery(
    { id: editingHabitId! },
    { enabled: !!editingHabitId }
  );

  // Mutations
  const createHabitMutation = trpc.habit.create.useMutation({
    onSuccess: () => {
      refetchHabits();
      closeHabitModal();
    },
  });

  const updateHabitMutation = trpc.habit.update.useMutation({
    onSuccess: () => {
      refetchHabits();
      closeHabitModal();
    },
  });

  const deleteHabitMutation = trpc.habit.delete.useMutation({
    onSuccess: () => {
      refetchHabits();
      closeHabitModal();
    },
  });

  const logHabitMutation = trpc.habit.log.useMutation({
    onSuccess: () => refetchHabits(),
  });

  // Filter habits
  const habits = useMemo(() => {
    if (!habitsData) return [];
    return habitsData.filter((habit) => {
      if (filters.search && !habit.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (!filters.showInactive && !habit.isActive) {
        return false;
      }
      return true;
    });
  }, [habitsData, filters]);

  // Stats
  const stats = useMemo(() => {
    if (!habits.length) return { completed: 0, total: 0, totalStreak: 0 };
    const completed = habits.filter((h) => h.completedToday).length;
    const totalStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0);
    return { completed, total: habits.length, totalStreak };
  }, [habits]);

  // Handlers
  const handleCreateHabit = () => {
    openHabitModal();
  };

  const handleEditHabit = (habitId: string) => {
    openHabitModal(habitId);
  };

  const handleToggleHabit = (habitId: string, completed: boolean) => {
    logHabitMutation.mutate({
      habitId,
      date: new Date(),
      completed,
    });
  };

  const handleSubmitHabit = (data: HabitFormData) => {
    // Convert null goalId to undefined for the mutation
    const mutationData = {
      ...data,
      goalId: data.goalId ?? undefined,
    };

    if (editingHabitId) {
      updateHabitMutation.mutate({
        id: editingHabitId,
        ...mutationData,
      });
    } else {
      createHabitMutation.mutate(mutationData);
    }
  };

  const handleDeleteHabit = () => {
    if (editingHabitId) {
      deleteHabitMutation.mutate({ id: editingHabitId });
    }
  };

  // Get initial data for editing
  const initialFormData = useMemo(() => {
    if (!editingHabit) return undefined;
    return {
      name: editingHabit.name,
      description: editingHabit.description ?? undefined,
      color: editingHabit.color ?? undefined,
      icon: editingHabit.icon ?? undefined,
      habitType: editingHabit.habitType as HabitFormData["habitType"],
      frequency: editingHabit.frequency as HabitFormData["frequency"],
      targetCount: editingHabit.targetCount,
      duration: editingHabit.duration ?? undefined,
      preferredTime: editingHabit.preferredTime ?? undefined,
      preferredDays: editingHabit.preferredDays ?? undefined,
      isProtected: editingHabit.isProtected,
      goalId: editingHabit.goalId ?? undefined,
    };
  }, [editingHabit]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Habitudes</h1>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="pl-9 w-64"
            />
            {filters.search && (
              <button
                onClick={() => setFilter("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <Button onClick={handleCreateHabit} className="gap-1">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle habitude</span>
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.completed}/{stats.total}
                </p>
                <p className="text-sm text-muted-foreground">Complétées aujourd'hui</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalStreak}</p>
                <p className="text-sm text-muted-foreground">Jours de série combinés</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Taux de complétion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Date display */}
        <div className="mb-4">
          <h2 className="text-lg font-medium">
            {format(new Date(), "EEEE d MMMM", { locale: fr })}
          </h2>
        </div>

        {/* Habits list */}
        {habits.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-4 mb-4 inline-block">
                <Flame className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">Aucune habitude</p>
              <p className="text-sm mt-1">Créez votre première habitude pour commencer</p>
              <Button onClick={handleCreateHabit} className="mt-4">
                Créer une habitude
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completedToday={habit.completedToday}
                todayCount={habit.todayCount}
                onToggle={handleToggleHabit}
                onEdit={handleEditHabit}
                onDelete={(id) => deleteHabitMutation.mutate({ id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Habit Modal */}
      <HabitModal
        open={habitModalOpen}
        onOpenChange={(open) => {
          if (!open) closeHabitModal();
        }}
        initialData={initialFormData}
        onSubmit={handleSubmitHabit}
        onDelete={editingHabitId ? handleDeleteHabit : undefined}
        isLoading={createHabitMutation.isPending || updateHabitMutation.isPending}
        mode={editingHabitId ? "edit" : "create"}
      />
    </div>
  );
}
