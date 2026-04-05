"use client";

import { useState, useMemo } from "react";
import { Plus, Search, X, Target, TrendingUp, CheckCircle2, Filter } from "lucide-react";
import { trpc } from "@/infrastructure/trpc/client";
import { cn } from "@/shared/lib/utils";

// Components
import { GoalCard, GoalModal, type GoalFormData } from "@/features/goals/components";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";

type StatusFilter = "ALL" | "ACTIVE" | "COMPLETED" | "PAUSED";

export default function GoalsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Fetch goals
  const { data: goalsData, refetch: refetchGoals } = trpc.goal.list.useQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter as "ACTIVE" | "COMPLETED" | "PAUSED",
    category: categoryFilter ?? undefined,
  });

  // Fetch categories
  const { data: categories } = trpc.goal.getCategories.useQuery();

  // Get a specific goal for editing
  const { data: editingGoal } = trpc.goal.get.useQuery(
    { id: editingGoalId! },
    { enabled: !!editingGoalId }
  );

  // Mutations
  const createGoalMutation = trpc.goal.create.useMutation({
    onSuccess: () => {
      refetchGoals();
      setModalOpen(false);
    },
  });

  const updateGoalMutation = trpc.goal.update.useMutation({
    onSuccess: () => {
      refetchGoals();
      setModalOpen(false);
      setEditingGoalId(null);
    },
  });

  const deleteGoalMutation = trpc.goal.delete.useMutation({
    onSuccess: () => {
      refetchGoals();
      setModalOpen(false);
      setEditingGoalId(null);
    },
  });

  // Filter goals
  const goals = useMemo(() => {
    if (!goalsData) return [];
    return goalsData.filter((goal) => {
      if (search && !goal.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [goalsData, search]);

  // Stats
  const stats = useMemo(() => {
    if (!goalsData) return { total: 0, active: 0, completed: 0, avgProgress: 0 };
    const active = goalsData.filter((g) => g.status === "ACTIVE").length;
    const completed = goalsData.filter((g) => g.status === "COMPLETED").length;
    const totalProgress = goalsData.reduce((sum, g) => {
      return sum + Math.min((g.currentValue / g.targetValue) * 100, 100);
    }, 0);
    return {
      total: goalsData.length,
      active,
      completed,
      avgProgress: goalsData.length > 0 ? Math.round(totalProgress / goalsData.length) : 0,
    };
  }, [goalsData]);

  // Handlers
  const handleCreateGoal = () => {
    setEditingGoalId(null);
    setModalOpen(true);
  };

  const handleEditGoal = (goalId: string) => {
    setEditingGoalId(goalId);
    setModalOpen(true);
  };

  const handleToggleStatus = (goalId: string, status: string) => {
    updateGoalMutation.mutate({
      id: goalId,
      status: status as "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED",
    });
  };

  const handleSubmitGoal = (data: GoalFormData) => {
    if (editingGoalId) {
      updateGoalMutation.mutate({
        id: editingGoalId,
        ...data,
      });
    } else {
      createGoalMutation.mutate(data);
    }
  };

  const handleDeleteGoal = () => {
    if (editingGoalId) {
      deleteGoalMutation.mutate({ id: editingGoalId });
    }
  };

  // Get initial data for editing
  const initialFormData = useMemo(() => {
    if (!editingGoal) return undefined;
    return {
      title: editingGoal.title,
      description: editingGoal.description ?? undefined,
      category: editingGoal.category ?? undefined,
      targetType: editingGoal.targetType as GoalFormData["targetType"],
      targetValue: editingGoal.targetValue,
      unit: editingGoal.unit ?? undefined,
      startDate: editingGoal.startDate ? new Date(editingGoal.startDate) : undefined,
      endDate: editingGoal.endDate ? new Date(editingGoal.endDate) : undefined,
    };
  }, [editingGoal]);

  const statusOptions = [
    { value: "ALL", label: "Tous" },
    { value: "ACTIVE", label: "Actifs" },
    { value: "COMPLETED", label: "Complétés" },
    { value: "PAUSED", label: "En pause" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Objectifs</h1>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {statusOptions.find((s) => s.value === statusFilter)?.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setStatusFilter(option.value as StatusFilter)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Category filter */}
          {categories && categories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {categoryFilter || "Catégorie"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCategoryFilter(null)}>
                  Toutes
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button onClick={handleCreateGoal} className="gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvel objectif</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Objectifs</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Complétés</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgProgress}%</p>
                <p className="text-sm text-muted-foreground">Progression moy.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Goals list */}
        {goals.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-4 mb-4 inline-block">
                <Target className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">Aucun objectif</p>
              <p className="text-sm mt-1">Créez votre premier objectif pour commencer</p>
              <Button onClick={handleCreateGoal} className="mt-4">
                Créer un objectif
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={{
                  ...goal,
                  startDate: goal.startDate ? new Date(goal.startDate) : null,
                  endDate: goal.endDate ? new Date(goal.endDate) : null,
                }}
                onEdit={handleEditGoal}
                onDelete={(id) => deleteGoalMutation.mutate({ id })}
                onToggleStatus={handleToggleStatus}
                onClick={handleEditGoal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Goal Modal */}
      <GoalModal
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setModalOpen(false);
            setEditingGoalId(null);
          }
        }}
        initialData={initialFormData}
        onSubmit={handleSubmitGoal}
        onDelete={editingGoalId ? handleDeleteGoal : undefined}
        isLoading={createGoalMutation.isPending || updateGoalMutation.isPending}
        mode={editingGoalId ? "edit" : "create"}
        existingCategories={categories || []}
      />
    </div>
  );
}
