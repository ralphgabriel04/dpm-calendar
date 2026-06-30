"use client";

import { useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { modulesCopy } from "../copy";

const c = modulesCopy.calendar;
const LP_KIND: Record<string, string> = {
  event: "217 91% 60%",
  focus: "263 70% 60%",
  task: "142 70% 45%",
  personal: "330 80% 60%",
};

type Block = { id: number; col: number; top: number; h: number; kind: string; ev: number; time: string };

/** LiveCalendarDemo — the hero's interactive calendar: day/week/month views and
    drag-to-reschedule blocks on the week grid. Ported from landing-demos.jsx. */
export function LiveCalendarDemo() {
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, col: 0, top: 6, h: 13, kind: "event", ev: 0, time: "09:00" },
    { id: 2, col: 1, top: 22, h: 30, kind: "focus", ev: 1, time: "10:30" },
    { id: 3, col: 2, top: 12, h: 20, kind: "task", ev: 2, time: "09:30" },
    { id: 4, col: 3, top: 50, h: 12, kind: "personal", ev: 3, time: "12:30" },
    { id: 5, col: 4, top: 30, h: 24, kind: "event", ev: 4, time: "11:00" },
  ]);
  const [dragId, setDragId] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const startDrag = (e: React.PointerEvent, id: number) => {
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const b = blocks.find((x) => x.id === id);
    if (!b) return;
    const move = (ev: PointerEvent) => {
      const relX = (ev.clientX - rect.left) / rect.width;
      const relY = (ev.clientY - rect.top) / rect.height;
      const col = Math.max(0, Math.min(4, Math.floor(relX * 5)));
      let top = relY * 100 - b.h / 2;
      top = Math.max(0, Math.min(100 - b.h, top));
      setBlocks((bs) => bs.map((x) => (x.id === id ? { ...x, col, top } : x)));
    };
    const up = () => {
      setBlocks((bs) => bs.map((x) => (x.id === id ? { ...x, top: Math.round(x.top / 4) * 4 } : x)));
      setDragId(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    setDragId(id);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    e.preventDefault();
  };

  const views = [
    { value: "day" as const, label: c.views.day },
    { value: "week" as const, label: c.views.week },
    { value: "month" as const, label: c.views.month },
  ];

  return (
    <div className="rounded-[12px] border border-border bg-background p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[14px] font-semibold tracking-tight">{c.monthLabel}</div>
        <div className="inline-flex items-center gap-0.5 rounded-[8px] border border-border bg-muted/40 p-0.5">
          {views.map((v) => (
            <button
              key={v.value}
              onClick={() => setView(v.value)}
              className={cn(
                "h-7 rounded-[6px] px-2.5 text-[11.5px] font-medium transition-all",
                view === v.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "week" && (
        <>
          <div className="mb-1.5 grid grid-cols-5 gap-1 text-center">
            {c.days.map((d, i) => (
              <div
                key={i}
                className={cn("rounded py-0.5 text-[10.5px] font-medium", i === 2 ? "bg-primary/10 text-primary" : "text-muted-foreground")}
              >
                {d}
              </div>
            ))}
          </div>
          <div ref={gridRef} className="dotted-grid relative h-[208px] overflow-hidden rounded-[8px] border border-border">
            {[0, 1, 2, 3, 4].map((col) => (
              <div key={col} className="absolute bottom-0 top-0 border-r border-border/50" style={{ left: `${(col + 1) * 20}%`, width: 0 }} />
            ))}
            {blocks.map((b) => (
              <button
                key={b.id}
                onPointerDown={(e) => startDrag(e, b.id)}
                className={cn("lp-evt lp-draggable absolute overflow-hidden rounded-[6px] p-1.5 text-left text-white", dragId === b.id && "lp-dragging")}
                style={{
                  left: `calc(${b.col * 20}% + 3px)`,
                  width: "calc(20% - 6px)",
                  top: `${b.top}%`,
                  height: `${b.h}%`,
                  background: `hsl(${LP_KIND[b.kind]} / 0.9)`,
                }}
              >
                <div className="font-mono text-[8.5px] leading-none opacity-80">{b.time}</div>
                <div className="mt-0.5 truncate text-[9.5px] font-medium leading-tight">{c.events[b.ev]}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {view === "day" && (
        <div className="h-[238px] divide-y divide-border/60 overflow-hidden rounded-[8px] border border-border">
          {blocks
            .slice()
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((b) => (
              <div key={b.id} className="flex items-stretch gap-2.5 p-2.5">
                <div className="w-10 pt-0.5 font-mono text-[10px] text-muted-foreground">{b.time}</div>
                <div className="w-1 flex-shrink-0 rounded-full" style={{ background: `hsl(${LP_KIND[b.kind]})` }} />
                <div className="py-0.5 text-[12px] font-medium">{c.events[b.ev]}</div>
              </div>
            ))}
        </div>
      )}

      {view === "month" && (
        <div className="grid h-[238px] grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => {
            const day = i - 2;
            const evs = [3, 8, 9, 14, 17, 22, 23, 28].includes(i);
            const isToday = i === 16;
            return (
              <div
                key={i}
                className={cn(
                  "relative rounded-[5px] border p-1 text-[9px]",
                  day > 0 && day <= 31 ? "border-border/60" : "border-transparent text-muted-foreground/30",
                  isToday && "border-primary/40 bg-primary/10"
                )}
              >
                <span className={cn("font-mono", isToday && "font-semibold text-primary")}>{day > 0 && day <= 31 ? day : ""}</span>
                {evs && day > 0 && day <= 31 && (
                  <div className="mt-1 flex gap-0.5">
                    <span className="h-1 w-1 rounded-full" style={{ background: "hsl(217 91% 60%)" }} />
                    <span className="h-1 w-1 rounded-full" style={{ background: "hsl(263 70% 60%)" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
