"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  ListTodo,
  Zap,
  Sparkles,
  Plus,
  X,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  BatteryCharging,
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { cn } from "@/shared/lib/utils";
import { trpc } from "@/infrastructure/trpc/client";
import { toast } from "sonner";

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
};

const calendarProviders = [
  { id: "google", name: "Google Calendar", color: "#4285F4", authUrl: "/api/auth/google-calendar" },
  { id: "microsoft", name: "Outlook Calendar", color: "#0078D4", authUrl: "/api/auth/microsoft-calendar" },
];

// Energy level configuration
const energyLevels = [
  { level: 1, label: "veryLow", icon: BatteryLow, color: "text-red-500", bgColor: "bg-red-500/10 hover:bg-red-500/20 border-red-500/30" },
  { level: 2, label: "low", icon: BatteryLow, color: "text-orange-500", bgColor: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30" },
  { level: 3, label: "medium", icon: BatteryMedium, color: "text-yellow-500", bgColor: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30" },
  { level: 4, label: "high", icon: BatteryFull, color: "text-green-500", bgColor: "bg-green-500/10 hover:bg-green-500/20 border-green-500/30" },
  { level: 5, label: "veryHigh", icon: BatteryCharging, color: "text-emerald-500", bgColor: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30" },
];

type Step = "welcome" | "tasks" | "energy" | "plan";

interface QuickTask {
  id: string;
  title: string;
}

export function OnboardingFlow() {
  const t = useTranslations("quickOnboarding");
  const router = useRouter();

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const steps: Step[] = ["welcome", "tasks", "energy", "plan"];
  const currentIndex = steps.indexOf(currentStep);

  // Step 1: Calendar connection
  const [connectedCalendars, setConnectedCalendars] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Step 2: Quick tasks
  const [tasks, setTasks] = useState<QuickTask[]>([
    { id: "1", title: "" },
    { id: "2", title: "" },
    { id: "3", title: "" },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Step 3: Energy level
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);

  // Step 4: Plan
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // tRPC mutations
  const createTaskMutation = trpc.task.create.useMutation();
  const logEnergyMutation = trpc.energy.log.useMutation();
  const completeOnboardingMutation = trpc.user.completeOnboarding.useMutation();
  const { data: dayPlan, refetch: refetchPlan } = trpc.aiScheduler.planDay.useQuery(
    { date: new Date() },
    { enabled: false }
  );

  // Calendar OAuth handler
  const handleConnectCalendar = async (providerId: string, authUrl: string) => {
    setIsConnecting(providerId);
    try {
      // Open OAuth popup
      const popup = window.open(
        authUrl,
        "calendar-auth",
        "width=500,height=600,scrollbars=yes"
      );

      // Listen for OAuth callback
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(null);
          // Check if connection succeeded
          setConnectedCalendars(prev =>
            prev.includes(providerId) ? prev : [...prev, providerId]
          );
        }
      }, 500);
    } catch {
      setIsConnecting(null);
      toast.error(t("errors.calendarConnection"));
    }
  };

  // Task handlers
  const updateTask = (id: string, title: string) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, title } : task
    ));
  };

  const addTask = () => {
    if (newTaskTitle.trim()) {
      setTasks(prev => [...prev, { id: Date.now().toString(), title: newTaskTitle }]);
      setNewTaskTitle("");
    }
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  // Submit tasks
  const submitTasks = async () => {
    const validTasks = tasks.filter(t => t.title.trim());

    for (const task of validTasks) {
      await createTaskMutation.mutateAsync({
        title: task.title,
        priority: "MEDIUM",
      });
    }

    return validTasks.length;
  };

  // Submit energy
  const submitEnergy = async () => {
    if (energyLevel) {
      await logEnergyMutation.mutateAsync({
        energyLevel,
      });
    }
  };

  // Generate plan
  const generatePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      await refetchPlan();
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Navigation
  const goToNext = async () => {
    const nextIndex = currentIndex + 1;

    // Handle step-specific logic
    if (currentStep === "tasks") {
      const count = await submitTasks();
      if (count > 0) {
        toast.success(t("tasks.created", { count }));
      }
    } else if (currentStep === "energy") {
      await submitEnergy();
      toast.success(t("energy.logged"));
    }

    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);

      // Auto-generate plan on step 4
      if (steps[nextIndex] === "plan") {
        generatePlan();
      }
    }
  };

  const goToPrevious = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  // Complete onboarding
  const handleComplete = async () => {
    try {
      await completeOnboardingMutation.mutateAsync({
        connectedCalendars,
      });
      toast.success(t("complete.success"));
      router.push("/dashboard");
    } catch {
      toast.error(t("errors.complete"));
    }
  };

  // Skip all
  const handleSkip = async () => {
    try {
      await completeOnboardingMutation.mutateAsync({});
      router.push("/dashboard");
    } catch {
      toast.error(t("errors.complete"));
    }
  };

  // Step indicators
  const stepIcons = {
    welcome: Calendar,
    tasks: ListTodo,
    energy: Zap,
    plan: Sparkles,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with progress */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Image
              src="/lightLogoFinal.png"
              alt="DPM Calendar"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("skip")}
            </button>
          </div>

          {/* Progress indicators */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((step, index) => {
              const Icon = stepIcons[step];
              const isActive = index === currentIndex;
              const isCompleted = index < currentIndex;

              return (
                <div key={step} className="flex items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      isActive && "bg-violet-500 text-white scale-110",
                      isCompleted && "bg-violet-500/20 text-violet-500",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-12 h-0.5 mx-1 transition-colors duration-300",
                        index < currentIndex ? "bg-violet-500" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Step 1: Welcome + Calendar */}
          {currentStep === "welcome" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{t("welcome.title")}</h1>
                <p className="text-muted-foreground">{t("welcome.subtitle")}</p>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-center">{t("welcome.connectCalendar")}</p>

                <div className="grid gap-3">
                  {calendarProviders.map((provider) => {
                    const Logo = CalendarLogos[provider.id];
                    const isConnected = connectedCalendars.includes(provider.id);
                    const isLoading = isConnecting === provider.id;

                    return (
                      <button
                        key={provider.id}
                        onClick={() => provider.authUrl && handleConnectCalendar(provider.id, provider.authUrl)}
                        disabled={isLoading || isConnected}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                          isConnected
                            ? "bg-green-500/10 border-green-500/30 text-green-600"
                            : "bg-card hover:bg-accent border-border hover:border-violet-500/30"
                        )}
                      >
                        <Logo className="w-8 h-8" />
                        <span className="flex-1 text-left font-medium">{provider.name}</span>
                        {isConnected ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : isLoading ? (
                          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  {t("welcome.calendarNote")}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Add Tasks */}
          {currentStep === "tasks" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{t("tasks.title")}</h1>
                <p className="text-muted-foreground">{t("tasks.subtitle")}</p>
              </div>

              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <Input
                      value={task.title}
                      onChange={(e) => updateTask(task.id, e.target.value)}
                      placeholder={t("tasks.placeholder")}
                      className="flex-1"
                    />
                    {tasks.length > 1 && (
                      <button
                        onClick={() => removeTask(task.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add more tasks */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    placeholder={t("tasks.addMore")}
                    className="flex-1"
                  />
                  <Button
                    onClick={addTask}
                    variant="ghost"
                    size="sm"
                    disabled={!newTaskTitle.trim()}
                  >
                    {t("tasks.add")}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {t("tasks.tip")}
              </p>
            </div>
          )}

          {/* Step 3: Energy Level */}
          {currentStep === "energy" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{t("energy.title")}</h1>
                <p className="text-muted-foreground">{t("energy.subtitle")}</p>
              </div>

              <div className="grid gap-3">
                {energyLevels.map((level) => {
                  const Icon = level.icon;
                  const isSelected = energyLevel === level.level;

                  return (
                    <button
                      key={level.level}
                      onClick={() => setEnergyLevel(level.level)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                        isSelected
                          ? `${level.bgColor} border-2`
                          : "bg-card hover:bg-accent border-border"
                      )}
                    >
                      <Icon className={cn("w-6 h-6", level.color)} />
                      <span className="flex-1 text-left font-medium">
                        {t(`energy.levels.${level.label}`)}
                      </span>
                      {isSelected && (
                        <Check className={cn("w-5 h-5", level.color)} />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {t("energy.tip")}
              </p>
            </div>
          )}

          {/* Step 4: Plan */}
          {currentStep === "plan" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{t("plan.title")}</h1>
                <p className="text-muted-foreground">{t("plan.subtitle")}</p>
              </div>

              {isGeneratingPlan ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <Sparkles className="w-12 h-12 text-violet-500 animate-pulse" />
                    <div className="absolute inset-0 w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-muted-foreground">{t("plan.generating")}</p>
                </div>
              ) : dayPlan?.proposals && dayPlan.proposals.length > 0 ? (
                <div className="space-y-3">
                  {dayPlan.proposals.slice(0, 5).map((proposal, index) => (
                    <div
                      key={proposal.taskId || index}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                    >
                      <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{proposal.taskTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {proposal.label}
                        </p>
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        proposal.energyMatch === "optimal" && "bg-green-500/10 text-green-600",
                        proposal.energyMatch === "good" && "bg-yellow-500/10 text-yellow-600",
                        proposal.energyMatch === "acceptable" && "bg-orange-500/10 text-orange-600"
                      )}>
                        {t(`plan.match.${proposal.energyMatch}`)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">{t("plan.noTasks")}</p>
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                {t("plan.tip")}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer with navigation */}
      <footer className="border-t border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={cn(currentIndex === 0 && "invisible")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("previous")}
            </Button>

            <span className="text-sm text-muted-foreground">
              {t("step", { current: currentIndex + 1, total: steps.length })}
            </span>

            {currentStep === "plan" ? (
              <Button onClick={handleComplete}>
                {t("complete.button")}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={goToNext}>
                {t("next")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
