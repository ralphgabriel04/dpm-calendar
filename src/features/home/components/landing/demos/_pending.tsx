"use client";

/* Temporary static placeholders for Modules rows whose fully interactive ports
   land in the next wave (Daily, Focus, Health, Spaces). Visually on-brand so the
   13-row disposition is complete; each is swapped for its real animated demo. */

import { Briefcase, Heart, Layers, Lock, Moon, Play } from "lucide-react";
import { modulesCopy } from "../copy";

export function DailyPlaceholder() {
  const steps = modulesCopy.daily.steps;
  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] font-semibold">Rituel de planification</span>
        <span className="font-mono text-[10px] text-muted-foreground">~2 min</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {steps.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-[9px] border border-border bg-card px-2.5 py-2"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/[0.14] font-mono text-[11px] font-bold text-primary">
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold leading-tight">{s.k}</div>
              <div className="truncate text-[10px] text-muted-foreground">{s.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FocusPlaceholder() {
  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="flex items-center gap-2.5 rounded-[9px] border border-primary/30 bg-primary/[0.06] px-3 py-2">
        <Lock className="h-3.5 w-3.5 text-primary" />
        <span className="text-[12px] font-semibold">Écrire le deck T2</span>
        <span className="ml-auto rounded-full bg-primary/[0.14] px-2 py-0.5 text-[9px] font-semibold text-primary">
          Verrouillée
        </span>
      </div>
      <div className="my-5 flex flex-col items-center">
        <div
          className="flex h-[120px] w-[120px] items-center justify-center rounded-full"
          style={{ background: "conic-gradient(hsl(var(--primary)) 264deg, hsl(var(--muted)) 0deg)" }}
        >
          <div className="flex h-[96px] w-[96px] flex-col items-center justify-center rounded-full bg-background">
            <span className="text-[26px] font-bold tabular-nums leading-none">18:24</span>
            <span className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">Focus</span>
          </div>
        </div>
        <button className="mt-4 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground">
          <Play className="h-3.5 w-3.5" /> Démarrer
        </button>
      </div>
    </div>
  );
}

export function HealthPlaceholder() {
  const vitals = modulesCopy.health.vitals;
  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] font-semibold">Santé & sommeil</span>
        <span className="font-mono text-[10px] text-muted-foreground">{modulesCopy.health.synced}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {vitals.map((v) => (
          <div key={v.k} className="rounded-[10px] border border-border bg-card p-2.5">
            <div className="text-[9.5px] uppercase tracking-wide text-muted-foreground">{v.label}</div>
            <div className="mt-1 text-[18px] font-bold leading-none" style={{ color: `hsl(${v.c})` }}>
              {v.v}
              {"unit" in v && v.unit ? <span className="ml-0.5 text-[10px] text-muted-foreground">{v.unit}</span> : null}
            </div>
            <div className="mt-1 text-[9.5px] text-muted-foreground">{v.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpacesPlaceholder() {
  const list = modulesCopy.spaces.list;
  const icons = { Layers, Briefcase, Heart, Moon } as const;
  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="mb-3 flex flex-col gap-1.5">
        {list.map((sp, i) => {
          const Ic = icons[sp.icon as keyof typeof icons] ?? Layers;
          return (
            <div
              key={sp.id}
              className="flex items-center gap-2.5 rounded-[9px] border px-2.5 py-2"
              style={
                i === 1
                  ? { borderColor: `hsl(${sp.c} / 0.5)`, background: `hsl(${sp.c} / 0.08)` }
                  : undefined
              }
            >
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px]"
                style={{ background: `hsl(${sp.c} / 0.16)`, color: `hsl(${sp.c})` }}
              >
                <Ic className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold leading-tight">{sp.n}</div>
                <div className="truncate text-[10px] text-muted-foreground">{sp.hours}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
