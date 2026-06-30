"use client";

import { createElement, useState } from "react";
import { Briefcase, GraduationCap, Heart, Layers, Lock, Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { modulesCopy } from "../copy";

const sp = modulesCopy.spaces;
const ICONS: Record<string, LucideIcon> = { Layers, Briefcase, Heart, GraduationCap };

/** SpacesDemo — switch contexts (the preview re-tints) and edit per-member,
    per-module access. Ported from landing-demos4.jsx (self-scoped tinting). */
export function SpacesDemo() {
  const [active, setActive] = useState("pro");
  const space = sp.list.find((s) => s.id === active) ?? sp.list[0];
  const [perms, setPerms] = useState<(number[] | null)[]>(() =>
    sp.people.map((_, i) => (i === 0 ? null : i === 1 ? [2, 1, 0, 1, 0] : [1, 1, 0, 0, 0]))
  );
  const [sel, setSel] = useState(1);
  const setLevel = (mi: number, li: number) =>
    setPerms((ps) => ps.map((row, ri) => (ri === sel && row ? row.map((x, k) => (k === mi ? li : x)) : row)));
  const roleOf = (i: number) => {
    if (i === 0) return null;
    const row = perms[i] || [];
    if (row.some((v) => v === 2)) return sp.levels[2];
    if (row.some((v) => v === 1)) return sp.levels[1];
    return sp.levels[0];
  };

  return (
    <div className="rounded-[12px] border border-border bg-background p-3.5">
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {sp.list.map((s) => {
          const Ic = ICONS[s.icon] ?? Layers;
          const on = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className="flex h-9 items-center gap-1.5 rounded-full border pl-1.5 pr-2.5 text-[12px] font-semibold transition-all"
              style={
                on
                  ? { background: `hsl(${s.c} / 0.16)`, borderColor: `hsl(${s.c} / 0.5)`, color: `hsl(${s.c})` }
                  : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
              }
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: on ? `hsl(${s.c} / 0.22)` : "hsl(var(--muted)/0.5)" }}
              >
                <Ic className="h-[13px] w-[13px]" />
              </span>
              {s.n}
              {s.id === "all" && <span className="text-[8px] font-semibold uppercase opacity-70">{sp.union}</span>}
            </button>
          );
        })}
      </div>

      {/* scoped preview, tinted by space */}
      <div className="rounded-[10px] border p-3" style={{ borderColor: `hsl(${space.c} / 0.3)`, background: `hsl(${space.c} / 0.05)` }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[9px]"
              style={{ background: `hsl(${space.c} / 0.18)`, color: `hsl(${space.c})` }}
            >
              {createElement(ICONS[space.icon] ?? Layers, { className: "h-4 w-4" })}
            </span>
            <div>
              <div className="text-[13px] font-bold" style={{ color: `hsl(${space.c})` }}>
                {space.n}
              </div>
              <div className="text-[10px] text-muted-foreground">{space.hours}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[18px] font-bold leading-none tabular-nums">{sp.counts[space.id]}</div>
            <div className="text-[9px] text-muted-foreground">{sp.scoped}</div>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">{sp.members}</span>
          <span className="flex cursor-pointer items-center gap-1 text-[9.5px] font-semibold" style={{ color: `hsl(${space.c})` }}>
            <Plus className="h-2.5 w-2.5" /> {sp.invite}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {sp.people.map((p, i) => {
            const owner = i === 0;
            const selected = i === sel;
            return (
              <button
                key={i}
                onClick={() => !owner && setSel(i)}
                disabled={owner}
                className={cn(
                  "flex items-center gap-2 rounded-[7px] border px-2 py-1.5 text-left transition-colors",
                  selected && !owner ? "" : "border-border bg-card",
                  !owner && "cursor-pointer hover:border-primary/40"
                )}
                style={selected && !owner ? { borderColor: `hsl(${space.c} / 0.6)`, background: `hsl(${space.c} / 0.07)` } : {}}
              >
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: `hsl(${p.c})` }}
                >
                  {p.i}
                </span>
                <span className="flex-1 truncate text-[11.5px] font-medium">{p.n}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold",
                    owner ? "bg-primary/[0.14] text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {owner ? p.r : roleOf(i)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2.5 rounded-[8px] border border-border bg-card/50 p-2.5">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            {sp.permsFor} {sp.people[sel].n.split(" ")[0]}
          </div>
          <div className="flex flex-col gap-1.5">
            {sp.modules.map((mod, mi) => {
              const v = (perms[sel] || [])[mi] || 0;
              return (
                <div key={mi} className="flex items-center gap-2">
                  <span className="flex-1 truncate text-[10px]">{mod}</span>
                  <div className="inline-flex flex-shrink-0 overflow-hidden rounded-[6px] border border-border">
                    {sp.levels.map((lvl, li) => (
                      <button
                        key={li}
                        onClick={() => setLevel(mi, li)}
                        className={cn(
                          "h-5 px-1.5 text-[8.5px] font-medium transition-colors",
                          v === li ? (li === 0 ? "bg-muted text-foreground" : "text-white") : "text-muted-foreground hover:bg-accent/50"
                        )}
                        style={v === li && li > 0 ? { background: `hsl(${space.c})` } : {}}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
            <Lock className="h-[9px] w-[9px]" /> {sp.tapHint}
          </div>
        </div>
      </div>
    </div>
  );
}
