"use client";

import { useState } from "react";
import {
  CalendarDays,
  Target,
  Flame,
  Archive,
  Search,
  Zap,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Clock,
  Inbox,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { trpc } from "@/lib/trpc";
import Link from "next/link";

type PanelType = "tasks" | "objectives" | "habits" | "backlog" | "archive" | "rules" | "analytics" | "search" | null;

interface MenuItem {
  id: PanelType;
  icon: React.ElementType;
  label: string;
  href?: string;
}

const menuItems: MenuItem[] = [
  { id: "tasks", icon: CalendarDays, label: "Taches du jour" },
  { id: "objectives", icon: Target, label: "Objectifs" },
  { id: "habits", icon: Flame, label: "Habitudes" },
  { id: "backlog", icon: Inbox, label: "Backlog" },
  { id: "archive", icon: Archive, label: "Archive" },
  { id: "rules", icon: Zap, label: "Regles", href: "/rules" },
  { id: "analytics", icon: BarChart3, label: "Analytics", href: "/analytics" },
  { id: "search", icon: Search, label: "Recherche" },
];

export function RightSidebarMenu() {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDateFilter, setSearchDateFilter] = useState<"anytime" | "today" | "week" | "month">("anytime");

  // Fetch data
  const { data: todayTasks } = trpc.task.list.useQuery({
    status: ["TODO", "IN_PROGRESS"],
  });

  const { data: goals } = trpc.goal.list.useQuery({});

  const { data: habits } = trpc.habit.list.useQuery({});

  const { data: backlogTasks } = trpc.task.list.useQuery({
    status: ["TODO"],
    includeCompleted: false,
  });

  const { data: archivedTasks } = trpc.task.list.useQuery({
    status: ["DONE", "CANCELLED"],
    includeCompleted: true,
  });

  const { data: searchResults } = trpc.task.list.useQuery(
    { search: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const handleMenuClick = (item: MenuItem) => {
    if (item.href) {
      // Navigation items - don't open panel
      return;
    }
    if (activePanel === item.id) {
      setActivePanel(null);
    } else {
      setActivePanel(item.id);
    }
  };

  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  const renderPanel = () => {
    switch (activePanel) {
      case "tasks":
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h3 className="font-semibold">
                {format(new Date(), "EEEE", { locale: fr })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "d MMMM", { locale: fr })}
              </p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <span>Tasks</span>
                <span className="text-xs">T</span>
              </div>
              {todayTasks && todayTasks.length > 0 ? (
                <div className="space-y-2">
                  {todayTasks.slice(0, 10).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center",
                          task.status === "DONE"
                            ? "bg-primary border-primary"
                            : "border-muted-foreground"
                        )}
                      >
                        {task.status === "DONE" && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm flex-1",
                        task.status === "DONE" && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </span>
                      {task.plannedDuration && (
                        <span className="text-xs text-muted-foreground">
                          {task.plannedDuration}m
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full p-2 rounded-md hover:bg-accent">
                  <Plus className="h-4 w-4" />
                  Add task
                </button>
              )}
            </div>
          </div>
        );

      case "objectives":
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Weekly objectives</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWeekOffset((w) => w - 1)}
                    className="p-1 hover:bg-accent rounded"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setWeekOffset((w) => w + 1)}
                    className="p-1 hover:bg-accent rounded"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(currentWeekStart, "d MMMM", { locale: fr })} -{" "}
                {format(currentWeekEnd, "d MMMM", { locale: fr })}
              </p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {goals && goals.length > 0 ? (
                <div className="space-y-2">
                  {goals.slice(0, 5).map((goal) => {
                    const progress = goal.targetValue > 0
                      ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
                      : 0;
                    return (
                      <div
                        key={goal.id}
                        className="p-3 rounded-md border hover:bg-accent cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{goal.title}</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto p-2 rounded-md hover:bg-accent">
                    <Plus className="h-4 w-4" />
                    Add objective
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Add your key objectives for this week.
                  </p>
                </div>
              )}
            </div>
            <div className="p-3 border-t text-center">
              <Link
                href="/goals"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Objectives - R
              </Link>
            </div>
          </div>
        );

      case "habits":
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Habitudes</h3>
              <p className="text-sm text-muted-foreground">
                Suivi quotidien
              </p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {habits && habits.length > 0 ? (
                <div className="space-y-2">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent cursor-pointer"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: habit.color || "#3b82f6" }}
                      >
                        <Flame className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{habit.name}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span>{habit.currentStreak || 0} jours</span>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded border-2 border-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Link
                    href="/habits"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto p-2 rounded-md hover:bg-accent inline-flex"
                  >
                    <Plus className="h-4 w-4" />
                    Creer une habitude
                  </Link>
                </div>
              )}
            </div>
            <div className="p-3 border-t text-center">
              <Link
                href="/habits"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Voir toutes les habitudes
              </Link>
            </div>
          </div>
        );

      case "backlog":
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Backlog</h3>
                  <p className="text-xs text-muted-foreground"># all</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    className="h-7 w-24 pl-7 text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full p-2 rounded-md hover:bg-accent mb-4">
                <Plus className="h-4 w-4" />
                Add a task
              </button>
              {backlogTasks && backlogTasks.filter(t => !t.dueAt).length > 0 ? (
                <div className="space-y-2">
                  {backlogTasks
                    .filter((t) => !t.dueAt)
                    .slice(0, 10)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                      >
                        <div className="w-4 h-4 rounded border-2 border-muted-foreground" />
                        <span className="text-sm flex-1">{task.title}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add tasks you want to work on someday but aren&apos;t ready to
                  commit to yet.
                </p>
              )}
            </div>
            <div className="p-3 border-t text-center">
              <span className="text-xs text-muted-foreground">Backlog - B</span>
            </div>
          </div>
        );

      case "archive":
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-archive</span>
                <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Archive</h3>
                <button className="text-xs text-muted-foreground hover:text-foreground">
                  Delete all
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks which have rolled over at least:{" "}
                <span className="text-primary cursor-pointer">4 consecutive days</span>
              </p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {archivedTasks && archivedTasks.length > 0 ? (
                <div className="space-y-2">
                  {archivedTasks.slice(0, 10).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer opacity-60"
                    >
                      <div className="w-4 h-4 rounded border-2 border-muted-foreground bg-muted" />
                      <span className="text-sm flex-1 line-through">
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Empty.</p>
              )}
            </div>
            <div className="p-3 border-t text-center">
              <span className="text-xs text-muted-foreground">Archive - A</span>
            </div>
          </div>
        );

      case "search":
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs">
                <button className="text-primary font-medium">Filter</button>
                <span className="text-muted-foreground">Date:</span>
                <select
                  value={searchDateFilter}
                  onChange={(e) =>
                    setSearchDateFilter(
                      e.target.value as typeof searchDateFilter
                    )
                  }
                  className="bg-transparent text-muted-foreground"
                >
                  <option value="anytime">Anytime</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
                <span className="text-muted-foreground">Channel:</span>
                <span className="text-muted-foreground">all</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {searchQuery && searchResults && searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-md hover:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{task.title}</span>
                        {task.dueAt && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(task.dueAt), "MMM d", { locale: fr })}
                          </span>
                        )}
                      </div>
                      {task.tags && task.tags.length > 0 && (
                        <span className="text-xs text-primary">
                          # {task.tags[0]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No results found
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Enter a search term
                </p>
              )}
            </div>
            <div className="p-3 border-t text-center">
              <span className="text-xs text-muted-foreground">
                Search - Ctrl F
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex items-start pt-4 w-full h-full bg-card border-l">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-accent rounded-md"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      {/* Panel content */}
      {activePanel && (
        <div className="flex-1 min-w-0 border-l bg-card flex flex-col">
          <div className="flex items-center justify-between p-2 border-b">
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 hover:bg-accent rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">{renderPanel()}</div>
        </div>
      )}

      {/* Icon menu */}
      <div className="w-12 flex-shrink-0 border-l bg-card/50 flex flex-col items-center py-4 gap-1">
        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-2 hover:bg-accent rounded-md mb-2"
          title="Reduire"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Menu items */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "p-2 rounded-md transition-colors relative",
                  "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={cn(
                "p-2 rounded-md transition-colors relative",
                isActive
                  ? "bg-accent text-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add button */}
        <button
          className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
          title="Ajouter"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
