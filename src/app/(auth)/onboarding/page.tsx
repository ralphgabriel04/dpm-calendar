"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Clock,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Task managers available for integration
const taskManagers = [
  { id: "asana", name: "Asana", icon: "/integrations/asana.svg", color: "#F06A6A" },
  { id: "linear", name: "Linear", icon: "/integrations/linear.svg", color: "#5E6AD2" },
  { id: "clickup", name: "ClickUp", icon: "/integrations/clickup.svg", color: "#7B68EE" },
  { id: "monday", name: "Monday.com", icon: "/integrations/monday.svg", color: "#FF3D57" },
  { id: "github", name: "GitHub", icon: "/integrations/github.svg", color: "#181717" },
  { id: "notion", name: "Notion", icon: "/integrations/notion.svg", color: "#000000" },
  { id: "gmail", name: "Gmail", icon: "/integrations/gmail.svg", color: "#EA4335" },
  { id: "outlook", name: "Outlook", icon: "/integrations/outlook.svg", color: "#0078D4" },
  { id: "google-tasks", name: "Google Tasks", icon: "/integrations/google-tasks.svg", color: "#4285F4" },
  { id: "todoist", name: "Todoist", icon: "/integrations/todoist.svg", color: "#E44332" },
  { id: "jira", name: "Jira", icon: "/integrations/jira.svg", color: "#0052CC" },
  { id: "trello", name: "Trello", icon: "/integrations/trello.svg", color: "#0079BF" },
];

// Calendar providers
const calendarProviders = [
  { id: "google", name: "Google Calendar", icon: "/integrations/google-calendar.svg", color: "#4285F4" },
  { id: "outlook", name: "Outlook Calendar", icon: "/integrations/outlook-calendar.svg", color: "#0078D4" },
  { id: "icloud", name: "iCloud Calendar", icon: "/integrations/icloud.svg", color: "#999999" },
];

// Time options for work hours
const timeOptions = [
  "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM", "10:00 PM",
];

type Step = "welcome" | "task-manager" | "calendar" | "start-time" | "end-time" | "planning";

interface OnboardingData {
  taskManagers: string[];
  calendars: string[];
  workStartTime: string;
  workEndTime: string;
  planningTime: "morning" | "evening";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [data, setData] = useState<OnboardingData>({
    taskManagers: [],
    calendars: [],
    workStartTime: "9:00 AM",
    workEndTime: "5:00 PM",
    planningTime: "morning",
  });

  const completeOnboardingMutation = trpc.user.completeOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Configuration terminee!");
      router.push("/home");
    },
    onError: () => {
      toast.error("Une erreur est survenue");
    },
  });

  const steps: Step[] = ["welcome", "task-manager", "calendar", "start-time", "end-time", "planning"];
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
    // Convert time strings to HH:mm format
    const convertTo24h = (time12h: string): string => {
      const [time, modifier] = time12h.split(" ");
      const timeParts = time.split(":");
      let hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];

      if (modifier === "PM" && hours !== 12) {
        hours += 12;
      }
      if (modifier === "AM" && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, "0")}:${minutes}`;
    };

    completeOnboardingMutation.mutate({
      connectedTaskManagers: data.taskManagers,
      connectedCalendars: data.calendars,
      workingHoursStart: convertTo24h(data.workStartTime),
      workingHoursEnd: convertTo24h(data.workEndTime),
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

  const toggleCalendar = (id: string) => {
    setData((prev) => ({
      ...prev,
      calendars: prev.calendars.includes(id)
        ? prev.calendars.filter((c) => c !== id)
        : [...prev.calendars, id],
    }));
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
                Configurons DPM Calendar selon vos outils de travail, vos calendriers et votre emploi du temps. Ensuite, vous planifierez votre premiere journee!
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
                Quel gestionnaire de taches utilisez-vous?
              </h2>
              <p className="text-muted-foreground">
                Selectionnez les outils que vous utilisez pour gerer vos taches.
                <br />
                Nous vous aiderons a les connecter plus tard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {taskManagers.map((tm) => (
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: tm.color }}
                  >
                    {tm.name.charAt(0)}
                  </div>
                  <span className="font-medium flex-1">{tm.name}</span>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
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
              ))}
            </div>

            <Button
              variant="secondary"
              onClick={handleNext}
              className="w-full max-w-lg mx-auto bg-muted/50 hover:bg-muted text-muted-foreground"
            >
              Passer
            </Button>
          </div>
        );

      case "calendar":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                Quel calendrier utilisez-vous?
              </h2>
              <p className="text-muted-foreground">
                DPM Calendar se synchronisera avec votre calendrier
                <br />
                et vous montrera votre emploi du temps chaque jour.
              </p>
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              {calendarProviders.map((cal) => (
                <button
                  key={cal.id}
                  onClick={() => {
                    toggleCalendar(cal.id);
                    // Optionally trigger OAuth flow here
                  }}
                  className={cn(
                    "flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all text-left",
                    data.calendars.includes(cal.id)
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${cal.color}20` }}
                  >
                    <Calendar className="h-5 w-5" style={{ color: cal.color }} />
                  </div>
                  <span className="font-medium flex-1">Ajouter {cal.name}</span>
                  {data.calendars.includes(cal.id) && (
                    <Check className="h-5 w-5 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              onClick={handleNext}
              className="w-full max-w-md mx-auto bg-muted/50 hover:bg-muted text-muted-foreground"
            >
              Passer
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case "start-time":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                A quelle heure commencez-vous a travailler?
              </h2>
              <p className="text-muted-foreground">
                Nous ne planifierons aucune tache avant cette heure.
                <br />
                Vous pouvez ajuster cela jour par jour.
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <select
                value={data.workStartTime}
                onChange={(e) => setData((prev) => ({ ...prev, workStartTime: e.target.value }))}
                className="w-full p-4 text-lg font-medium rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="lg"
              onClick={handleNext}
              className="w-full max-w-xs mx-auto bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Suivant
            </Button>
          </div>
        );

      case "end-time":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                A quelle heure arretez-vous de travailler?
              </h2>
              <p className="text-muted-foreground">
                Nous essaierons de vous aider a terminer votre travail avant cette heure.
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <select
                value={data.workEndTime}
                onChange={(e) => setData((prev) => ({ ...prev, workEndTime: e.target.value }))}
                className="w-full p-4 text-lg font-medium rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="lg"
              onClick={handleNext}
              className="w-full max-w-xs mx-auto bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Suivant
            </Button>
          </div>
        );

      case "planning":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                Quand planifiez-vous votre journee?
              </h2>
              <p className="text-muted-foreground">
                Nous vous aiderons a developper un rituel de planification
                <br />
                quotidien coherent et sans stress.
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

            <Button
              size="lg"
              onClick={handleComplete}
              disabled={completeOnboardingMutation.isPending}
              className="w-full max-w-md mx-auto bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {completeOnboardingMutation.isPending ? "Configuration..." : "Configurer ma routine"}
            </Button>
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
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="font-bold text-lg">DPM Calendar</span>
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
          <div className="max-w-md mx-auto h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">{renderStep()}</div>
      </main>

      {/* Footer */}
      {step !== "welcome" && step !== "planning" && (
        <footer className="p-4 md:p-6">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>

            {step !== "task-manager" && step !== "calendar" && (
              <Button
                onClick={handleNext}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
            Se deconnecter
          </a>
          .
        </p>
      </div>
    </div>
  );
}
