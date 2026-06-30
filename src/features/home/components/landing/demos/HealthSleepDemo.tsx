"use client";

import { createElement, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bird,
  Check,
  Heart,
  Moon,
  RefreshCw,
  Smartphone,
  Sparkles,
  Sun,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { modulesCopy } from "../copy";

const h = modulesCopy.health;
const ICONS: Record<string, LucideIcon> = { Activity, Moon, Heart, Zap, Sun, Bird };
const bars7 = [0.55, 0.7, 0.5, 0.8, 0.62, 0.74, 0.95];

/** HealthSleepDemo — vitals / sleep / chronotype tabs, AI recovery slot, and
    toggleable health sources. Ported from landing-demos5.jsx. */
export function HealthSleepDemo() {
  const [tab, setTab] = useState(0);
  const [srcOn, setSrcOn] = useState(() => h.sources.map((s) => s.on));
  const [syncMsg, setSyncMsg] = useState<string>(h.synced);
  const toggleSrc = (i: number) => setSrcOn((a) => a.map((v, k) => (k === i ? !v : v)));

  return (
    <div className="rounded-[12px] border border-border bg-background p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-[15px] w-[15px] text-emerald-500" />
          <span className="text-[13px] font-semibold">{h.tag.split(" · ")[0]}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9.5px] text-muted-foreground">
          <span className="lp-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" /> {syncMsg}
        </div>
      </div>

      <div className="mb-3 inline-flex items-center gap-0.5 rounded-[8px] border border-border bg-muted/40 p-0.5">
        {h.tabs.map((tb, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={cn(
              "h-7 rounded-[6px] px-3 text-[11px] font-medium transition-all",
              tab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {tb}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="grid grid-cols-2 gap-2">
          {h.vitals.map((v) => (
            <div key={v.k} className="rounded-[10px] border border-border bg-card/50 p-2.5">
              <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide" style={{ color: `hsl(${v.c})` }}>
                {createElement(ICONS[v.icon] ?? Activity, { className: "h-[11px] w-[11px]" })} {v.label}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[20px] font-bold leading-none tabular-nums">{v.v}</span>
                {"unit" in v && v.unit ? <span className="text-[10px] text-muted-foreground">{v.unit}</span> : null}
              </div>
              <div className="mt-0.5 text-[9.5px]" style={{ color: `hsl(${v.c})` }}>
                {v.sub}
              </div>
              <div className="mt-2 flex h-5 items-end gap-0.5">
                {bars7.map((b, i) => (
                  <div key={i} className="flex-1 rounded-[2px]" style={{ height: `${b * 100}%`, background: `hsl(${v.c} / ${i === 6 ? 1 : 0.4})` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 1 && (
        <div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {h.sleepStats.map(([l, v, s], i) => (
              <div
                key={i}
                className={cn("rounded-[9px] border p-2 text-center", i === 1 ? "border-primary/40 bg-primary/[0.06]" : "border-border")}
              >
                <div className="text-[8.5px] uppercase tracking-wide text-muted-foreground">{l}</div>
                <div className="mt-0.5 text-[15px] font-bold tabular-nums">{v}</div>
                <div className="text-[8.5px] text-muted-foreground">{s}</div>
              </div>
            ))}
          </div>
          <div className="flex h-16 items-end gap-1.5">
            {[7.5, 6.8, 7.2, 8.1, 6.5, 7.4, 7.4].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-[3px] bg-primary/70" style={{ height: `${(v / 9) * 100}%` }} />
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: i % 3 === 1 ? "hsl(38 92% 55%)" : "hsl(142 70% 50%)" }} />
              </div>
            ))}
          </div>
          <div className="mt-1 text-center font-mono text-[8.5px] text-muted-foreground">{h.sleepNote}</div>
        </div>
      )}

      {tab === 2 && (
        <div className="flex flex-col gap-1.5">
          {h.chronotypes.map((ct) => {
            const Ic = ICONS[ct.icon] ?? Sun;
            return (
              <div
                key={ct.id}
                className={cn("flex items-center gap-2.5 rounded-[9px] border p-2.5", ct.on ? "border-primary/50 bg-primary/[0.07]" : "border-border")}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px]",
                    ct.on ? "bg-primary/[0.18] text-primary" : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Ic className="h-[15px] w-[15px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                    {ct.n}
                    {ct.on && <Check className="h-3 w-3 text-primary" strokeWidth={3} />}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{ct.d}</div>
                </div>
                <span className="whitespace-nowrap font-mono text-[9.5px] text-muted-foreground">{ct.hrs}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-primary/30 bg-primary/[0.06] p-2.5">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px] bg-primary">
          <Sparkles className="h-3 w-3 text-white" />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] leading-snug">
            {h.ai}
            <span className="font-bold">{h.aiTime}</span>.
          </div>
          <button className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-primary">
            <ArrowRight className="h-[11px] w-[11px]" /> {h.seeSlot}
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-[10px] border border-border bg-card/50 p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">{h.sync.label}</span>
          <button
            onClick={() => setSyncMsg(h.sync.just)}
            className="flex items-center gap-1 rounded-full bg-emerald-500/[0.16] px-2 py-0.5 text-[9.5px] font-semibold text-emerald-500"
          >
            <RefreshCw className="h-2.5 w-2.5" /> {h.sync.now}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {h.sources.map((s, i) => (
            <button
              key={i}
              onClick={() => toggleSrc(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9.5px] transition-colors",
                srcOn[i] ? "" : "border-dashed border-border text-muted-foreground"
              )}
              style={srcOn[i] ? { borderColor: `hsl(${s.c} / 0.5)`, background: `hsl(${s.c} / 0.12)`, color: "hsl(var(--foreground))" } : {}}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: srcOn[i] ? `hsl(${s.c})` : "hsl(var(--muted-foreground))" }} />
              {s.n}
              {srcOn[i] && <Check className="h-[9px] w-[9px] text-emerald-500" strokeWidth={3} />}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
          <Smartphone className="h-[9px] w-[9px]" /> {h.sync.auto}
        </div>
      </div>
    </div>
  );
}
