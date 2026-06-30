"use client";

import { useState } from "react";
import { Activity, Coffee, Plus, Shield, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { modulesCopy } from "../copy";

const r = modulesCopy.rules;
const ICONS: Record<string, LucideIcon> = { Shield, Coffee, Zap, Activity };

type Rule = { id: number; n: string; d: string; icon: string; c: string; runs: number; on: boolean };

/** RulesDemo — toggle Si…/Alors… automations on and off; each enable bumps the
    run counter. Ported from landing-demos4.jsx. */
export function RulesDemo() {
  const [rules, setRules] = useState<Rule[]>(r.items.map((it, i) => ({ ...it, id: i })));
  const toggle = (id: number) =>
    setRules((rs) => rs.map((x) => (x.id === id ? { ...x, on: !x.on, runs: !x.on ? x.runs + 1 : x.runs } : x)));

  return (
    <div className="rounded-[12px] border border-border bg-background p-3.5">
      <div className="flex flex-col gap-2">
        {rules.map((rule) => {
          const Ic = ICONS[rule.icon] ?? Shield;
          return (
            <div
              key={rule.id}
              className={cn(
                "flex items-center gap-2.5 rounded-[9px] border p-2.5 transition-colors",
                rule.on ? "border-border bg-card" : "border-border/60 bg-muted/20 opacity-70"
              )}
            >
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px]"
                style={{ background: `hsl(${rule.c} / 0.16)`, color: `hsl(${rule.c})` }}
              >
                <Ic className="h-[15px] w-[15px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold leading-tight">{rule.n}</div>
                <div className="truncate text-[10px] text-muted-foreground">{rule.d}</div>
              </div>
              <div className="flex-shrink-0 whitespace-nowrap font-mono text-[9px] tabular-nums text-muted-foreground">
                {rule.runs} {r.runs}
              </div>
              <button
                onClick={() => toggle(rule.id)}
                aria-label={rule.on ? "Désactiver" : "Activer"}
                className={cn("flex h-5 w-9 flex-shrink-0 rounded-full p-0.5 transition-colors", rule.on ? "bg-primary" : "bg-muted")}
              >
                <span className={cn("h-4 w-4 rounded-full bg-white transition-transform", rule.on && "translate-x-4")} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <div className="mb-2 font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">{r.templates}</div>
        <div className="flex flex-wrap gap-1.5">
          {r.templateChips.map((tpl) => (
            <span
              key={tpl}
              className="flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Plus className="h-2.5 w-2.5" /> {tpl}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
