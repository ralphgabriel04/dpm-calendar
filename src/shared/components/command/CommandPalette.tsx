"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Calendar,
  CheckSquare,
  Target,
  Flame,
  Shield,
  BarChart3,
  Settings,
  Plus,
  Search,
  Clock,
  Sun,
  Moon,
  Laptop,
  Zap,
  CalendarPlus,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { parseQuickCapture, formatParsedDate } from "@/shared/lib/nlp-parser";
import { trpc } from "@/infrastructure/trpc/client";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  name: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  group: string;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { openEventModal, openTaskModal } = useUIStore();

  // tRPC mutation for quick task creation
  const createTaskMutation = trpc.task.create.useMutation();

  // Parse the search input for NLP date detection
  const quickCapture = useMemo(() => {
    if (search.length < 3) return null;
    const result = parseQuickCapture(search);
    return result.isActionable ? result : null;
  }, [search]);

  // Handle quick task creation
  const handleQuickCreate = useCallback(async () => {
    if (!quickCapture) return;

    setIsCreating(true);
    try {
      await createTaskMutation.mutateAsync({
        title: quickCapture.title,
        dueAt: quickCapture.parsedDate || undefined,
        priority: "MEDIUM",
      });
      onOpenChange(false);
      setSearch("");
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsCreating(false);
    }
  }, [quickCapture, createTaskMutation, onOpenChange]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-calendar",
      name: "Aller au Calendrier",
      icon: Calendar,
      shortcut: "G C",
      action: () => router.push("/calendar"),
      group: "Navigation",
    },
    {
      id: "nav-tasks",
      name: "Aller aux Tâches",
      icon: CheckSquare,
      shortcut: "G T",
      action: () => router.push("/tasks"),
      group: "Navigation",
    },
    {
      id: "nav-habits",
      name: "Aller aux Habitudes",
      icon: Flame,
      shortcut: "G H",
      action: () => router.push("/habits"),
      group: "Navigation",
    },
    {
      id: "nav-goals",
      name: "Aller aux Objectifs",
      icon: Target,
      shortcut: "G O",
      action: () => router.push("/goals"),
      group: "Navigation",
    },
    {
      id: "nav-rules",
      name: "Aller aux Règles",
      icon: Shield,
      shortcut: "G R",
      action: () => router.push("/rules"),
      group: "Navigation",
    },
    {
      id: "nav-analytics",
      name: "Aller aux Analytics",
      icon: BarChart3,
      shortcut: "G A",
      action: () => router.push("/analytics"),
      group: "Navigation",
    },
    {
      id: "nav-settings",
      name: "Aller aux Paramètres",
      icon: Settings,
      shortcut: "G S",
      action: () => router.push("/settings"),
      group: "Navigation",
    },

    // Actions
    {
      id: "action-new-event",
      name: "Créer un événement",
      icon: Plus,
      shortcut: "N E",
      action: () => openEventModal("create"),
      group: "Actions",
    },
    {
      id: "action-new-task",
      name: "Créer une tâche",
      icon: Plus,
      shortcut: "N T",
      action: () => openTaskModal(),
      group: "Actions",
    },
    {
      id: "action-goto-today",
      name: "Aller à aujourd'hui",
      icon: Clock,
      shortcut: "T",
      action: () => {
        router.push("/calendar");
        // Could also dispatch an action to set the date
      },
      group: "Actions",
    },
  ];

  // Handle keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const runCommand = useCallback(
    (command: CommandItem) => {
      onOpenChange(false);
      command.action();
    },
    [onOpenChange]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Dialog */}
      <div className="absolute left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2">
        <Command
          className="rounded-lg border bg-card shadow-2xl overflow-hidden"
          loop
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Rechercher une commande..."
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé.
            </Command.Empty>

            {/* Quick Capture - NLP detected task */}
            {quickCapture && quickCapture.confidence > 0.3 && (
              <Command.Group heading="Capture rapide" className="px-2 py-1.5">
                <Command.Item
                  value={`quick-create-${quickCapture.title}`}
                  onSelect={handleQuickCreate}
                  disabled={isCreating}
                  className="flex items-center gap-3 rounded-md px-2 py-3 text-sm cursor-pointer aria-selected:bg-violet-500/10 aria-selected:text-violet-600 dark:aria-selected:text-violet-400 border border-transparent aria-selected:border-violet-500/30"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{quickCapture.title}</div>
                    {quickCapture.parsedDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <CalendarPlus className="h-3 w-3" />
                        <span>{formatParsedDate(quickCapture.parsedDate, quickCapture.language)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {isCreating ? (
                      <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        ↵
                      </kbd>
                    )}
                  </div>
                </Command.Item>
              </Command.Group>
            )}

            {/* Group: Navigation */}
            <Command.Group heading="Navigation" className="px-2 py-1.5">
              {commands
                .filter((cmd) => cmd.group === "Navigation")
                .map((command) => (
                  <Command.Item
                    key={command.id}
                    value={command.name}
                    onSelect={() => runCommand(command)}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent"
                  >
                    <command.icon className="h-4 w-4" />
                    <span>{command.name}</span>
                    {command.shortcut && (
                      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {command.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
            </Command.Group>

            {/* Group: Actions */}
            <Command.Group heading="Actions" className="px-2 py-1.5">
              {commands
                .filter((cmd) => cmd.group === "Actions")
                .map((command) => (
                  <Command.Item
                    key={command.id}
                    value={command.name}
                    onSelect={() => runCommand(command)}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent"
                  >
                    <command.icon className="h-4 w-4" />
                    <span>{command.name}</span>
                    {command.shortcut && (
                      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {command.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>↑↓ naviguer</span>
              <span>↵ sélectionner</span>
              <span>esc fermer</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
