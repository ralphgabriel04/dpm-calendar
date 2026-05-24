"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";

export function TimeInsightsMockup() {
  const t = useTranslations("landing.mockups.timeInsights");
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">APRIL 10 - 16</span>
        <button className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <h4 className="font-semibold mb-4">{t("title")}</h4>
      <div className="flex items-center gap-6">
        <div className="text-sm text-muted-foreground">
          {t("breakdown").split(" ").map((word, i) => (
            <span key={i}>{word}<br /></span>
          ))}
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
            <span>{t("important")}</span>
          </div>
          <span className="text-muted-foreground">1.8 hr</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>{t("personal")}</span>
          </div>
          <span className="text-muted-foreground">4.2 hr</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>{t("accounting")}</span>
          </div>
          <span className="text-muted-foreground">3 hr</span>
        </div>
      </div>
    </div>
  );
}
