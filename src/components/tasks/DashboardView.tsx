"use client";

import { useMemo } from "react";
import {
  format,
  isToday,
  isTomorrow,
  isThisWeek,
  isPast,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  Calendar,
  ListTodo,
  Flame,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueAt: Date | null;
  plannedStartAt: Date | null;
  plannedDuration: number | null;
  priority: string;
  status: string;
  tags: string[];
  checklistItems: { id: string; title: string; isCompleted: boolean }[];
  subtasks: { id: string; status: string }[];
}

interface DashboardViewProps {
  tasks: Task[];
  onTaskClick: (task: any) => void;
}

const priorityLabels: Record<string, string> = {
  URGENT: "Urgente",
  HIGH: "Haute",
  MEDIUM: "Moyenne",
  LOW: "Faible",
};

const priorityColors: Record<string, string> = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-green-500",
};

export function DashboardView({ tasks, onTaskClick }: DashboardViewProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "DONE").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const todo = tasks.filter((t) => t.status === "TODO").length;
    const overdue = tasks.filter(
      (t) =>
        t.dueAt &&
        isPast(new Date(t.dueAt)) &&
        t.status !== "DONE" &&
        !isToday(new Date(t.dueAt))
    ).length;
    const dueToday = tasks.filter(
      (t) => t.dueAt && isToday(new Date(t.dueAt)) && t.status !== "DONE"
    ).length;
    const dueTomorrow = tasks.filter(
      (t) => t.dueAt && isTomorrow(new Date(t.dueAt)) && t.status !== "DONE"
    ).length;
    const dueThisWeek = tasks.filter(
      (t) =>
        t.dueAt &&
        isThisWeek(new Date(t.dueAt), { weekStartsOn: 1 }) &&
        t.status !== "DONE"
    ).length;

    // Priority breakdown
    const byPriority = {
      URGENT: tasks.filter((t) => t.priority === "URGENT" && t.status !== "DONE").length,
      HIGH: tasks.filter((t) => t.priority === "HIGH" && t.status !== "DONE").length,
      MEDIUM: tasks.filter((t) => t.priority === "MEDIUM" && t.status !== "DONE").length,
      LOW: tasks.filter((t) => t.priority === "LOW" && t.status !== "DONE").length,
    };

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      todo,
      overdue,
      dueToday,
      dueTomorrow,
      dueThisWeek,
      byPriority,
      completionRate,
    };
  }, [tasks]);

  // Get urgent/overdue tasks
  const urgentTasks = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          (t.priority === "URGENT" || t.priority === "HIGH" ||
            (t.dueAt && (isPast(new Date(t.dueAt)) || isToday(new Date(t.dueAt))))) &&
          t.status !== "DONE"
      )
      .slice(0, 5);
  }, [tasks]);

  // Get tasks for today
  const todayTasks = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          t.dueAt &&
          isToday(new Date(t.dueAt)) &&
          t.status !== "DONE"
      )
      .slice(0, 5);
  }, [tasks]);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={ListTodo}
            label="Total tâches"
            value={stats.total}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
          />
          <StatCard
            icon={CheckCircle2}
            label="Terminées"
            value={stats.completed}
            subValue={`${stats.completionRate}%`}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
          />
          <StatCard
            icon={Clock}
            label="En cours"
            value={stats.inProgress}
            color="text-yellow-500"
            bgColor="bg-yellow-500/10"
          />
          <StatCard
            icon={AlertTriangle}
            label="En retard"
            value={stats.overdue}
            color="text-red-500"
            bgColor="bg-red-500/10"
          />
        </div>

        {/* Progress bar */}
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Progression globale
            </h3>
            <span className="text-sm text-muted-foreground">
              {stats.completed} / {stats.total} tâches
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Priority breakdown */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-medium flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              Répartition par priorité
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center gap-3">
                  <span className={cn("text-sm font-medium w-20", priorityColors[priority])}>
                    {priorityLabels[priority]}
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        priority === "URGENT" && "bg-red-500",
                        priority === "HIGH" && "bg-orange-500",
                        priority === "MEDIUM" && "bg-yellow-500",
                        priority === "LOW" && "bg-green-500"
                      )}
                      style={{
                        width: `${
                          stats.total > 0
                            ? (count / (stats.total - stats.completed)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-medium flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              Échéances
            </h3>
            <div className="space-y-3">
              <TimelineItem
                label="En retard"
                count={stats.overdue}
                color="text-red-500"
                bgColor="bg-red-500/10"
              />
              <TimelineItem
                label="Aujourd'hui"
                count={stats.dueToday}
                color="text-orange-500"
                bgColor="bg-orange-500/10"
              />
              <TimelineItem
                label="Demain"
                count={stats.dueTomorrow}
                color="text-yellow-500"
                bgColor="bg-yellow-500/10"
              />
              <TimelineItem
                label="Cette semaine"
                count={stats.dueThisWeek}
                color="text-blue-500"
                bgColor="bg-blue-500/10"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Urgent tasks */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-medium flex items-center gap-2 mb-4">
              <Flame className="h-4 w-4 text-red-500" />
              Tâches urgentes
            </h3>
            {urgentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune tâche urgente
              </p>
            ) : (
              <div className="space-y-2">
                {urgentTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        task.priority === "URGENT" && "bg-red-500",
                        task.priority === "HIGH" && "bg-orange-500",
                        task.priority === "MEDIUM" && "bg-yellow-500",
                        task.priority === "LOW" && "bg-green-500"
                      )}
                    />
                    <span className="text-sm truncate flex-1">{task.title}</span>
                    {task.dueAt && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.dueAt), "dd MMM", { locale: fr })}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Today's tasks */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-medium flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              Tâches du jour
            </h3>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune tâche pour aujourd'hui
              </p>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        task.status === "IN_PROGRESS" && "bg-blue-500",
                        task.status === "TODO" && "bg-slate-400"
                      )}
                    />
                    <span className="text-sm truncate flex-1">{task.title}</span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        task.status === "IN_PROGRESS"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {task.status === "IN_PROGRESS" ? "En cours" : "À faire"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subValue?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {subValue && (
              <span className="text-sm text-muted-foreground">{subValue}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  count,
  color,
  bgColor,
}: {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium",
          count > 0 ? `${bgColor} ${color}` : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </div>
  );
}
