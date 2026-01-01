"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";

export interface GoalFormData {
  title: string;
  description?: string;
  category?: string;
  targetType: "CUMULATIVE" | "STREAK" | "COMPLETION";
  targetValue: number;
  unit?: string;
  startDate?: Date;
  endDate?: Date;
}

interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<GoalFormData>;
  onSubmit: (data: GoalFormData) => void;
  onDelete?: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
  existingCategories?: string[];
}

const defaultData: GoalFormData = {
  title: "",
  description: "",
  category: "",
  targetType: "CUMULATIVE",
  targetValue: 1,
  unit: "",
};

export function GoalModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  onDelete,
  isLoading,
  mode,
  existingCategories = [],
}: GoalModalProps) {
  const [formData, setFormData] = useState<GoalFormData>(defaultData);
  const [useNewCategory, setUseNewCategory] = useState(true);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...defaultData, ...initialData });
      setUseNewCategory(!existingCategories.includes(initialData.category || ""));
    } else {
      setFormData(defaultData);
      setUseNewCategory(true);
    }
  }, [initialData, open, existingCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.targetValue < 1) return;
    onSubmit(formData);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Nouvel objectif" : "Modifier l'objectif"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium">Titre *</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Lire 24 livres cette année"
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description de l'objectif..."
            className="mt-1"
            rows={2}
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium">Catégorie</label>
          {existingCategories.length > 0 && (
            <div className="flex gap-2 mt-1 mb-2">
              <button
                type="button"
                onClick={() => setUseNewCategory(true)}
                className={`px-3 py-1 text-sm rounded-md ${
                  useNewCategory ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                Nouvelle
              </button>
              <button
                type="button"
                onClick={() => setUseNewCategory(false)}
                className={`px-3 py-1 text-sm rounded-md ${
                  !useNewCategory ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                Existante
              </button>
            </div>
          )}
          {useNewCategory ? (
            <Input
              value={formData.category || ""}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Santé, Travail, Personnel..."
              className="mt-1"
            />
          ) : (
            <Select
              value={formData.category || ""}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {existingCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Target type */}
        <div>
          <label className="text-sm font-medium">Type d'objectif</label>
          <Select
            value={formData.targetType}
            onValueChange={(value) =>
              setFormData({ ...formData, targetType: value as GoalFormData["targetType"] })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CUMULATIVE">
                Cumulatif (ex: lire 24 livres)
              </SelectItem>
              <SelectItem value="STREAK">
                Série (ex: 30 jours consécutifs)
              </SelectItem>
              <SelectItem value="COMPLETION">
                Complétion (ex: terminer un projet)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Target value and unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Objectif *</label>
            <Input
              type="number"
              min={1}
              value={formData.targetValue}
              onChange={(e) =>
                setFormData({ ...formData, targetValue: parseInt(e.target.value) || 1 })
              }
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Unité</label>
            <Input
              value={formData.unit || ""}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="livres, km, heures..."
              className="mt-1"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Date de début</label>
            <DatePicker
              value={formData.startDate}
              onChange={(date) => setFormData({ ...formData, startDate: date })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date de fin</label>
            <DatePicker
              value={formData.endDate}
              onChange={(date) => setFormData({ ...formData, endDate: date })}
              className="mt-1"
            />
          </div>
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
            <Button type="submit" disabled={isLoading || !formData.title.trim()}>
              {mode === "create" ? "Créer" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
