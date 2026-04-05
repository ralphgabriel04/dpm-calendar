"use client";

import {
  Shield,
  Clock,
  Coffee,
  Zap,
  MoreVertical,
  Pencil,
  Trash2,
  Play,
  Pause,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/components/ui/Badge";
import { Switch } from "@/shared/components/ui/Switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";

interface RuleCardProps {
  rule: {
    id: string;
    name: string;
    description?: string | null;
    ruleType: string;
    triggerType: string;
    isActive: boolean;
    priority: number;
    lastTriggeredAt?: Date | null;
    triggerCount: number;
    _count?: { executions: number };
  };
  onEdit: (ruleId: string) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string) => void;
  onExecute: (ruleId: string) => void;
}

const ruleTypeIcons: Record<string, React.ElementType> = {
  PROTECTION: Shield,
  AUTO_SCHEDULE: Clock,
  BREAK: Coffee,
  CONDITIONAL: Zap,
};

const ruleTypeLabels: Record<string, string> = {
  PROTECTION: "Protection",
  AUTO_SCHEDULE: "Auto-planification",
  BREAK: "Pause",
  CONDITIONAL: "Conditionnel",
};

const ruleTypeColors: Record<string, string> = {
  PROTECTION: "bg-purple-100 text-purple-600",
  AUTO_SCHEDULE: "bg-blue-100 text-blue-600",
  BREAK: "bg-green-100 text-green-600",
  CONDITIONAL: "bg-orange-100 text-orange-600",
};

const triggerTypeLabels: Record<string, string> = {
  EVENT_CREATED: "À la création d'événement",
  EVENT_UPDATED: "À la modification d'événement",
  TIME_BASED: "Horaire",
  MANUAL: "Manuel",
};

export function RuleCard({ rule, onEdit, onDelete, onToggle, onExecute }: RuleCardProps) {
  const Icon = ruleTypeIcons[rule.ruleType] || Zap;

  return (
    <div
      className={cn(
        "group rounded-lg border bg-card p-4 transition-all hover:shadow-md",
        !rule.isActive && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        {/* Icon and info */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              ruleTypeColors[rule.ruleType] || "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{rule.name}</h3>
            {rule.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {rule.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {ruleTypeLabels[rule.ruleType] || rule.ruleType}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {triggerTypeLabels[rule.triggerType] || rule.triggerType}
              </Badge>
              {rule.priority > 0 && (
                <Badge variant="outline" className="text-xs">
                  Priorité: {rule.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Switch
            checked={rule.isActive}
            onCheckedChange={() => onToggle(rule.id)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-muted">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(rule.id)}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              {rule.triggerType === "MANUAL" && (
                <DropdownMenuItem onClick={() => onExecute(rule.id)}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Exécuter
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(rule.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span>Exécutions: {rule.triggerCount}</span>
        {rule.lastTriggeredAt && (
          <span>
            Dernière: {new Date(rule.lastTriggeredAt).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>
    </div>
  );
}
