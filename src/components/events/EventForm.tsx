"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { format, setHours, setMinutes, addHours, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Switch } from "@/components/ui/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Calendar, Clock, MapPin, AlignLeft, Bell, Palette, Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecurrenceSelector } from "./RecurrenceSelector";

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
  { value: "0", label: "Au moment de l'evenement" },
  { value: "5", label: "5 minutes avant" },
  { value: "10", label: "10 minutes avant" },
  { value: "15", label: "15 minutes avant" },
  { value: "30", label: "30 minutes avant" },
  { value: "60", label: "1 heure avant" },
  { value: "120", label: "2 heures avant" },
  { value: "1440", label: "1 jour avant" },
];

// Generate time options for the time picker dropdown
function generateTimeOptions(baseDate: Date, forEndTime: boolean = false, startTime?: Date): { value: string; label: string; duration?: string }[] {
  const options: { value: string; label: string; duration?: string }[] = [];

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = setMinutes(setHours(new Date(baseDate), h), m);
      const timeStr = format(time, "HH:mm");
      const label = format(time, "HH:mm");

      if (forEndTime && startTime) {
        const duration = differenceInMinutes(time, startTime);
        if (duration > 0) {
          const durationStr = formatDuration(duration);
          options.push({ value: timeStr, label: `${label} (${durationStr})`, duration: durationStr });
        }
      } else {
        options.push({ value: timeStr, label });
      }
    }
  }

  return options;
}

// Format duration in French
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return hours === 1 ? "1 h" : `${hours} h`;
  }
  return `${hours} h ${mins}`;
}

// Voice input hook
function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = typeof window !== "undefined" ? (window as any) : null;
    if (win && (win.SpeechRecognition || win.webkitSpeechRecognition)) {
      setIsSupported(true);
    }
  }, []);

  const startListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = "fr-FR";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  return { isListening, isSupported, startListening, stopListening };
}

export function EventForm({
  initialData,
  calendars,
  onSubmit,
  onCancel,
  isLoading,
  mode = "create",
}: EventFormProps) {
  // Use state to handle hydration - initialize with null and set after mount
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<EventFormData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);

  // Initialize form data after mount to avoid hydration issues
  useEffect(() => {
    const now = new Date();
    const defaultStart = setMinutes(setHours(now, now.getHours() + 1), 0);
    const defaultEnd = addHours(defaultStart, 1);

    setFormData({
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
    });
    setMounted(true);
  }, [initialData, calendars]);

  // Voice input for title
  const titleVoice = useVoiceInput((transcript) => {
    if (formData) {
      setFormData((prev) => prev ? { ...prev, title: prev.title + transcript } : prev);
    }
  });

  // Voice input for description
  const descVoice = useVoiceInput((transcript) => {
    if (formData) {
      setFormData((prev) => prev ? { ...prev, description: (prev.description || "") + transcript } : prev);
    }
  });

  // Update end time when start time changes
  useEffect(() => {
    if (formData && formData.startAt >= formData.endAt) {
      setFormData((prev) => prev ? ({
        ...prev,
        endAt: addHours(prev.startAt, 1),
      }) : prev);
    }
  }, [formData?.startAt]);

  // Calculate duration
  const duration = useMemo(() => {
    if (!formData) return null;
    const mins = differenceInMinutes(formData.endAt, formData.startAt);
    return mins > 0 ? formatDuration(mins) : null;
  }, [formData?.startAt, formData?.endAt]);

  // Generate time options
  const startTimeOptions = useMemo(() => {
    if (!formData) return [];
    return generateTimeOptions(formData.startAt);
  }, [formData?.startAt]);

  const endTimeOptions = useMemo(() => {
    if (!formData) return [];
    return generateTimeOptions(formData.endAt, true, formData.startAt);
  }, [formData?.startAt, formData?.endAt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSubmit(formData);
    }
  };

  const updateField = <K extends keyof EventFormData>(
    key: K,
    value: EventFormData[K]
  ) => {
    setFormData((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const handleTimeSelect = (type: "start" | "end", timeStr: string) => {
    if (!formData) return;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const baseDate = type === "start" ? formData.startAt : formData.endAt;
    const newDate = setMinutes(setHours(new Date(baseDate), hours), minutes);

    if (type === "start") {
      updateField("startAt", newDate);
      // Auto-adjust end time if needed
      if (newDate >= formData.endAt) {
        updateField("endAt", addHours(newDate, 1));
      }
    } else {
      updateField("endAt", newDate);
    }
  };

  // Show loading state during hydration
  if (!mounted || !formData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title with voice input */}
      <div className="relative">
        <Input
          placeholder="Ajouter un titre"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="text-lg font-medium border-0 border-b rounded-none px-0 pr-10 focus-visible:ring-0"
          required
          autoFocus
        />
        {titleVoice.isSupported && (
          <button
            type="button"
            onClick={titleVoice.isListening ? titleVoice.stopListening : titleVoice.startListening}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors",
              titleVoice.isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-muted"
            )}
            title={titleVoice.isListening ? "Arreter" : "Dicter le titre"}
          >
            {titleVoice.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Calendar selector */}
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select
          value={formData.calendarId}
          onValueChange={(value) => updateField("calendarId", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selectionner un calendrier" />
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
          <span className="text-sm">Toute la journee</span>
        </div>
        <Switch
          checked={formData.isAllDay}
          onCheckedChange={(checked) => updateField("isAllDay", checked)}
        />
      </div>

      {/* Date/Time pickers with duration display */}
      <div className="space-y-3 pl-7">
        {/* Start date/time */}
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
            <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-28 justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  {format(formData.startAt, "HH:mm")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0 max-h-64 overflow-auto">
                <div className="py-1">
                  {startTimeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleTimeSelect("start", opt.value);
                        setStartTimeOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
                        format(formData.startAt, "HH:mm") === opt.value && "bg-primary/10 font-medium"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* End date/time with duration */}
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
            <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-28 justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  {format(formData.endAt, "HH:mm")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 max-h-64 overflow-auto">
                <div className="py-1">
                  {endTimeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleTimeSelect("end", opt.value);
                        setEndTimeOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors flex justify-between items-center",
                        format(formData.endAt, "HH:mm") === opt.value && "bg-primary/10 font-medium"
                      )}
                    >
                      <span>{opt.label.split(" (")[0]}</span>
                      {opt.duration && (
                        <span className="text-xs text-muted-foreground">({opt.duration})</span>
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Duration display */}
        {!formData.isAllDay && duration && (
          <div className="text-sm text-muted-foreground pl-1">
            Duree : <span className="font-medium text-foreground">{duration}</span>
          </div>
        )}
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

      {/* Description with voice input */}
      <div className="flex items-start gap-3">
        <AlignLeft className="h-4 w-4 text-muted-foreground mt-3" />
        <div className="flex-1 relative">
          <Textarea
            placeholder="Ajouter une description"
            value={formData.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            className="min-h-[80px] pr-10"
          />
          {descVoice.isSupported && (
            <button
              type="button"
              onClick={descVoice.isListening ? descVoice.stopListening : descVoice.startListening}
              className={cn(
                "absolute right-2 top-2 p-2 rounded-full transition-colors",
                descVoice.isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-muted"
              )}
              title={descVoice.isListening ? "Arreter" : "Dicter la description"}
            >
              {descVoice.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
        </div>
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

          {/* Recurrence */}
          <RecurrenceSelector
            value={formData.rrule}
            onChange={(rrule) => updateField("rrule", rrule)}
            startDate={formData.startAt}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading || !formData.title}>
          {isLoading ? "..." : mode === "create" ? "Creer" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
