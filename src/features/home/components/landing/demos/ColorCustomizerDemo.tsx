"use client";

import { useState, type CSSProperties } from "react";
import { Check, Heart, Moon, Sun } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { modulesCopy } from "../copy";

const c = modulesCopy.customize;
const ACCENTS = [
  { name: "Violet", triple: "263 70% 60%" },
  { name: "Bleu", triple: "217 91% 60%" },
  { name: "Émeraude", triple: "152 65% 45%" },
  { name: "Ambre", triple: "33 92% 52%" },
  { name: "Rose", triple: "342 80% 60%" },
  { name: "Cyan", triple: "190 85% 48%" },
];

/** ColorCustomizerDemo — pick an accent and the whole demo re-themes live; the
    preview card flips light/dark. Accent is scoped to this demo (via a local
    --primary override) so it never fights the site theme. */
export function ColorCustomizerDemo() {
  const [accent, setAccent] = useState("263 70% 60%");
  const [light, setLight] = useState(false);

  return (
    <div
      className="rounded-[12px] border border-border bg-background p-4"
      style={{ ["--primary" as string]: accent } as CSSProperties}
    >
      <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">{c.accent}</div>
      <div className="mb-5 flex flex-wrap gap-2">
        {ACCENTS.map((a) => {
          const on = accent === a.triple;
          return (
            <button
              key={a.triple}
              onClick={() => setAccent(a.triple)}
              title={a.name}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-transform",
                on ? "scale-105 ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110"
              )}
              style={{ background: `hsl(${a.triple})` }}
            >
              {on && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">{c.appearance}</div>
      <div className="mb-5 inline-flex items-center gap-0.5 rounded-[10px] border border-border bg-muted/40 p-0.5">
        {[
          { v: false, Icon: Moon, label: c.dark },
          { v: true, Icon: Sun, label: c.light },
        ].map((o) => (
          <button
            key={String(o.v)}
            onClick={() => setLight(o.v)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-medium transition-all",
              light === o.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <o.Icon className="h-3.5 w-3.5" /> {o.label}
          </button>
        ))}
      </div>

      {/* live preview chips */}
      <div
        className={cn(
          "space-y-2.5 rounded-[10px] border p-3 transition-colors",
          light ? "border-zinc-200 bg-white text-zinc-900" : "border-border bg-card text-foreground"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium">Aperçu</span>
          <span className="rounded-full bg-primary/[0.14] px-2 py-0.5 text-[10px] font-semibold text-primary">Live</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 items-center rounded-[8px] bg-primary px-3 text-[12px] font-medium text-white">Primaire</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border-2 border-primary">
            <Heart className="h-3.5 w-3.5 text-primary" />
          </span>
          <div className={cn("h-1.5 flex-1 overflow-hidden rounded-full", light ? "bg-zinc-200" : "bg-muted")}>
            <div className="h-full w-2/3 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
