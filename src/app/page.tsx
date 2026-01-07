"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  CheckSquare,
  Target,
  BarChart3,
  Clock,
  ArrowRight,
  Check,
  ChevronDown,
  Twitter,
  Linkedin,
  Github,
  X,
  Layers,
  Eye,
  Shield,
  Lock,
  Cloud,
  GraduationCap,
  Briefcase,
  Users,
  Rocket,
  Zap,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme";
import { LanguageToggle } from "@/components/language";

// Feature accordion data with descriptions and mockup components
const featureData = [
  {
    id: "time-tracking",
    title: "Suivez comment vous utilisez votre temps",
    icon: Clock,
    color: "violet",
    description:
      "La fonctionnalité d'utilisation du temps vous aide à analyser votre emploi du temps en vous indiquant comment vous occupez votre temps et avec qui.",
    features: [
      "Rapports de productivité détaillés",
      "Temps par projet et catégorie",
      "Graphiques et tendances visuels",
    ],
    MockupComponent: TimeInsightsMockup,
  },
  {
    id: "focus-mode",
    title: "Bloquez les distractions",
    icon: Target,
    color: "emerald",
    description:
      "Le mode Focus vous permet de vous concentrer sur une seule tâche à la fois avec la technique Pomodoro intégrée et le blocage des notifications.",
    features: [
      "Technique Pomodoro intégrée",
      "Blocage des notifications",
      "Suivi du temps de concentration",
    ],
    MockupComponent: FocusModeMockup,
  },
  {
    id: "multi-calendar",
    title: "Restez organisé avec plusieurs agendas",
    icon: Layers,
    color: "blue",
    description:
      "Gérez plusieurs calendriers en un seul endroit. Synchronisez automatiquement vos agendas Google, Microsoft et Apple.",
    features: [
      "Synchronisation Google Calendar",
      "Intégration Microsoft Outlook",
      "Calendriers personnels et professionnels",
    ],
    MockupComponent: MultiCalendarMockup,
  },
  {
    id: "custom-views",
    title: "Personnalisez votre vue",
    icon: Eye,
    color: "orange",
    description:
      "Choisissez la vue qui vous convient le mieux : jour, semaine, mois ou agenda. Personnalisez les couleurs et l'affichage selon vos préférences.",
    features: [
      "Vues jour, semaine, mois, agenda",
      "Drag & drop intuitif",
      "Personnalisation des couleurs",
    ],
    MockupComponent: CustomViewsMockup,
  },
  {
    id: "goals",
    title: "Atteignez vos objectifs",
    icon: BarChart3,
    color: "pink",
    description:
      "Définissez des objectifs SMART et suivez votre progression. Liez vos tâches à vos objectifs pour rester motivé et organisé.",
    features: [
      "Objectifs SMART",
      "Suivi de progression visuel",
      "Jalons et étapes clés",
    ],
    MockupComponent: GoalsMockup,
  },
];

// Color mapping
const colorStyles: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  violet: {
    bg: "rgba(139, 92, 246, 0.1)",
    border: "rgb(139, 92, 246)",
    text: "#8b5cf6",
    accent: "bg-violet-500",
  },
  emerald: {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgb(16, 185, 129)",
    text: "#10b981",
    accent: "bg-emerald-500",
  },
  blue: {
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgb(59, 130, 246)",
    text: "#3b82f6",
    accent: "bg-blue-500",
  },
  orange: {
    bg: "rgba(249, 115, 22, 0.1)",
    border: "rgb(249, 115, 22)",
    text: "#f97316",
    accent: "bg-orange-500",
  },
  pink: {
    bg: "rgba(236, 72, 153, 0.1)",
    border: "rgb(236, 72, 153)",
    text: "#ec4899",
    accent: "bg-pink-500",
  },
};

// Mockup Components
function TimeInsightsMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">APRIL 10 - 16</span>
        <button className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <h4 className="font-semibold mb-4">Time Insights</h4>
      <div className="flex items-center gap-6">
        <div className="text-sm text-muted-foreground">
          Time<br />breakdown
        </div>
        {/* Donut Chart */}
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/30" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="50 201" strokeDashoffset="0" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12" strokeDasharray="105 201" strokeDashoffset="-50" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="75 201" strokeDashoffset="-155" />
          </svg>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Important</span>
          </div>
          <span className="text-muted-foreground">1.8 hr</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Personal</span>
          </div>
          <span className="text-muted-foreground">4.2 hr</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Accounting</span>
          </div>
          <span className="text-muted-foreground">3 hr</span>
        </div>
      </div>
    </div>
  );
}

function FocusModeMockup() {
  const TOTAL_TIME = 25 * 60; // 25 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const totalSessions = 4;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Auto advance to next session or complete
      if (currentSession < totalSessions) {
        setTimeout(() => {
          setCurrentSession((prev) => prev + 1);
          setTimeLeft(TOTAL_TIME);
        }, 500);
      } else {
        setIsCompleted(true);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, currentSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100;

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleComplete = () => {
    if (currentSession < totalSessions) {
      setCurrentSession((prev) => prev + 1);
      setTimeLeft(TOTAL_TIME);
      setIsRunning(false);
    } else {
      setIsCompleted(true);
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setTimeLeft(TOTAL_TIME);
    setCurrentSession(1);
    setIsRunning(false);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-semibold">Focus Mode</h4>
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="h-4 w-4 text-emerald-500" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <p className="font-medium text-emerald-500 mb-2">Félicitations !</p>
          <p className="text-sm text-muted-foreground mb-4">
            Vous avez terminé vos {totalSessions} sessions de focus !
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold">Focus Mode</h4>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isRunning ? "bg-emerald-500/20 animate-pulse" : "bg-muted"
        }`}>
          <Target className={`h-4 w-4 ${isRunning ? "text-emerald-500" : "text-muted-foreground"}`} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Tâche en cours</p>
        <p className="font-medium mb-4">Rapport trimestriel Q1</p>
        <div className={`text-4xl font-mono font-bold mb-4 transition-colors ${
          isRunning ? "text-emerald-500" : timeLeft < TOTAL_TIME ? "text-orange-500" : "text-muted-foreground"
        }`}>
          {formatTime(timeLeft)}
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Session {currentSession}/{totalSessions}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleStartPause}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isRunning
                ? "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30"
                : "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
            }`}
          >
            {isRunning ? "Pause" : timeLeft < TOTAL_TIME ? "Reprendre" : "Démarrer"}
          </button>
          <button
            onClick={handleComplete}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            {currentSession < totalSessions ? "Session suivante" : "Terminer"}
          </button>
        </div>
        {timeLeft < TOTAL_TIME && (
          <button
            onClick={handleReset}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

function MultiCalendarMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <h4 className="font-semibold mb-4">Mes Calendriers</h4>
      <div className="space-y-3">
        {[
          { name: "Travail", color: "bg-violet-500", connected: true },
          { name: "Personnel", color: "bg-green-500", connected: true },
          { name: "Sport", color: "bg-orange-500", connected: true },
        ].map((cal) => (
          <div key={cal.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${cal.color}`} />
              <span className="text-sm font-medium">{cal.name}</span>
            </div>
            <Check className="h-4 w-4 text-green-500" />
          </div>
        ))}
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-xs text-muted-foreground mb-2">Connectés</p>
          {[
            { name: "Google Calendar", icon: "🔗" },
            { name: "Microsoft Outlook", icon: "🔗" },
          ].map((provider) => (
            <div key={provider.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <span>{provider.icon}</span>
                <span className="text-sm">{provider.name}</span>
              </div>
              <span className="text-xs text-green-500">Synced</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomViewsMockup() {
  const [activeView, setActiveView] = useState<"Jour" | "Semaine" | "Mois">("Semaine");
  const [selectedDay, setSelectedDay] = useState<number>(10); // Default selected day
  const views = ["Jour", "Semaine", "Mois"] as const;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="flex items-center gap-1 mb-4">
        {views.map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              activeView === view
                ? "bg-violet-500 text-white scale-105"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Vue Jour */}
      {activeView === "Jour" && (
        <div className="animate-in fade-in duration-200">
          <div className="text-center mb-3">
            <div className="text-lg font-semibold">Mercredi 10</div>
            <div className="text-xs text-muted-foreground">Janvier 2025</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">08:00</span>
              <div className="flex-1 border-t border-dashed border-muted h-0" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">09:00</span>
              <div className="flex-1 p-1.5 rounded bg-violet-500/20 border-l-2 border-violet-500">
                Réunion équipe
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">10:00</span>
              <div className="flex-1 border-t border-dashed border-muted h-0" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">11:00</span>
              <div className="flex-1 border-t border-dashed border-muted h-0" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">12:00</span>
              <div className="flex-1 p-1.5 rounded bg-green-500/20 border-l-2 border-green-500">
                Déjeuner
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">14:00</span>
              <div className="flex-1 p-1.5 rounded bg-blue-500/20 border-l-2 border-blue-500">
                Appel client
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">15:00</span>
              <div className="flex-1 border-t border-dashed border-muted h-0" />
            </div>
          </div>
        </div>
      )}

      {/* Vue Semaine */}
      {activeView === "Semaine" && (
        <div className="animate-in fade-in duration-200">
          <div className="grid grid-cols-7 gap-1 text-xs mb-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day} className="text-center text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-3">
            {[6, 7, 8, 9, 10, 11, 12].map((num) => (
              <button
                key={num}
                onClick={() => setSelectedDay(num)}
                className={`aspect-square rounded flex items-center justify-center text-xs transition-all duration-200 ${
                  selectedDay === num
                    ? "bg-violet-500 text-white scale-110 shadow-lg shadow-violet-500/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-violet-500/20 hover:text-violet-500"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            {selectedDay === 8 && (
              <div className="flex items-center gap-2 p-1.5 rounded bg-green-500/20 text-xs animate-in fade-in duration-200">
                <div className="w-1 h-4 rounded bg-green-500" />
                <span>10:00 - Présentation projet</span>
              </div>
            )}
            {selectedDay === 10 && (
              <>
                <div className="flex items-center gap-2 p-1.5 rounded bg-violet-500/20 text-xs animate-in fade-in duration-200">
                  <div className="w-1 h-4 rounded bg-violet-500" />
                  <span>9:00 - Réunion équipe</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-blue-500/20 text-xs animate-in fade-in duration-200">
                  <div className="w-1 h-4 rounded bg-blue-500" />
                  <span>14:00 - Appel client</span>
                </div>
              </>
            )}
            {selectedDay === 9 && (
              <div className="flex items-center gap-2 p-1.5 rounded bg-orange-500/20 text-xs animate-in fade-in duration-200">
                <div className="w-1 h-4 rounded bg-orange-500" />
                <span>11:30 - Déjeuner équipe</span>
              </div>
            )}
            {selectedDay === 12 && (
              <div className="flex items-center gap-2 p-1.5 rounded bg-pink-500/20 text-xs animate-in fade-in duration-200">
                <div className="w-1 h-4 rounded bg-pink-500" />
                <span>16:00 - Sport</span>
              </div>
            )}
            {[6, 7, 11].includes(selectedDay) && (
              <div className="text-xs text-muted-foreground text-center py-2 animate-in fade-in duration-200">
                Aucun événement ce jour
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vue Mois */}
      {activeView === "Mois" && (
        <div className="animate-in fade-in duration-200">
          <div className="text-center mb-3">
            <div className="text-sm font-semibold">Janvier 2025</div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-[10px] mb-1">
            {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
              <div key={i} className="text-center text-muted-foreground py-0.5">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - 2; // Commence mercredi
              const isCurrentMonth = dayNum >= 1 && dayNum <= 31;
              const isSelected = dayNum === selectedDay;
              const hasEvent = [8, 9, 10, 12, 15, 22].includes(dayNum);

              return (
                <button
                  key={i}
                  onClick={() => isCurrentMonth && setSelectedDay(dayNum)}
                  disabled={!isCurrentMonth}
                  className={`aspect-square rounded flex flex-col items-center justify-center text-[10px] relative transition-all duration-200 ${
                    isSelected
                      ? "bg-violet-500 text-white scale-110 shadow-lg shadow-violet-500/30 z-10"
                      : isCurrentMonth
                      ? "bg-muted/50 text-muted-foreground hover:bg-violet-500/20 hover:text-violet-500"
                      : "text-muted-foreground/30 cursor-default"
                  }`}
                >
                  {isCurrentMonth ? dayNum : ""}
                  {hasEvent && isCurrentMonth && !isSelected && (
                    <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-violet-500" />
                  )}
                </button>
              );
            })}
          </div>
          {/* Events for selected day */}
          <div className="mt-2 space-y-1">
            {selectedDay === 8 && (
              <div className="flex items-center gap-2 p-1 rounded bg-green-500/20 text-[10px] animate-in fade-in duration-200">
                <div className="w-1 h-3 rounded bg-green-500" />
                <span>10:00 - Présentation</span>
              </div>
            )}
            {selectedDay === 10 && (
              <div className="flex items-center gap-2 p-1 rounded bg-violet-500/20 text-[10px] animate-in fade-in duration-200">
                <div className="w-1 h-3 rounded bg-violet-500" />
                <span>9:00 - Réunion</span>
              </div>
            )}
            {selectedDay === 15 && (
              <div className="flex items-center gap-2 p-1 rounded bg-blue-500/20 text-[10px] animate-in fade-in duration-200">
                <div className="w-1 h-3 rounded bg-blue-500" />
                <span>14:00 - Deadline</span>
              </div>
            )}
            {selectedDay === 22 && (
              <div className="flex items-center gap-2 p-1 rounded bg-orange-500/20 text-[10px] animate-in fade-in duration-200">
                <div className="w-1 h-3 rounded bg-orange-500" />
                <span>Anniversaire</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GoalsMockup() {
  const [phases, setPhases] = useState([
    { id: 1, name: "Phase 1 - Recherche", completed: true },
    { id: 2, name: "Phase 2 - Design", completed: true },
    { id: 3, name: "Phase 3 - Développement", completed: true },
    { id: 4, name: "Phase 4 - Tests", completed: false },
  ]);

  const completedCount = phases.filter((p) => p.completed).length;
  const progress = Math.round((completedCount / phases.length) * 100);

  const togglePhase = (id: number) => {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id === id ? { ...phase, completed: !phase.completed } : phase
      )
    );
  };

  // Find the current phase (first incomplete one)
  const currentPhaseIndex = phases.findIndex((p) => !p.completed);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <h4 className="font-semibold mb-4">Objectif en cours</h4>
      <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">Finir projet client</span>
          <span className="text-xs text-pink-500 font-semibold transition-all duration-300">
            {progress}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-pink-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="space-y-2">
        {phases.map((phase, index) => {
          const isCurrentPhase = index === currentPhaseIndex;

          return (
            <button
              key={phase.id}
              onClick={() => togglePhase(phase.id)}
              className="flex items-center gap-2 text-sm w-full text-left hover:bg-muted/50 rounded-lg p-1 -ml-1 transition-colors group"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  phase.completed
                    ? "bg-green-500 scale-100"
                    : isCurrentPhase
                    ? "bg-pink-500/20 border border-pink-500"
                    : "bg-muted group-hover:bg-muted/80"
                }`}
              >
                {phase.completed ? (
                  <Check className="h-3 w-3 text-white animate-in zoom-in duration-200" />
                ) : isCurrentPhase ? (
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                ) : null}
              </div>
              <span
                className={`transition-all duration-300 ${
                  phase.completed
                    ? "text-muted-foreground line-through"
                    : isCurrentPhase
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {phase.name}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Cliquez sur une phase pour la cocher/décocher
      </p>
    </div>
  );
}

// Hero Mockup Component
function HeroMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-violet-500/10">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="ml-2 text-xs text-muted-foreground">DPM Calendar</span>
      </div>
      <div className="p-4 bg-gradient-to-br from-muted to-muted/50">
        <div className="flex gap-3">
          {/* Mini Sidebar */}
          <div className="w-32 space-y-2 rounded-lg border border-border bg-card p-2">
            <div className="h-4 w-16 rounded bg-violet-500/30" />
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-violet-500" />
                <div className="h-2 w-12 rounded bg-muted" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="h-2 w-10 rounded bg-muted" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="h-2 w-14 rounded bg-muted" />
              </div>
            </div>
          </div>
          {/* Mini Calendar Grid */}
          <div className="flex-1 rounded-lg border border-border bg-card p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-16 rounded bg-violet-500/30" />
              <div className="flex gap-1">
                <div className="h-3 w-8 rounded bg-muted" />
                <div className="h-3 w-8 rounded bg-violet-500/30" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded flex items-center justify-center text-[8px] ${
                    i === 2 ? "bg-violet-500 text-white" : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeFeature, setActiveFeature] = useState<string>("time-tracking");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/logo-full.png"
                alt="DPM Calendar"
                width={200}
                height={50}
                className="h-10 sm:h-12 w-auto dark:brightness-100 brightness-90"
                priority
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <Link
                href="/login"
                className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all"
              >
                Essayer
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Simplified 2 columns */}
      <section className="pt-28 pb-16 lg:pt-32 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Votre temps,{" "}
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  mérite mieux
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Calendrier, tâches, habitudes et objectifs réunis dans une seule application.
                Synchronisez avec Google Calendar et Microsoft Outlook.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="group flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#features"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-base font-semibold hover:bg-accent transition-all"
                >
                  Voir les fonctionnalités
                </Link>
              </div>
            </div>
            {/* Right: Mockup */}
            <div className="hidden lg:block">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça fonctionne - 3 Steps */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Comment ça{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                fonctionne
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Trois étapes simples pour transformer votre productivité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-2xl border border-border bg-card p-8 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                    <MousePointerClick className="h-6 w-6" />
                  </div>
                  <span className="text-4xl font-bold text-violet-500/20">01</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Connectez vos calendriers</h3>
                <p className="text-muted-foreground">
                  Importez vos événements Google, Microsoft ou Apple en un clic. Tout est synchronisé automatiquement.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-2xl border border-border bg-card p-8 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <span className="text-4xl font-bold text-emerald-500/20">02</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Planifiez intelligemment</h3>
                <p className="text-muted-foreground">
                  Créez des tâches, définissez des objectifs et laissez l&apos;IA vous suggérer le meilleur moment pour les réaliser.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-2xl border border-border bg-card p-8 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
                    <Zap className="h-6 w-6" />
                  </div>
                  <span className="text-4xl font-bold text-pink-500/20">03</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Atteignez vos objectifs</h3>
                <p className="text-muted-foreground">
                  Suivez vos progrès, analysez votre productivité et célébrez vos accomplissements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Accordion Style */}
      <section id="features" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Left: Accordion */}
            <div className="space-y-0">
              {featureData.map((feature) => {
                const isActive = activeFeature === feature.id;
                const colors = colorStyles[feature.color];

                return (
                  <div
                    key={feature.id}
                    className="border-l-4 transition-colors"
                    style={{ borderColor: isActive ? colors.border : "transparent" }}
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => setActiveFeature(feature.id)}
                      className="w-full text-left py-4 px-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h3
                          className={`text-lg font-semibold transition-colors ${
                            isActive ? "" : "text-muted-foreground"
                          }`}
                          style={isActive ? { color: colors.text } : undefined}
                        >
                          {feature.title}
                        </h3>
                        <ChevronDown
                          className={`h-5 w-5 transition-transform duration-300 ${
                            isActive ? "rotate-180" : ""
                          }`}
                          style={isActive ? { color: colors.text } : undefined}
                        />
                      </div>
                    </button>

                    {/* Accordion Content */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isActive ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-4 pb-6">
                        <p className="text-muted-foreground mb-4">{feature.description}</p>
                        <ul className="space-y-2">
                          {feature.features.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-sm">
                              <div
                                className="flex h-5 w-5 items-center justify-center rounded-full"
                                style={{ backgroundColor: colors.bg }}
                              >
                                <Check className="h-3 w-3" style={{ color: colors.text }} />
                              </div>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Mobile Mockup */}
                        <div className="mt-6 lg:hidden">
                          <feature.MockupComponent />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Mockup (Desktop) */}
            <div className="hidden lg:flex items-start justify-center sticky top-24">
              {featureData.map((feature) => {
                if (feature.id !== activeFeature) return null;
                return (
                  <div
                    key={feature.id}
                    className="w-full max-w-sm animate-in fade-in duration-300"
                  >
                    <feature.MockupComponent />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Conçu pour{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                vous
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Que vous soyez étudiant, entrepreneur ou freelance, DPM Calendar s&apos;adapte à votre mode de vie.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Etudiants */}
            <div className="group rounded-2xl border border-border bg-card p-6 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 text-violet-500 mb-5 group-hover:scale-110 transition-transform">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Étudiants</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gérez vos cours, examens et projets. Ne manquez plus jamais une deadline.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Rappels de cours
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Suivi des examens
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Planification des révisions
                </li>
              </ul>
            </div>

            {/* Entrepreneurs */}
            <div className="group rounded-2xl border border-border bg-card p-6 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 text-emerald-500 mb-5 group-hover:scale-110 transition-transform">
                <Rocket className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Entrepreneurs</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Développez votre business en gardant le contrôle de votre emploi du temps.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Gestion de projets
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Suivi des objectifs
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Analytics de productivité
                </li>
              </ul>
            </div>

            {/* Freelances */}
            <div className="group rounded-2xl border border-border bg-card p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-500 mb-5 group-hover:scale-110 transition-transform">
                <Briefcase className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Freelances</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Jonglez avec plusieurs clients et projets sans perdre le fil.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Multi-calendriers
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Time tracking
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Facturation facilitée
                </li>
              </ul>
            </div>

            {/* Equipes */}
            <div className="group rounded-2xl border border-border bg-card p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 text-orange-500 mb-5 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Équipes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Collaborez efficacement et synchronisez les agendas de toute l&apos;équipe.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Calendriers partagés
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Planification de réunions
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Coordination simplifiée
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl mb-8">
            Synchronisez vos calendriers préférés
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* Google */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 hover:border-primary/50 transition-colors">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-medium text-sm">Google</span>
            </div>

            {/* Microsoft */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 hover:border-primary/50 transition-colors">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#00A4EF" d="M1 13h10v10H1z" />
                <path fill="#7FBA00" d="M13 1h10v10H13z" />
                <path fill="#FFB900" d="M13 13h10v10H13z" />
              </svg>
              <span className="font-medium text-sm">Microsoft</span>
            </div>

            {/* Apple */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 hover:border-primary/50 transition-colors">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="font-medium text-sm">Apple</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 mb-6">
                <Shield className="h-4 w-4" />
                Sécurité renforcée
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl mb-6">
                Vos données sont{" "}
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  protégées
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Nous prenons la sécurité de vos données très au sérieux. Votre vie privée est notre priorité.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500 flex-shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Chiffrement de bout en bout</h3>
                    <p className="text-sm text-muted-foreground">
                      Toutes vos données sont chiffrées avec les derniers standards de sécurité.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500 flex-shrink-0">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Hébergé en Europe</h3>
                    <p className="text-sm text-muted-foreground">
                      Vos données restent en Europe, en conformité avec le RGPD.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500 flex-shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Authentification sécurisée</h3>
                    <p className="text-sm text-muted-foreground">
                      OAuth 2.0 avec Google et Microsoft, sans stockage de mots de passe.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Trust badges */}
            <div className="lg:pl-8">
              <div className="rounded-2xl border border-border bg-card p-8">
                <h3 className="font-semibold text-lg mb-6 text-center">Certifications & Conformité</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <span className="font-semibold text-sm">RGPD</span>
                    <span className="text-xs text-muted-foreground">Conforme</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                      <Lock className="h-6 w-6 text-blue-500" />
                    </div>
                    <span className="font-semibold text-sm">SSL/TLS</span>
                    <span className="text-xs text-muted-foreground">256-bit</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-3">
                      <Cloud className="h-6 w-6 text-violet-500" />
                    </div>
                    <span className="font-semibold text-sm">Backup</span>
                    <span className="text-xs text-muted-foreground">Quotidien</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-3">
                      <Shield className="h-6 w-6 text-orange-500" />
                    </div>
                    <span className="font-semibold text-sm">OAuth 2.0</span>
                    <span className="text-xs text-muted-foreground">Sécurisé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Clean */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Prêt à reprendre le contrôle de{" "}
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              votre temps
            </span>
            ?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Rejoignez des milliers d&apos;utilisateurs qui ont transformé leur productivité.
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all"
            >
              Commencer gratuitement
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Gratuit pour toujours - Pas de carte de crédit requise
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Logo */}
            <div className="col-span-2 md:col-span-1">
              <Image
                src="/logo-full.png"
                alt="DPM Calendar"
                width={160}
                height={40}
                className="h-10 w-auto mb-4 dark:brightness-100 brightness-90"
              />
              <p className="text-sm text-muted-foreground">
                Votre assistant de productivité intelligent.
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Tarifs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Ressources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:support@dpmcalendar.com" className="hover:text-foreground transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    CGU
                  </a>
                </li>
                <li>
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" />
                    Conforme RGPD
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DPM Calendar. Tous droits réservés.
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/dpmcalendar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-violet-600 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/dpmcalendar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-violet-600 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/dpmcalendar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-violet-600 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
