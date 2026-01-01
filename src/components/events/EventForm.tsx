"use client";

import { useState, useEffect } from "react";
import { format, setHours, setMinutes, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Switch } from "@/components/ui/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Calendar, Clock, MapPin, AlignLeft, Bell, Repeat, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EventFormData {
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  calendarId: string;
  color?: string;
  reminderMinutes: number[];
  rrule?: string;
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  calendars: Array<{ id: string; name: string; color: string }>;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

const REMINDER_OPTIONS = [
  { value: "0", label: "Au moment de l'événement" },
  { value: "5", label: "5 minutes avant" },
  { value: "10", label: "10 minutes avant" },
  { value: "15", label: "15 minutes avant" },
  { value: "30", label: "30 minutes avant" },
  { value: "60", label: "1 heure avant" },
  { value: "120", label: "2 heures avant" },
  { value: "1440", label: "1 jour avant" },
];

export function EventForm({
  initialData,
  calendars,
  onSubmit,
  onCancel,
  isLoading,
  mode = "create",
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>(() => {
    const now = new Date();
    const defaultStart = setMinutes(setHours(now, now.getHours() + 1), 0);
    const defaultEnd = addHours(defaultStart, 1);

    return {
      title: "",
      description: "",
      location: "",
      startAt: defaultStart,
      endAt: defaultEnd,
      isAllDay: false,
      calendarId: calendars[0]?.id || "",
      color: undefined,
      reminderMinutes: [15],
      rrule: undefined,
      ...initialData,
    };
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update end time when start time changes
  useEffect(() => {
    if (formData.startAt >= formData.endAt) {
      setFormData((prev) => ({
        ...prev,
        endAt: addHours(prev.startAt, 1),
      }));
    }
  }, [formData.startAt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = <K extends keyof EventFormData>(
    key: K,
    value: EventFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <Input
          placeholder="Ajouter un titre"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="text-lg font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0"
          required
          autoFocus
        />
      </div>

      {/* Calendar selector */}
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select
          value={formData.calendarId}
          onValueChange={(value) => updateField("calendarId", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un calendrier" />
          </SelectTrigger>
          <SelectContent>
            {calendars.map((cal) => (
              <SelectItem key={cal.id} value={cal.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cal.color }}
                  />
                  {cal.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* All-day toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Toute la journée</span>
        </div>
        <Switch
          checked={formData.isAllDay}
          onCheckedChange={(checked) => updateField("isAllDay", checked)}
        />
      </div>

      {/* Date/Time pickers */}
      <div className="space-y-3 pl-7">
        <div className="flex items-center gap-2">
          <DatePicker
            value={formData.startAt}
            onChange={(date) => {
              const newStart = new Date(date);
              newStart.setHours(formData.startAt.getHours());
              newStart.setMinutes(formData.startAt.getMinutes());
              updateField("startAt", newStart);
            }}
            className="flex-1"
          />
          {!formData.isAllDay && (
            <TimePicker
              value={formData.startAt}
              onChange={(time) => {
                const newStart = new Date(formData.startAt);
                newStart.setHours(time.getHours());
                newStart.setMinutes(time.getMinutes());
                updateField("startAt", newStart);
              }}
              className="w-32"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <DatePicker
            value={formData.endAt}
            onChange={(date) => {
              const newEnd = new Date(date);
              newEnd.setHours(formData.endAt.getHours());
              newEnd.setMinutes(formData.endAt.getMinutes());
              updateField("endAt", newEnd);
            }}
            className="flex-1"
          />
          {!formData.isAllDay && (
            <TimePicker
              value={formData.endAt}
              onChange={(time) => {
                const newEnd = new Date(formData.endAt);
                newEnd.setHours(time.getHours());
                newEnd.setMinutes(time.getMinutes());
                updateField("endAt", newEnd);
              }}
              className="w-32"
            />
          )}
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-3">
        <MapPin className="h-4 w-4 text-muted-foreground mt-3" />
        <Input
          placeholder="Ajouter un lieu"
          value={formData.location || ""}
          onChange={(e) => updateField("location", e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="flex items-start gap-3">
        <AlignLeft className="h-4 w-4 text-muted-foreground mt-3" />
        <Textarea
          placeholder="Ajouter une description"
          value={formData.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* Reminder */}
      <div className="flex items-center gap-3">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <Select
          value={formData.reminderMinutes[0]?.toString() || "15"}
          onValueChange={(value) =>
            updateField("reminderMinutes", [parseInt(value)])
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Rappel" />
          </SelectTrigger>
          <SelectContent>
            {REMINDER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          {/* Color */}
          <div className="flex items-center gap-3">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <ColorPicker
              value={formData.color}
              onChange={(color) => updateField("color", color)}
            />
          </div>

          {/* Recurrence - placeholder for now */}
          <div className="flex items-center gap-3">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <Select
              value={formData.rrule || "none"}
              onValueChange={(value) =>
                updateField("rrule", value === "none" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ne se répète pas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ne se répète pas</SelectItem>
                <SelectItem value="FREQ=DAILY">Tous les jours</SelectItem>
                <SelectItem value="FREQ=WEEKLY">Toutes les semaines</SelectItem>
                <SelectItem value="FREQ=MONTHLY">Tous les mois</SelectItem>
                <SelectItem value="FREQ=YEARLY">Tous les ans</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading || !formData.title}>
          {isLoading ? "..." : mode === "create" ? "Créer" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
