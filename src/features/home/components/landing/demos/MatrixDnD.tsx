"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const QUAD = [
  { id: 0, key: "do", label: "À faire", color: "0 84% 60%" },
  { id: 1, key: "plan", label: "Planifier", color: "263 70% 60%" },
  { id: 2, key: "delegate", label: "Déléguer", color: "217 91% 60%" },
  { id: 3, key: "drop", label: "Abandonner", color: "215 16% 55%" },
];

const TASKS = [
  "Bug critique en prod",
  "Stratégie Q3",
  "Mettre à jour le wiki",
  "Notifications email non lues",
];

type Task = { id: number; idx: number; q: number };

/** MatrixDnD — drag tasks between the four Eisenhower quadrants. Ported from
    the DPM Elevate prototype (landing-demos.jsx). */
export function MatrixDnD() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, idx: 0, q: 0 },
    { id: 2, idx: 1, q: 1 },
    { id: 3, idx: 2, q: 2 },
    { id: 4, idx: 3, q: 3 },
  ]);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number } | null>(null);
  const [hotQ, setHotQ] = useState<number | null>(null);

  const startDrag = (e: React.PointerEvent, id: number) => {
    setDrag({ id, x: e.clientX, y: e.clientY });
    const move = (ev: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY } : d));
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const zone = el?.closest("[data-q]");
      setHotQ(zone ? Number(zone.getAttribute("data-q")) : null);
    };
    const up = (ev: PointerEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const zone = el?.closest("[data-q]");
      if (zone) {
        const q = Number(zone.getAttribute("data-q"));
        setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, q } : x)));
      }
      setDrag(null);
      setHotQ(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    e.preventDefault();
  };

  const dragTask = drag && tasks.find((x) => x.id === drag.id);

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-2.5">
        {QUAD.map((q) => (
          <div
            key={q.id}
            data-q={q.id}
            className={cn(
              "lp-dropzone flex min-h-[112px] flex-col rounded-[10px] border border-border bg-background p-2.5",
              hotQ === q.id && "lp-drop-hot"
            )}
          >
            <div className="mb-2 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${q.color})` }} />
              <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: `hsl(${q.color})` }}>
                {q.label}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {tasks
                .filter((x) => x.q === q.id && !(drag && drag.id === x.id))
                .map((x) => (
                  <button
                    key={x.id}
                    onPointerDown={(e) => startDrag(e, x.id)}
                    className="lp-draggable flex items-center gap-1.5 rounded-[7px] border border-border bg-card px-2.5 py-1.5 text-left text-[11.5px] font-medium hover:border-primary/40"
                  >
                    <GripVertical className="h-[11px] w-[11px] flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">{TASKS[x.idx]}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      {dragTask && drag && (
        <div
          className="lp-dragging pointer-events-none fixed z-[60] flex items-center gap-1.5 rounded-[7px] border border-primary/50 bg-card px-2.5 py-1.5 text-[11.5px] font-medium"
          style={{ left: drag.x, top: drag.y, transform: "translate(-30%, -50%) rotate(-2deg)" }}
        >
          <GripVertical className="h-[11px] w-[11px] text-primary" />
          {TASKS[dragTask.idx]}
        </div>
      )}
    </div>
  );
}
