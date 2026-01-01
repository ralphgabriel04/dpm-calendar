"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";

type ConditionOperator = "equals" | "contains" | "gt" | "lt" | "gte" | "lte" | "in" | "notIn";
type ActionType = "block_time" | "add_break" | "reschedule" | "notify" | "auto_decline";

interface Condition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

interface Action {
  type: ActionType;
  params?: Record<string, unknown>;
}

export interface RuleFormData {
  name: string;
  description?: string;
  ruleType: "PROTECTION" | "AUTO_SCHEDULE" | "BREAK" | "CONDITIONAL";
  triggerType: "EVENT_CREATED" | "EVENT_UPDATED" | "TIME_BASED" | "MANUAL";
  schedule?: string;
  dayTypes?: string[];
  conditions: Condition[];
  actions: Action[];
  priority: number;
  isActive: boolean;
}

interface RuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<RuleFormData>;
  onSubmit: (data: RuleFormData) => void;
  onDelete?: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

const defaultData: RuleFormData = {
  name: "",
  description: "",
  ruleType: "CONDITIONAL",
  triggerType: "MANUAL",
  conditions: [],
  actions: [],
  priority: 0,
  isActive: true,
};

const conditionFields = [
  { value: "title", label: "Titre de l'événement" },
  { value: "time", label: "Heure" },
  { value: "dayType", label: "Type de jour" },
  { value: "duration", label: "Durée" },
  { value: "calendar", label: "Calendrier" },
];

const conditionOperators = [
  { value: "equals", label: "Égal à" },
  { value: "contains", label: "Contient" },
  { value: "gt", label: "Supérieur à" },
  { value: "lt", label: "Inférieur à" },
  { value: "gte", label: "Supérieur ou égal" },
  { value: "lte", label: "Inférieur ou égal" },
];

const actionTypes = [
  { value: "block_time", label: "Bloquer du temps" },
  { value: "add_break", label: "Ajouter une pause" },
  { value: "reschedule", label: "Replanifier" },
  { value: "notify", label: "Notifier" },
  { value: "auto_decline", label: "Refuser automatiquement" },
];

export function RuleModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  onDelete,
  isLoading,
  mode,
}: RuleModalProps) {
  const [formData, setFormData] = useState<RuleFormData>(defaultData);

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

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: "title", operator: "contains", value: "" }],
    });
  };

  const updateCondition = (index: number, updates: { field?: string; operator?: ConditionOperator; value?: unknown }) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setFormData({ ...formData, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: "notify", params: {} }],
    });
  };

  const updateAction = (index: number, updates: { type?: ActionType; params?: Record<string, unknown> }) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], ...updates };
    setFormData({ ...formData, actions: newActions });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Nouvelle règle" : "Modifier la règle"}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nom *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Protection temps de focus"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la règle..."
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Type de règle</label>
              <Select
                value={formData.ruleType}
                onValueChange={(value) =>
                  setFormData({ ...formData, ruleType: value as RuleFormData["ruleType"] })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROTECTION">Protection</SelectItem>
                  <SelectItem value="AUTO_SCHEDULE">Auto-planification</SelectItem>
                  <SelectItem value="BREAK">Pause</SelectItem>
                  <SelectItem value="CONDITIONAL">Conditionnel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Déclencheur</label>
              <Select
                value={formData.triggerType}
                onValueChange={(value) =>
                  setFormData({ ...formData, triggerType: value as RuleFormData["triggerType"] })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EVENT_CREATED">Création d'événement</SelectItem>
                  <SelectItem value="EVENT_UPDATED">Modification d'événement</SelectItem>
                  <SelectItem value="TIME_BASED">Horaire</SelectItem>
                  <SelectItem value="MANUAL">Manuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.triggerType === "TIME_BASED" && (
            <div>
              <label className="text-sm font-medium">Horaire (cron)</label>
              <Input
                value={formData.schedule || ""}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="Ex: 0 9 * * 1-5 (9h du lundi au vendredi)"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Priorité</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
              }
              className="mt-1 w-32"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Plus la priorité est élevée, plus la règle s'exécute en premier
            </p>
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Conditions</label>
            <Button type="button" variant="outline" size="sm" onClick={addCondition}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {formData.conditions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune condition - la règle s'appliquera toujours
              </p>
            ) : (
              formData.conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(index, { field: value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionFields.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, { operator: value as ConditionOperator })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOperators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={String(condition.value || "")}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    placeholder="Valeur"
                    className="flex-1"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Actions</label>
            <Button type="button" variant="outline" size="sm" onClick={addAction}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {formData.actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune action définie
              </p>
            ) : (
              formData.actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <Select
                    value={action.type}
                    onValueChange={(value) => updateAction(index, { type: value as ActionType })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(action.type === "block_time" || action.type === "add_break") && (
                    <Input
                      type="number"
                      min={5}
                      value={String(action.params?.duration || 30)}
                      onChange={(e) =>
                        updateAction(index, {
                          params: { ...action.params, duration: parseInt(e.target.value) },
                        })
                      }
                      placeholder="Durée (min)"
                      className="w-32"
                    />
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAction(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active switch */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-sm font-medium">Règle active</p>
            <p className="text-xs text-muted-foreground">
              Désactiver pour mettre la règle en pause
            </p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
