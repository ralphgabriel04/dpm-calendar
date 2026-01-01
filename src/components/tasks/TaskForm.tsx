"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import {
  Calendar,
  Clock,
  Flag,
  AlignLeft,
  Tag,
  Link,
  CheckSquare,
  Plus,
  X,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export interface TaskFormData {
  title: string;
  description?: string;
  notes?: string;
  url?: string;
  dueAt?: Date;
  plannedStartAt?: Date;
  plannedDuration?: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  tags: string[];
  estimatedEnergy?: "LOW" | "MEDIUM" | "HIGH";
  checklistItems: Array<{ id?: string; title: string; isCompleted: boolean }>;
}

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

const priorityOptions = [
  { value: "LOW", label: "Faible", color: "text-slate-500" },
  { value: "MEDIUM", label: "Moyenne", color: "text-blue-500" },
  { value: "HIGH", label: "Haute", color: "text-orange-500" },
  { value: "URGENT", label: "Urgente", color: "text-red-500" },
];

const statusOptions = [
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "DONE", label: "Terminé" },
];

const energyOptions = [
  { value: "LOW", label: "Faible", icon: "🔋" },
  { value: "MEDIUM", label: "Moyenne", icon: "⚡" },
  { value: "HIGH", label: "Haute", icon: "🔥" },
];

const durationPresets = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1h" },
  { value: 120, label: "2h" },
  { value: 240, label: "4h" },
];

export function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  isLoading,
  mode = "create",
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    notes: "",
    url: "",
    dueAt: undefined,
    plannedStartAt: undefined,
    plannedDuration: undefined,
    priority: "MEDIUM",
    status: "TODO",
    tags: [],
    estimatedEnergy: undefined,
    checklistItems: [],
    ...initialData,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const updateField = <K extends keyof TaskFormData>(
    key: K,
    value: TaskFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateField("tags", [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateField(
      "tags",
      formData.tags.filter((t) => t !== tag)
    );
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      updateField("checklistItems", [
        ...formData.checklistItems,
        { title: newChecklistItem.trim(), isCompleted: false },
      ]);
      setNewChecklistItem("");
    }
  };

  const handleToggleChecklistItem = (index: number) => {
    const items = [...formData.checklistItems];
    items[index].isCompleted = !items[index].isCompleted;
    updateField("checklistItems", items);
  };

  const handleRemoveChecklistItem = (index: number) => {
    updateField(
      "checklistItems",
      formData.checklistItems.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <Input
          placeholder="Titre de la tâche"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="text-lg font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0"
          required
          autoFocus
        />
      </div>

      {/* Status and Priority row */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
          <Select
            value={formData.status}
            onValueChange={(value) => updateField("status", value as TaskFormData["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Priorité</label>
          <Select
            value={formData.priority}
            onValueChange={(value) => updateField("priority", value as TaskFormData["priority"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <Flag className={cn("h-3 w-3", opt.color)} />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Due date */}
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <DatePicker
          value={formData.dueAt}
          onChange={(date) => updateField("dueAt", date)}
          placeholder="Date d'échéance"
          className="flex-1"
        />
      </div>

      {/* Duration */}
      <div className="flex items-center gap-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2 flex-wrap">
          {durationPresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => updateField("plannedDuration", preset.value)}
              className={cn(
                "px-3 py-1 text-sm rounded-md border transition-colors",
                formData.plannedDuration === preset.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-accent"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="flex items-start gap-3">
        <AlignLeft className="h-4 w-4 text-muted-foreground mt-3" />
        <Textarea
          placeholder="Description"
          value={formData.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          className="min-h-[60px]"
        />
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Checklist</span>
        </div>
        <div className="ml-7 space-y-1">
          {formData.checklistItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 group">
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={() => handleToggleChecklistItem(index)}
                className="rounded border-primary"
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  item.isCompleted && "line-through text-muted-foreground"
                )}
              >
                {item.title}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveChecklistItem(index)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ajouter un élément"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddChecklistItem();
                }
              }}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Tags</span>
        </div>
        <div className="ml-7">
          <div className="flex flex-wrap gap-1 mb-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ajouter un tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="h-8 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTag}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced options toggle */}
      <button
        type="button"
        className="text-sm text-primary hover:underline"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? "Masquer les options" : "Plus d'options"}
      </button>

      {/* Advanced options */}
      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t">
          {/* URL */}
          <div className="flex items-center gap-3">
            <Link className="h-4 w-4 text-muted-foreground" />
            <Input
              type="url"
              placeholder="URL liée"
              value={formData.url || ""}
              onChange={(e) => updateField("url", e.target.value)}
            />
          </div>

          {/* Energy level */}
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-2">
              {energyOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    updateField(
                      "estimatedEnergy",
                      formData.estimatedEnergy === opt.value ? undefined : (opt.value as TaskFormData["estimatedEnergy"])
                    )
                  }
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md border transition-colors",
                    formData.estimatedEnergy === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent"
                  )}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex items-start gap-3">
            <AlignLeft className="h-4 w-4 text-muted-foreground mt-3" />
            <Textarea
              placeholder="Notes personnelles"
              value={formData.notes || ""}
              onChange={(e) => updateField("notes", e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <div>
          {mode === "edit" && onDelete && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading || !formData.title}>
            {isLoading ? "..." : mode === "create" ? "Créer" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </form>
  );
}
