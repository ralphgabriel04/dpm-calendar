"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Textarea } from "@/shared/components/ui/Textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/shared/components/ui/Select";
import { ColorPicker } from "@/shared/components/ui/ColorPicker";
import { Switch } from "@/shared/components/ui/Switch";

export interface HabitFormData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  habitType: "FIXED" | "FLEXIBLE" | "CONDITIONAL";
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
  targetCount: number;
  duration?: number;
  preferredTime?: string;
  preferredDays?: number[];
  isProtected: boolean;
  goalId?: string;
}

interface HabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<HabitFormData>;
  onSubmit: (data: HabitFormData) => void;
  onDelete?: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

const defaultData: HabitFormData = {
  name: "",
  description: "",
  color: "#3B82F6",
  habitType: "FLEXIBLE",
  frequency: "DAILY",
  targetCount: 1,
  isProtected: false,
};

const weekDays = [
  { value: 0, label: "Dim" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
];

export function HabitModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  onDelete,
  isLoading,
  mode,
}: HabitModalProps) {
  const [formData, setFormData] = useState<HabitFormData>(defaultData);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...defaultData, ...initialData });
    } else {
      setFormData(defaultData);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  const toggleDay = (day: number) => {
    const currentDays = formData.preferredDays || [];
    if (currentDays.includes(day)) {
      setFormData({ ...formData, preferredDays: currentDays.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, preferredDays: [...currentDays, day].sort() });
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Nouvelle habitude" : "Modifier l'habitude"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-sm font-medium">Nom *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Méditation matinale"
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description de l'habitude..."
            className="mt-1"
            rows={2}
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-sm font-medium">Couleur</label>
          <div className="mt-1">
            <ColorPicker
              value={formData.color || "#3B82F6"}
              onChange={(color) => setFormData({ ...formData, color })}
            />
          </div>
        </div>

        {/* Frequency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Fréquence</label>
            <Select
              value={formData.frequency}
              onValueChange={(value) =>
                setFormData({ ...formData, frequency: value as HabitFormData["frequency"] })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Quotidien</SelectItem>
                <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                <SelectItem value="MONTHLY">Mensuel</SelectItem>
                <SelectItem value="CUSTOM">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Objectif</label>
            <Input
              type="number"
              min={1}
              value={formData.targetCount}
              onChange={(e) =>
                setFormData({ ...formData, targetCount: parseInt(e.target.value) || 1 })
              }
              className="mt-1"
            />
          </div>
        </div>

        {/* Preferred days for weekly/custom */}
        {(formData.frequency === "WEEKLY" || formData.frequency === "CUSTOM") && (
          <div>
            <label className="text-sm font-medium">Jours préférés</label>
            <div className="flex gap-1 mt-1">
              {weekDays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-2 py-1 text-xs rounded ${
                    formData.preferredDays?.includes(day.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preferred time */}
        <div>
          <label className="text-sm font-medium">Heure préférée</label>
          <Input
            type="time"
            value={formData.preferredTime || ""}
            onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
            className="mt-1"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="text-sm font-medium">Durée (minutes)</label>
          <Input
            type="number"
            min={0}
            value={formData.duration || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                duration: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="Optionnel"
            className="mt-1"
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-sm font-medium">Type</label>
          <Select
            value={formData.habitType}
            onValueChange={(value) =>
              setFormData({ ...formData, habitType: value as HabitFormData["habitType"] })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FLEXIBLE">Flexible</SelectItem>
              <SelectItem value="FIXED">Fixe (heure précise)</SelectItem>
              <SelectItem value="CONDITIONAL">Conditionnel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Protected */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Protéger le créneau</p>
            <p className="text-xs text-muted-foreground">
              Bloquer automatiquement le temps dans le calendrier
            </p>
          </div>
          <Switch
            checked={formData.isProtected}
            onCheckedChange={(checked) => setFormData({ ...formData, isProtected: checked })}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          {onDelete && mode === "edit" ? (
            <Button type="button" variant="destructive" onClick={onDelete}>
              Supprimer
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {mode === "create" ? "Créer" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
