"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function CustomViewsMockup() {
  const t = useTranslations("landing.mockups.views");
  const [activeView, setActiveView] = useState<"day" | "week" | "month">("week");
  const [selectedDay, setSelectedDay] = useState<number>(10);
  const views = [
    { key: "day" as const, label: t("day") },
    { key: "week" as const, label: t("week") },
    { key: "month" as const, label: t("month") },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="flex items-center gap-1 mb-4">
        {views.map((view) => (
          <button
            key={view.key}
            onClick={() => setActiveView(view.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              activeView === view.key
                ? "bg-violet-500 text-white scale-105"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Day View */}
      {activeView === "day" && (
        <div className="animate-in fade-in duration-200">
          <div className="text-center mb-3">
            <div className="text-lg font-semibold">{t("wednesday")} 10</div>
            <div className="text-xs text-muted-foreground">{t("january")} 2025</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">08:00</span>
              <div className="flex-1 border-t border-dashed border-muted h-0" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">09:00</span>
              <div className="flex-1 p-1.5 rounded bg-violet-500/20 border-l-2 border-violet-500">
                {t("teamMeeting")}
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
                {t("lunch")}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">14:00</span>
              <div className="flex-1 p-1.5 rounded bg-blue-500/20 border-l-2 border-blue-500">
                {t("clientCall")}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-muted-foreground">15:00</span>
              <div className="flex-1 border-t border-dashed border-muted h-0" />
            </div>
          </div>
        </div>
      )}

      {/* Week View */}
      {activeView === "week" && (
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
                <span>10:00 - {t("presentation")}</span>
              </div>
            )}
            {selectedDay === 10 && (
              <>
                <div className="flex items-center gap-2 p-1.5 rounded bg-violet-500/20 text-xs animate-in fade-in duration-200">
                  <div className="w-1 h-4 rounded bg-violet-500" />
                  <span>9:00 - {t("teamMeeting")}</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-blue-500/20 text-xs animate-in fade-in duration-200">
                  <div className="w-1 h-4 rounded bg-blue-500" />
                  <span>14:00 - {t("clientCall")}</span>
                </div>
              </>
            )}
            {selectedDay === 9 && (
              <div className="flex items-center gap-2 p-1.5 rounded bg-orange-500/20 text-xs animate-in fade-in duration-200">
                <div className="w-1 h-4 rounded bg-orange-500" />
                <span>11:30 - {t("teamLunch")}</span>
              </div>
            )}
            {selectedDay === 12 && (
              <div className="flex items-center gap-2 p-1.5 rounded bg-pink-500/20 text-xs animate-in fade-in duration-200">
                <div className="w-1 h-4 rounded bg-pink-500" />
                <span>16:00 - {t("sports")}</span>
              </div>
            )}
            {[6, 7, 11].includes(selectedDay) && (
              <div className="text-xs text-muted-foreground text-center py-2 animate-in fade-in duration-200">
                {t("noEvent")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Month View */}
      {activeView === "month" && (
        <div className="animate-in fade-in duration-200">
          <div className="text-center mb-3">
            <div className="text-sm font-semibold">{t("january")} 2025</div>
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
              const dayNum = i - 2;
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
                <span>10:00 - {t("presentation")}</span>
              </div>
            )}
            {selectedDay === 10 && (
              <div className="flex items-center gap-2 p-1 rounded bg-violet-500/20 text-[10px] animate-in fade-in duration-200">
                <div className="w-1 h-3 rounded bg-violet-500" />
                <span>9:00 - {t("meeting")}</span>
              </div>
            )}
            {selectedDay === 15 && (
              <div className="flex items-center gap-2 p-1 rounded bg-blue-500/20 text-[10px] animate-in fade-in duration-200">
                <div className="w-1 h-3 rounded bg-blue-500" />
                <span>14:00 - {t("deadline")}</span>
              </div>
            )}
            {selectedDay === 22 && (
              <div className="flex items-center gap-2 p-1 rounded bg-orange-500/20 text-[10px] animate-in fade-in duration-200">
                <div className="w-1 h-3 rounded bg-orange-500" />
                <span>{t("birthday")}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
