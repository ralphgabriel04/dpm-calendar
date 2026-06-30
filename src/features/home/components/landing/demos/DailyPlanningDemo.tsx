"use client";

import { Fragment, createElement, useRef, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid3x3,
  Layers,
  PenLine,
  Plus,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { modulesCopy } from "../copy";

const d = modulesCopy.daily;
const ICONS: LucideIcon[] = [Plus, Clock, Layers, Grid3x3, Calendar, PenLine];
const ESTS = ["15m", "30m", "1h", "2h"];
const QC = ["0 84% 60%", "263 70% 60%", "217 91% 60%", "215 16% 55%"];
const QLABEL = ["Faire", "Planifier", "Déléguer", "Abandonner"];

type Task = { id: number; label: string; est: number; q: number };

/** DailyPlanningDemo — the six-step planning ritual on your own tasks: add,
    estimate, fill, prioritize, schedule, document. Ported from landing-demos5.jsx. */
export function DailyPlanningDemo() {
  const [step, setStep] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, label: "Écrire le deck T2", est: 2, q: 0 },
    { id: 2, label: "Répondre à Léa", est: 0, q: 1 },
    { id: 3, label: "Gym", est: 2, q: 1 },
  ]);
  const [draft, setDraft] = useState("");
  const nextId = useRef(4);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    setTasks((ts) => [...ts, { id: nextId.current++, label: v, est: 1, q: 1 }]);
    setDraft("");
  };
  const remove = (id: number) => setTasks((ts) => ts.filter((x) => x.id !== id));
  const cycleEst = (id: number) => setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, est: (x.est + 1) % ESTS.length } : x)));
  const cycleQ = (id: number) => setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, q: (x.q + 1) % 4 } : x)));

  return (
    <div className="rounded-[12px] border border-border bg-background p-3.5">
      {/* step rail */}
      <div className="mb-3 flex items-center gap-1">
        {d.steps.map((s, i) => (
          <Fragment key={i}>
            <button onClick={() => setStep(i)} className="flex flex-shrink-0 items-center justify-center" title={s.k}>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                  i <= step ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-3 w-3" strokeWidth={3} /> : createElement(ICONS[i], { className: "h-3 w-3" })}
              </span>
            </button>
            {i < d.steps.length - 1 && (
              <div className={cn("h-0.5 flex-1 rounded-full transition-colors", i < step ? "bg-primary" : "bg-muted")} />
            )}
          </Fragment>
        ))}
      </div>

      <div className="min-h-[150px] rounded-[10px] border border-border bg-card/50 p-3.5">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="font-mono text-[10px] tabular-nums text-primary">0{step + 1}/06</span>
          <span className="text-[14px] font-semibold">{d.steps[step].k}</span>
          <span className="ml-auto text-[11px] text-muted-foreground">{d.steps[step].d}</span>
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder={d.placeholder}
                className="h-8 flex-1 rounded-[7px] border border-input bg-background px-2.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={add} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[7px] bg-primary text-white">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {tasks.map((x) => (
                <div key={x.id} className="flex items-center gap-2 rounded-[6px] border border-border bg-card px-2 py-1.5 text-[11.5px]">
                  <Plus className="h-[11px] w-[11px] text-primary" />
                  <span className="flex-1 truncate">{x.label}</span>
                  <button onClick={() => remove(x.id)} className="text-muted-foreground hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {tasks.length === 0 && <div className="px-1 py-2 text-[11px] italic text-muted-foreground">{d.placeholder}</div>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-1.5">
            {tasks.map((x) => (
              <div key={x.id} className="flex items-center gap-2 text-[11.5px]">
                <Clock className="h-[11px] w-[11px] text-primary" />
                <span className="flex-1 truncate">{x.label}</span>
                <button onClick={() => cycleEst(x.id)} className="rounded-full bg-primary/[0.12] px-2 py-0.5 font-mono text-[10px] tabular-nums text-primary">
                  {ESTS[x.est]}
                </button>
              </div>
            ))}
            {!tasks.length && <span className="text-[11px] italic text-muted-foreground">— ajoutez des tâches à l&apos;étape 01 —</span>}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-1">
            {["+ Méditation (habitude)", "+ Stand-up 09:00", "+ Déjeuner 12:30"].map((x, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Layers className="h-[11px] w-[11px] text-primary" />
                {x}
              </div>
            ))}
            <div className="mt-1 text-[10px] text-muted-foreground">
              + {tasks.length} {d.steps[0].k.toLowerCase()} tâches
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-1.5">
            {tasks.map((x) => (
              <div key={x.id} className="flex items-center gap-2 text-[11.5px]">
                <span className="flex-1 truncate">{x.label}</span>
                <button
                  onClick={() => cycleQ(x.id)}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold text-white"
                  style={{ background: `hsl(${QC[x.q]})` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                  {QLABEL[x.q]}
                </button>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-1 gap-1">
            {tasks.map((x) => (
              <div
                key={x.id}
                className="flex items-center justify-between rounded-[6px] px-2 py-1.5 text-[11px] font-medium text-white"
                style={{ background: `hsl(${QC[x.q]} / 0.9)` }}
              >
                <span className="truncate">{x.label}</span>
                <span className="font-mono text-[9px] opacity-80">{ESTS[x.est]}</span>
              </div>
            ))}
            {!tasks.length && <span className="text-[11px] italic text-muted-foreground">— rien à planifier —</span>}
          </div>
        )}

        {step === 5 && (
          <div className="rounded-[7px] border border-border p-2.5 text-[11.5px] text-muted-foreground">
            <span className="font-medium text-foreground">{tasks.length}</span> tâches planifiées ·
            <span className="font-medium text-foreground"> {tasks.filter((x) => x.q === 0).length}</span> pour aujourd&apos;hui.
            <div className="mt-1 italic">«&nbsp;{tasks[0]?.label || "Deep work"} d&apos;abord, puis le reste.&nbsp;»</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex h-8 items-center gap-1 rounded-[7px] border border-border px-3 text-[12px] font-medium disabled:opacity-40"
        >
          <ChevronLeft className="h-[13px] w-[13px]" />
        </button>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Sparkles className="h-2.5 w-2.5 text-primary" /> {d.addedNote}
        </span>
        <button
          onClick={() => setStep((s) => Math.min(5, s + 1))}
          disabled={step === 5}
          className="flex h-8 items-center gap-1 rounded-[7px] bg-primary px-4 text-[12px] font-medium text-white disabled:opacity-40"
        >
          {step === 5 ? "Terminé" : "Suivant"} <ChevronRight className="h-[13px] w-[13px]" />
        </button>
      </div>
    </div>
  );
}
