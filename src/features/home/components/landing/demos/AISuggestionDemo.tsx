"use client";

import { useState } from "react";
import { Brain, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { modulesCopy } from "../copy";

const a = modulesCopy.ai;

/** AISuggestionDemo — accept a suggestion → thinking sweep → applied. Ported
    from landing-demos2.jsx. */
export function AISuggestionDemo() {
  const [state, setState] = useState<"idle" | "thinking" | "applied">("idle");
  const accept = () => {
    setState("thinking");
    setTimeout(() => setState("applied"), 900);
  };
  const reset = () => setState("idle");

  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="gradient-violet flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px]">
          <Brain className="h-[15px] w-[15px] text-white" />
        </span>
        <div>
          <div className="text-[12.5px] font-semibold">DPM AI</div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="lp-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" /> online
          </div>
        </div>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-[10px] border p-3 transition-colors",
          state === "applied" ? "border-emerald-500/40 bg-emerald-500/[0.07]" : "border-primary/30 bg-primary/[0.05]"
        )}
      >
        {state === "thinking" && <div className="lp-sweep absolute inset-0" />}
        <div className="relative text-[13px] leading-relaxed">
          {state === "thinking" ? (
            <span className="font-mono text-[12px] text-muted-foreground">{a.thinking}</span>
          ) : (
            a.suggestion
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {state === "applied" ? (
          <>
            <span className="flex h-9 items-center gap-1.5 rounded-[8px] bg-emerald-500/[0.15] px-3 text-[13px] font-medium text-emerald-500">
              <Check className="h-3.5 w-3.5" strokeWidth={3} /> {a.applied}
            </span>
            <button onClick={reset} className="px-2 text-[12px] text-muted-foreground hover:text-foreground">
              ↻
            </button>
          </>
        ) : (
          <>
            <button
              onClick={accept}
              disabled={state === "thinking"}
              className="h-9 rounded-[8px] bg-primary px-4 text-[13px] font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {a.accept}
            </button>
            <button
              onClick={reset}
              disabled={state === "thinking"}
              className="h-9 rounded-[8px] border border-border px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              {a.dismiss}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
