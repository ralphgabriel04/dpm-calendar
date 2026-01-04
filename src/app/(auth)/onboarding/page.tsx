"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sun,
  Moon,
  Plus,
  ChevronDown,
  Copy,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Task manager logos as inline SVGs
const TaskManagerLogos: Record<string, React.FC<{ className?: string }>> = {
  asana: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#F06A6A">
      <path d="M18.78 12.653c-2.025 0-3.667 1.642-3.667 3.667s1.642 3.668 3.667 3.668 3.667-1.643 3.667-3.668-1.642-3.667-3.667-3.667zm-13.56 0c-2.025 0-3.667 1.642-3.667 3.667s1.642 3.668 3.667 3.668 3.667-1.643 3.667-3.668-1.642-3.667-3.667-3.667zm6.78-8.641c-2.025 0-3.667 1.642-3.667 3.667s1.642 3.668 3.667 3.668 3.667-1.643 3.667-3.668-1.642-3.667-3.667-3.667z"/>
    </svg>
  ),
  linear: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#5E6AD2">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  ),
  clickup: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#7B68EE">
      <path d="M4.105 17.592l2.603-1.991c1.271 1.664 2.633 2.453 4.313 2.453 1.68 0 3.042-.79 4.313-2.453l2.603 1.991C15.693 20.42 13.514 21.6 11.02 21.6c-2.493 0-4.672-1.18-6.916-4.008zM11.02 8.197L6.096 12.61l-2.19-2.603 7.115-5.989 7.114 5.989-2.19 2.603-4.924-4.413z"/>
    </svg>
  ),
  monday: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#FF3D57">
      <circle cx="4" cy="12" r="3"/>
      <circle cx="12" cy="12" r="3"/>
      <circle cx="20" cy="12" r="3"/>
    </svg>
  ),
  github: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  ),
  notion: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.934-.56.934-1.167V6.354c0-.606-.233-.933-.747-.886l-15.177.887c-.56.046-.747.326-.747.933z"/>
    </svg>
  ),
  gmail: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
    </svg>
  ),
  outlook: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576a.788.788 0 01-.584.231h-8.837v-6.03l1.83 1.353c.06.053.13.08.21.08.08 0 .15-.027.21-.08l6.998-5.196c.08-.053.15-.077.21-.097.08-.013.14.017.17.09zM7.387 21.272H1.636A1.636 1.636 0 010 19.636V4.364C0 3.46.732 2.727 1.636 2.727h5.751v18.545z"/>
      <ellipse fill="#0078D4" cx="10.5" cy="12" rx="4" ry="4.5"/>
    </svg>
  ),
  "google-tasks": ({ className }) => (
    <svg className={className} viewBox="0 0 24 24">
      <circle fill="#4285F4" cx="12" cy="12" r="10"/>
      <path fill="#fff" d="M10.5 15.5l-3-3 1.41-1.41L10.5 12.67l4.59-4.59L16.5 9.5l-6 6z"/>
    </svg>
  ),
  todoist: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#E44332">
      <path d="M21 0H3C1.35 0 0 1.35 0 3v18c0 1.65 1.35 3 3 3h18c1.65 0 3-1.35 3-3V3c0-1.65-1.35-3-3-3zM10.68 17.31l-4.32-2.63 1.06-1.75 3.27 1.99 6.05-3.68 1.06 1.75-7.12 4.32zM10.68 12.12L6.36 9.49l1.06-1.75 3.27 1.99 6.05-3.68 1.06 1.75-7.12 4.32z"/>
    </svg>
  ),
  jira: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#2684FF" d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.518a1.005 1.005 0 00-1.005-1.005z"/>
      <path fill="#2684FF" d="M5.739 5.75H17.31a5.218 5.218 0 00-5.232-5.215h-2.13V.478A5.215 5.215 0 004.735 5.75h1.004z"/>
      <path fill="#0052CC" d="M17.31 5.75a5.218 5.218 0 00-5.232 5.215v5.763h2.13a5.215 5.215 0 005.212-5.763V5.75h-2.11z"/>
    </svg>
  ),
  trello: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#0079BF">
      <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm10.44-6c0 .794-.645 1.44-1.44 1.44h-4.44c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v7.62z"/>
    </svg>
  ),
};

// Calendar provider logos
const CalendarLogos: Record<string, React.FC<{ className?: string }>> = {
  google: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  microsoft: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  ),
  icloud: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="#333">
      <path d="M13.762 4.29a6.51 6.51 0 0 0-5.669 3.332 3.571 3.571 0 0 0-1.558-.36 3.571 3.571 0 0 0-3.516 3A4.918 4.918 0 0 0 0 14.796a4.918 4.918 0 0 0 4.92 4.914h14.35a4.73 4.73 0 0 0 4.73-4.73 4.73 4.73 0 0 0-4.73-4.73 4.73 4.73 0 0 0-.973.102A6.51 6.51 0 0 0 13.762 4.29z"/>
    </svg>
  ),
};

// Task managers available for integration
const taskManagers = [
  { id: "asana", name: "Asana", color: "#F06A6A" },
  { id: "linear", name: "Linear", color: "#5E6AD2" },
  { id: "clickup", name: "ClickUp", color: "#7B68EE" },
  { id: "monday", name: "Monday.com", color: "#FF3D57" },
  { id: "github", name: "GitHub", color: "#181717" },
  { id: "notion", name: "Notion", color: "#000000" },
  { id: "gmail", name: "Gmail", color: "#EA4335" },
  { id: "outlook", name: "Outlook", color: "#0078D4" },
  { id: "google-tasks", name: "Google Tasks", color: "#4285F4" },
  { id: "todoist", name: "Todoist", color: "#E44332" },
  { id: "jira", name: "Jira", color: "#0052CC" },
  { id: "trello", name: "Trello", color: "#0079BF" },
];

// Calendar providers with OAuth URLs
const calendarProviders = [
  { id: "google", name: "Google Calendar", color: "#4285F4", authUrl: "/api/auth/google-calendar" },
  { id: "microsoft", name: "Outlook Calendar", color: "#0078D4", authUrl: "/api/auth/microsoft-calendar" },
  { id: "icloud", name: "iCloud Calendar", color: "#333333", authUrl: null },
];

// Generate 24-hour time options (every 15 minutes)
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      times.push(`${h}:${m}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

// Format time for display (24h to 12h AM/PM)
const formatTimeDisplay = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

// Days of the week
const daysOfWeek = [
  { id: "monday", label: "Lundi", short: "Lun" },
  { id: "tuesday", label: "Mardi", short: "Mar" },
  { id: "wednesday", label: "Mercredi", short: "Mer" },
  { id: "thursday", label: "Jeudi", short: "Jeu" },
  { id: "friday", label: "Vendredi", short: "Ven" },
  { id: "saturday", label: "Samedi", short: "Sam" },
  { id: "sunday", label: "Dimanche", short: "Dim" },
];

type Step = "welcome" | "task-manager" | "calendar" | "work-hours" | "planning";

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

type WeeklySchedule = Record<string, DaySchedule>;

interface ConnectedCalendar {
  id: string;
  provider: string;
  email: string;
}

interface OnboardingData {
  taskManagers: string[];
  connectedCalendars: ConnectedCalendar[];
  weeklyWorkHours: WeeklySchedule;
  planningTime: "morning" | "evening";
}

// Default weekly schedule (Mon-Fri 9-17, Sat-Sun disabled)
const defaultWeeklySchedule: WeeklySchedule = {
  monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  friday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

// Time select dropdown component
function TimeSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm border rounded-lg bg-background hover:border-primary focus:border-primary focus:outline-none flex items-center justify-between gap-2"
      >
        <span>{formatTimeDisplay(value)}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {timeOptions.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => {
                onChange(time);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
                time === value && "bg-primary/10 text-primary font-medium"
              )}
            >
              {formatTimeDisplay(time)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<OnboardingData>({
    taskManagers: [],
    connectedCalendars: [],
    weeklyWorkHours: defaultWeeklySchedule,
    planningTime: "morning",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCalendarDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch connected calendar accounts
  const { data: calendarAccounts } = trpc.sync.listAccounts.useQuery();

  // Update connected calendars when accounts are fetched
  useEffect(() => {
    if (calendarAccounts) {
      setData((prev) => ({
        ...prev,
        connectedCalendars: calendarAccounts.map((acc: { id: string; provider: string; email: string }) => ({
          id: acc.id,
          provider: acc.provider.toLowerCase(),
          email: acc.email,
        })),
      }));
    }
  }, [calendarAccounts]);

  const completeOnboardingMutation = trpc.user.completeOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Configuration terminée!");
      router.push("/home");
    },
    onError: () => {
      toast.error("Une erreur est survenue");
    },
  });

  const steps: Step[] = ["welcome", "task-manager", "calendar", "work-hours", "planning"];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex) / (steps.length - 1)) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handlePrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleComplete = () => {
    // Get first workday start/end for backward compatibility
    const firstWorkday = Object.values(data.weeklyWorkHours).find(d => d.enabled && d.slots.length > 0);
    const workingHoursStart = firstWorkday?.slots[0]?.start || "09:00";
    const workingHoursEnd = firstWorkday?.slots[0]?.end || "17:00";

    completeOnboardingMutation.mutate({
      connectedTaskManagers: data.taskManagers,
      connectedCalendars: data.connectedCalendars.map(c => c.provider),
      workingHoursStart,
      workingHoursEnd,
      weeklyWorkHours: data.weeklyWorkHours,
      planningTime: data.planningTime,
    });
  };

  const toggleTaskManager = (id: string) => {
    setData((prev) => ({
      ...prev,
      taskManagers: prev.taskManagers.includes(id)
        ? prev.taskManagers.filter((t) => t !== id)
        : [...prev.taskManagers, id],
    }));
  };

  const handleConnectCalendar = (provider: typeof calendarProviders[0]) => {
    if (provider.authUrl) {
      // Open OAuth in same window (will redirect back after completion)
      window.location.href = `${provider.authUrl}?redirect=/onboarding`;
    } else {
      toast.error("iCloud Calendar n'est pas encore supporté");
    }
    setCalendarDropdownOpen(false);
  };

  const handleDisconnectCalendar = (calendarId: string) => {
    setData((prev) => ({
      ...prev,
      connectedCalendars: prev.connectedCalendars.filter((c) => c.id !== calendarId),
    }));
  };

  const toggleDayEnabled = (dayId: string) => {
    setData((prev) => ({
      ...prev,
      weeklyWorkHours: {
        ...prev.weeklyWorkHours,
        [dayId]: {
          ...prev.weeklyWorkHours[dayId],
          enabled: !prev.weeklyWorkHours[dayId].enabled,
          slots: !prev.weeklyWorkHours[dayId].enabled
            ? [{ start: "09:00", end: "17:00" }]
            : prev.weeklyWorkHours[dayId].slots,
        },
      },
    }));
  };

  const updateTimeSlot = (dayId: string, slotIndex: number, field: "start" | "end", value: string) => {
    setData((prev) => ({
      ...prev,
      weeklyWorkHours: {
        ...prev.weeklyWorkHours,
        [dayId]: {
          ...prev.weeklyWorkHours[dayId],
          slots: prev.weeklyWorkHours[dayId].slots.map((slot, idx) =>
            idx === slotIndex ? { ...slot, [field]: value } : slot
          ),
        },
      },
    }));
  };

  const addTimeSlot = (dayId: string) => {
    setData((prev) => ({
      ...prev,
      weeklyWorkHours: {
        ...prev.weeklyWorkHours,
        [dayId]: {
          ...prev.weeklyWorkHours[dayId],
          slots: [...prev.weeklyWorkHours[dayId].slots, { start: "13:00", end: "17:00" }],
        },
      },
    }));
  };

  const removeTimeSlot = (dayId: string, slotIndex: number) => {
    setData((prev) => ({
      ...prev,
      weeklyWorkHours: {
        ...prev.weeklyWorkHours,
        [dayId]: {
          ...prev.weeklyWorkHours[dayId],
          slots: prev.weeklyWorkHours[dayId].slots.filter((_, idx) => idx !== slotIndex),
        },
      },
    }));
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceSchedule = data.weeklyWorkHours[sourceDay];
    setData((prev) => ({
      ...prev,
      weeklyWorkHours: Object.fromEntries(
        daysOfWeek.map((day) => [
          day.id,
          day.id === sourceDay
            ? sourceSchedule
            : { enabled: sourceSchedule.enabled, slots: [...sourceSchedule.slots] },
        ])
      ),
    }));
    toast.success("Horaires copiés sur tous les jours");
  };

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Personnalisez votre
                <br />
                planificateur <span className="text-primary">pour vous</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Configurons DPM Calendar selon vos outils de travail, vos calendriers et votre emploi du temps. Ensuite, vous planifierez votre première journée!
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleNext}
              className="w-full max-w-xs mx-auto bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Suivant
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        );

      case "task-manager":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                Quel gestionnaire de tâches utilisez-vous?
              </h2>
              <p className="text-muted-foreground">
                Sélectionnez les outils que vous utilisez pour gérer vos tâches.
                <br />
                Nous vous aiderons à les connecter plus tard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {taskManagers.map((tm) => {
                const Logo = TaskManagerLogos[tm.id];
                return (
                  <button
                    key={tm.id}
                    onClick={() => toggleTaskManager(tm.id)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                      data.taskManagers.includes(tm.id)
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${tm.color}15` }}
                    >
                      {Logo && <Logo className="w-5 h-5" />}
                    </div>
                    <span className="font-medium flex-1 truncate">{tm.name}</span>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                        data.taskManagers.includes(tm.id)
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {data.taskManagers.includes(tm.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "calendar":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                Connectez vos calendriers
              </h2>
              <p className="text-muted-foreground">
                Visualisez et gérez tous vos calendriers depuis un seul endroit.
                <br />
                Nous ne vendrons jamais vos données.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              {/* Connected calendars */}
              {data.connectedCalendars.map((cal) => {
                const Logo = CalendarLogos[cal.provider];
                return (
                  <div
                    key={cal.id}
                    className="flex items-center gap-4 p-4 rounded-xl border bg-card"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                      {Logo && <Logo className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cal.email}</p>
                    </div>
                    <span className="text-sm text-emerald-500 font-medium">Lié</span>
                    <button
                      onClick={() => handleDisconnectCalendar(cal.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              {/* Add calendar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setCalendarDropdownOpen(!calendarDropdownOpen)}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Connecter un calendrier</span>
                </button>

                {calendarDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-lg z-50 overflow-hidden">
                    {calendarProviders.map((provider) => {
                      const Logo = CalendarLogos[provider.id];
                      const isConnected = data.connectedCalendars.some(
                        (c) => c.provider === provider.id
                      );
                      return (
                        <button
                          key={provider.id}
                          onClick={() => handleConnectCalendar(provider)}
                          disabled={!provider.authUrl}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 text-left hover:bg-muted transition-colors",
                            !provider.authUrl && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
                            {Logo && <Logo className="w-5 h-5" />}
                          </div>
                          <span className="font-medium">
                            {isConnected ? `${provider.name} (Connecté)` : `Ajouter ${provider.name}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* All calendars connected button */}
              {data.connectedCalendars.length > 0 && (
                <button
                  onClick={handleNext}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  J&apos;ai connecté tous mes calendriers
                </button>
              )}
            </div>
          </div>
        );

      case "work-hours":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                Définissez vos heures de travail
              </h2>
              <p className="text-muted-foreground">
                Choisissez les heures auxquelles vous souhaitez planifier des tâches.
                <br />
                Vous pourrez modifier cela plus tard dans les paramètres.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
              {daysOfWeek.map((day) => {
                const daySchedule = data.weeklyWorkHours[day.id];
                return (
                  <div
                    key={day.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-colors",
                      daySchedule.enabled ? "bg-card" : "bg-muted/30"
                    )}
                  >
                    {/* Day checkbox */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <button
                        onClick={() => toggleDayEnabled(day.id)}
                        className={cn(
                          "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                          daySchedule.enabled
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {daySchedule.enabled && <Check className="h-4 w-4 text-white" />}
                      </button>
                      <span className={cn("font-medium", !daySchedule.enabled && "text-muted-foreground")}>
                        {day.label}
                      </span>
                    </div>

                    {/* Time slots */}
                    {daySchedule.enabled && (
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        {daySchedule.slots.map((slot, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <TimeSelect
                              value={slot.start}
                              onChange={(v) => updateTimeSlot(day.id, idx, "start", v)}
                              className="w-28"
                            />
                            <span className="text-muted-foreground">-</span>
                            <TimeSelect
                              value={slot.end}
                              onChange={(v) => updateTimeSlot(day.id, idx, "end", v)}
                              className="w-28"
                            />
                            <button
                              onClick={() => addTimeSlot(day.id)}
                              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="Ajouter un créneau"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            {daySchedule.slots.length > 1 && (
                              <button
                                onClick={() => removeTimeSlot(day.id, idx)}
                                className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                title="Supprimer ce créneau"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => copyToAllDays(day.id)}
                              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="Copier sur tous les jours"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "planning":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                Quand planifiez-vous votre journée?
              </h2>
              <p className="text-muted-foreground">
                Nous vous aiderons à développer un rituel de planification
                <br />
                quotidien cohérent et sans stress.
              </p>
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <button
                onClick={() => setData((prev) => ({ ...prev, planningTime: "morning" }))}
                className={cn(
                  "flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all",
                  data.planningTime === "morning"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Le matin</span>
                </div>
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    data.planningTime === "morning"
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-muted-foreground/30"
                  )}
                >
                  {data.planningTime === "morning" && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setData((prev) => ({ ...prev, planningTime: "evening" }))}
                className={cn(
                  "flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all",
                  data.planningTime === "evening"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-violet-500" />
                  <span className="font-medium">La veille au soir</span>
                </div>
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    data.planningTime === "evening"
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-muted-foreground/30"
                  )}
                >
                  {data.planningTime === "evening" && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </div>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="DPM Calendar"
            width={48}
            height={48}
            className="h-10 w-10 sm:h-12 sm:w-12"
          />
          <span className="font-bold text-lg sm:text-xl">DPM Calendar</span>
        </div>
        {step !== "welcome" && (
          <button
            onClick={() => router.push("/home")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Passer la configuration
          </button>
        )}
      </header>

      {/* Progress bar */}
      {step !== "welcome" && (
        <div className="px-4 md:px-6">
          <div className="max-w-2xl mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-3xl">{renderStep()}</div>
      </main>

      {/* Footer with navigation buttons - fixed at bottom */}
      {step !== "welcome" && (
        <footer className="sticky bottom-0 bg-background border-t p-4 md:p-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>

            {step === "planning" ? (
              <Button
                onClick={handleComplete}
                disabled={completeOnboardingMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0"
              >
                {completeOnboardingMutation.isPending ? "Configuration..." : "Terminer"}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0"
              >
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </footer>
      )}

      {/* Bottom link */}
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Mauvais compte?{" "}
          <a href="/api/auth/signout" className="text-emerald-500 hover:underline">
            Se déconnecter
          </a>
          .
        </p>
      </div>
    </div>
  );
}
