"use client";

import { useState, useMemo } from "react";
import { Plus, Search, X, Shield, Zap, BookTemplate, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Components
import { RuleCard, RuleModal, type RuleFormData } from "@/components/rules";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

type TypeFilter = "ALL" | "PROTECTION" | "AUTO_SCHEDULE" | "BREAK" | "CONDITIONAL";

export default function RulesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch rules
  const { data: rulesData, refetch: refetchRules } = trpc.rule.list.useQuery({
    ruleType: typeFilter === "ALL" ? undefined : typeFilter,
    isActive: showInactive ? undefined : true,
  });

  // Fetch templates
  const { data: templates } = trpc.rule.getTemplates.useQuery();

  // Get a specific rule for editing
  const { data: editingRule } = trpc.rule.get.useQuery(
    { id: editingRuleId! },
    { enabled: !!editingRuleId }
  );

  // Mutations
  const createRuleMutation = trpc.rule.create.useMutation({
    onSuccess: () => {
      refetchRules();
      setModalOpen(false);
    },
  });

  const updateRuleMutation = trpc.rule.update.useMutation({
    onSuccess: () => {
      refetchRules();
      setModalOpen(false);
      setEditingRuleId(null);
    },
  });

  const deleteRuleMutation = trpc.rule.delete.useMutation({
    onSuccess: () => {
      refetchRules();
      setModalOpen(false);
      setEditingRuleId(null);
    },
  });

  const toggleRuleMutation = trpc.rule.toggle.useMutation({
    onSuccess: () => refetchRules(),
  });

  const executeRuleMutation = trpc.rule.execute.useMutation({
    onSuccess: () => refetchRules(),
  });

  // Filter rules
  const rules = useMemo(() => {
    if (!rulesData) return [];
    return rulesData.filter((rule) => {
      if (search && !rule.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [rulesData, search]);

  // Stats
  const stats = useMemo(() => {
    if (!rulesData) return { total: 0, active: 0, executions: 0 };
    const active = rulesData.filter((r) => r.isActive).length;
    const executions = rulesData.reduce((sum, r) => sum + r.triggerCount, 0);
    return { total: rulesData.length, active, executions };
  }, [rulesData]);

  // Handlers
  const handleCreateRule = () => {
    setEditingRuleId(null);
    setModalOpen(true);
  };

  const handleEditRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
    setModalOpen(true);
  };

  const handleSubmitRule = (data: RuleFormData) => {
    if (editingRuleId) {
      updateRuleMutation.mutate({
        id: editingRuleId,
        ...data,
      });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const handleDeleteRule = () => {
    if (editingRuleId) {
      deleteRuleMutation.mutate({ id: editingRuleId });
    }
  };

  const handleUseTemplate = (template: NonNullable<typeof templates>[0]) => {
    createRuleMutation.mutate({
      name: template.name,
      description: template.description,
      ruleType: template.ruleType as RuleFormData["ruleType"],
      triggerType: template.triggerType as RuleFormData["triggerType"],
      conditions: template.conditions as RuleFormData["conditions"],
      actions: template.actions as RuleFormData["actions"],
      priority: 0,
      isActive: true,
    });
    setShowTemplates(false);
  };

  // Get initial data for editing
  const initialFormData = useMemo(() => {
    if (!editingRule) return undefined;
    return {
      name: editingRule.name,
      description: editingRule.description ?? undefined,
      ruleType: editingRule.ruleType as RuleFormData["ruleType"],
      triggerType: editingRule.triggerType as RuleFormData["triggerType"],
      schedule: editingRule.schedule ?? undefined,
      dayTypes: editingRule.dayTypes ?? undefined,
      conditions: (editingRule.conditions as unknown as RuleFormData["conditions"]) || [],
      actions: (editingRule.actions as unknown as RuleFormData["actions"]) || [],
      priority: editingRule.priority,
      isActive: editingRule.isActive,
    };
  }, [editingRule]);

  const typeOptions = [
    { value: "ALL", label: "Tous les types" },
    { value: "PROTECTION", label: "Protection" },
    { value: "AUTO_SCHEDULE", label: "Auto-planification" },
    { value: "BREAK", label: "Pause" },
    { value: "CONDITIONAL", label: "Conditionnel" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Règles</h1>

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
          {/* Type filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {typeOptions.find((t) => t.value === typeFilter)?.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {typeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTypeFilter(option.value as TypeFilter)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Templates */}
          <DropdownMenu open={showTemplates} onOpenChange={setShowTemplates}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <BookTemplate className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {templates?.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleUseTemplate(template)}
                  className="flex-col items-start"
                >
                  <span className="font-medium">{template.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {template.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleCreateRule} className="gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle règle</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Règles créées</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Règles actives</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.executions}</p>
                <p className="text-sm text-muted-foreground">Exécutions totales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle inactive */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="showInactive" className="text-sm text-muted-foreground">
            Afficher les règles inactives
          </label>
        </div>

        {/* Rules list */}
        {rules.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-4 mb-4 inline-block">
                <Shield className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">Aucune règle</p>
              <p className="text-sm mt-1">
                Créez des règles pour automatiser votre calendrier
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button onClick={handleCreateRule}>Créer une règle</Button>
                <Button variant="outline" onClick={() => setShowTemplates(true)}>
                  Utiliser un template
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={{
                  ...rule,
                  lastTriggeredAt: rule.lastTriggeredAt
                    ? new Date(rule.lastTriggeredAt)
                    : null,
                }}
                onEdit={handleEditRule}
                onDelete={(id) => deleteRuleMutation.mutate({ id })}
                onToggle={(id) => toggleRuleMutation.mutate({ id })}
                onExecute={(id) => executeRuleMutation.mutate({ id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Rule Modal */}
      <RuleModal
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setModalOpen(false);
            setEditingRuleId(null);
          }
        }}
        initialData={initialFormData}
        onSubmit={handleSubmitRule}
        onDelete={editingRuleId ? handleDeleteRule : undefined}
        isLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
        mode={editingRuleId ? "edit" : "create"}
      />
    </div>
  );
}
