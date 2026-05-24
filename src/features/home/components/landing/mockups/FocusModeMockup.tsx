"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Target, Check } from "lucide-react";

export function FocusModeMockup() {
  const t = useTranslations("landing.mockups.focusMode");
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
          <h4 className="font-semibold">{t("title")}</h4>
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="h-4 w-4 text-emerald-500" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <p className="font-medium text-emerald-500 mb-2">{t("congrats")}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {t("completedSessions", { count: totalSessions })}
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            {t("restart")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold">{t("title")}</h4>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isRunning ? "bg-emerald-500/20 animate-pulse" : "bg-muted"
        }`}>
          <Target className={`h-4 w-4 ${isRunning ? "text-emerald-500" : "text-muted-foreground"}`} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">{t("currentTask")}</p>
        <p className="font-medium mb-4">{t("taskName")}</p>
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
          {t("session")} {currentSession}/{totalSessions}
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
            {isRunning ? t("pause") : timeLeft < TOTAL_TIME ? t("resume") : t("start")}
          </button>
          <button
            onClick={handleComplete}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            {currentSession < totalSessions ? t("nextSession") : t("finish")}
          </button>
        </div>
        {timeLeft < TOTAL_TIME && (
          <button
            onClick={handleReset}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("reset")}
          </button>
        )}
      </div>
    </div>
  );
}
