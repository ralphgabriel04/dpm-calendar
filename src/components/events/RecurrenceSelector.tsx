"use client";

import { useState, useMemo } from "react";
import { format, addDays, addWeeks, addMonths, addYears, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Switch } from "@/components/ui/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecurrenceSelectorProps {
  value?: string;
  onChange: (rrule: string | undefined) => void;
  startDate: Date;
  className?: string;
}

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type EndType = "never" | "after" | "until";

interface RecurrenceConfig {
  frequency: Frequency;
  interval: number;
  byDay: string[];
  endType: EndType;
  count?: number;
  until?: Date;
}

const DAYS_OF_WEEK = [
  { value: "MO", label: "Lun", fullLabel: "Lundi" },
  { value: "TU", label: "Mar", fullLabel: "Mardi" },
  { value: "WE", label: "Mer", fullLabel: "Mercredi" },
  { value: "TH", label: "Jeu", fullLabel: "Jeudi" },
  { value: "FR", label: "Ven", fullLabel: "Vendredi" },
  { value: "SA", label: "Sam", fullLabel: "Samedi" },
  { value: "SU", label: "Dim", fullLabel: "Dimanche" },
];

const FREQUENCY_LABELS: Record<Frequency, { singular: string; plural: string }> = {
  DAILY: { singular: "jour", plural: "jours" },
  WEEKLY: { singular: "semaine", plural: "semaines" },
  MONTHLY: { singular: "mois", plural: "mois" },
  YEARLY: { singular: "an", plural: "ans" },
};

// Map Date.getDay() (0=Sunday) to RRULE day codes
const DAY_INDEX_TO_CODE = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// Parse RRULE string to config
function parseRRule(rrule: string, startDate: Date): RecurrenceConfig {
  const config: RecurrenceConfig = {
    frequency: "WEEKLY",
    interval: 1,
    byDay: [DAY_INDEX_TO_CODE[getDay(startDate)]],
    endType: "never",
  };

  const parts = rrule.split(";");
  for (const part of parts) {
    const [key, value] = part.split("=");
    switch (key) {
      case "FREQ":
        config.frequency = value as Frequency;
        break;
      case "INTERVAL":
        config.interval = parseInt(value, 10);
        break;
      case "BYDAY":
        config.byDay = value.split(",");
        break;
      case "COUNT":
        config.endType = "after";
        config.count = parseInt(value, 10);
        break;
      case "UNTIL":
        config.endType = "until";
        // Parse YYYYMMDD format
        config.until = new Date(
          parseInt(value.slice(0, 4), 10),
          parseInt(value.slice(4, 6), 10) - 1,
          parseInt(value.slice(6, 8), 10)
        );
        break;
    }
  }

  return config;
}

// Build RRULE string from config
function buildRRule(config: RecurrenceConfig): string {
  const parts: string[] = [`FREQ=${config.frequency}`];

  if (config.interval > 1) {
    parts.push(`INTERVAL=${config.interval}`);
  }

  if (config.frequency === "WEEKLY" && config.byDay.length > 0) {
    parts.push(`BYDAY=${config.byDay.join(",")}`);
  }

  if (config.endType === "after" && config.count) {
    parts.push(`COUNT=${config.count}`);
  } else if (config.endType === "until" && config.until) {
    const y = config.until.getFullYear();
    const m = String(config.until.getMonth() + 1).padStart(2, "0");
    const d = String(config.until.getDate()).padStart(2, "0");
    parts.push(`UNTIL=${y}${m}${d}`);
  }

  return parts.join(";");
}

// Get human-readable description
function getRecurrenceDescription(rrule: string | undefined, startDate: Date): string {
  if (!rrule) return "Ne se repete pas";

  const config = parseRRule(rrule, startDate);
  const freqLabel = config.interval === 1
    ? FREQUENCY_LABELS[config.frequency].singular
    : FREQUENCY_LABELS[config.frequency].plural;

  let desc = config.interval === 1
    ? `Tous les ${freqLabel}`
    : `Tous les ${config.interval} ${freqLabel}`;

  if (config.frequency === "WEEKLY" && config.byDay.length > 0) {
    if (config.byDay.length === 5 && !config.byDay.includes("SA") && !config.byDay.includes("SU")) {
      desc += " (jours ouvrables)";
    } else if (config.byDay.length === 7) {
      desc = "Tous les jours";
    } else if (config.byDay.length > 1) {
      const dayLabels = config.byDay.map((d) =>
        DAYS_OF_WEEK.find((day) => day.value === d)?.label || d
      );
      desc += ` (${dayLabels.join(", ")})`;
    }
  }

  if (config.endType === "after" && config.count) {
    desc += `, ${config.count} fois`;
  } else if (config.endType === "until" && config.until) {
    desc += `, jusqu'au ${format(config.until, "d MMM yyyy", { locale: fr })}`;
  }

  return desc;
}

export function RecurrenceSelector({
  value,
  onChange,
  startDate,
  className,
}: RecurrenceSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [config, setConfig] = useState<RecurrenceConfig>(() => {
    if (value) {
      return parseRRule(value, startDate);
    }
    return {
      frequency: "WEEKLY",
      interval: 1,
      byDay: [DAY_INDEX_TO_CODE[getDay(startDate)]],
      endType: "never",
    };
  });

  const description = useMemo(() => getRecurrenceDescription(value, startDate), [value, startDate]);

  const handleQuickSelect = (preset: string) => {
    if (preset === "none") {
      onChange(undefined);
      return;
    }

    switch (preset) {
      case "daily":
        onChange("FREQ=DAILY");
        break;
      case "weekdays":
        onChange("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR");
        break;
      case "weekly":
        onChange(`FREQ=WEEKLY;BYDAY=${DAY_INDEX_TO_CODE[getDay(startDate)]}`);
        break;
      case "biweekly":
        onChange(`FREQ=WEEKLY;INTERVAL=2;BYDAY=${DAY_INDEX_TO_CODE[getDay(startDate)]}`);
        break;
      case "monthly":
        onChange("FREQ=MONTHLY");
        break;
      case "yearly":
        onChange("FREQ=YEARLY");
        break;
      case "custom":
        setDialogOpen(true);
        break;
    }
  };

  const handleSaveCustom = () => {
    const rrule = buildRRule(config);
    onChange(rrule);
    setDialogOpen(false);
  };

  const toggleDay = (day: string) => {
    setConfig((prev) => ({
      ...prev,
      byDay: prev.byDay.includes(day)
        ? prev.byDay.filter((d) => d !== day)
        : [...prev.byDay, day],
    }));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3">
        <Repeat className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Select
          value={value ? "custom" : "none"}
          onValueChange={handleQuickSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{description}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ne se repete pas</SelectItem>
            <SelectItem value="daily">Tous les jours</SelectItem>
            <SelectItem value="weekdays">Jours ouvrables (Lun-Ven)</SelectItem>
            <SelectItem value="weekly">Toutes les semaines</SelectItem>
            <SelectItem value="biweekly">Toutes les 2 semaines</SelectItem>
            <SelectItem value="monthly">Tous les mois</SelectItem>
            <SelectItem value="yearly">Tous les ans</SelectItem>
            <SelectItem value="custom">Personnalise...</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom recurrence dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recurrence personnalisee</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Frequency and interval */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Repeter tous les</span>
              <Input
                type="number"
                min={1}
                max={99}
                value={config.interval}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    interval: Math.max(1, parseInt(e.target.value, 10) || 1),
                  }))
                }
                className="w-16 text-center"
              />
              <Select
                value={config.frequency}
                onValueChange={(value) =>
                  setConfig((prev) => ({ ...prev, frequency: value as Frequency }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">jour(s)</SelectItem>
                  <SelectItem value="WEEKLY">semaine(s)</SelectItem>
                  <SelectItem value="MONTHLY">mois</SelectItem>
                  <SelectItem value="YEARLY">an(s)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Days of week (for weekly) */}
            {config.frequency === "WEEKLY" && (
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">
                  Se repete le :
                </span>
                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={config.byDay.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      className="w-10 h-10 p-0"
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* End condition */}
            <div className="space-y-3">
              <span className="text-sm text-muted-foreground">Se termine :</span>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="endType"
                    checked={config.endType === "never"}
                    onChange={() => setConfig((prev) => ({ ...prev, endType: "never" }))}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Jamais</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="endType"
                    checked={config.endType === "after"}
                    onChange={() =>
                      setConfig((prev) => ({ ...prev, endType: "after", count: prev.count || 10 }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Apres</span>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={config.count || 10}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        count: Math.max(1, parseInt(e.target.value, 10) || 1),
                      }))
                    }
                    disabled={config.endType !== "after"}
                    className="w-16 text-center"
                  />
                  <span className="text-sm">occurrences</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="endType"
                    checked={config.endType === "until"}
                    onChange={() =>
                      setConfig((prev) => ({
                        ...prev,
                        endType: "until",
                        until: prev.until || addMonths(startDate, 3),
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Le</span>
                  <DatePicker
                    value={config.until || addMonths(startDate, 3)}
                    onChange={(date) => setConfig((prev) => ({ ...prev, until: date }))}
                    disabled={config.endType !== "until"}
                    className="flex-1"
                  />
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Apercu :</p>
              <p className="text-sm font-medium mt-1">
                {getRecurrenceDescription(buildRRule(config), startDate)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveCustom}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
