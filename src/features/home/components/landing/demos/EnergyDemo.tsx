"use client";

import { useState } from "react";
import { Activity, Sparkles } from "lucide-react";
import { useInView } from "../lpHooks";
import { modulesCopy } from "../copy";

const e = modulesCopy.energy;
const TONES = ["215 16% 55%", "217 70% 58%", "263 70% 60%", "142 70% 50%"];

/** EnergyDemo — tap a slot to cycle its level; bars grow on entry (replay on
    re-entry) and the peak slot drives the suggested deep-work time. */
export function EnergyDemo() {
  const [levels, setLevels] = useState([1, 2, 3, 2, 1, 0]); // 0..3 per slot
  const [ref, seen] = useInView(0.3);
  const cycle = (i: number) => setLevels((ls) => ls.map((v, k) => (k === i ? (v + 1) % 4 : v)));
  const peak = levels.reduce((best, v, i) => (v > levels[best] ? i : best), 0);

  return (
    <div ref={ref} className="rounded-[12px] border border-border bg-background p-4">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-[15px] w-[15px] text-primary" />
        <span className="text-[13px] font-semibold tracking-tight">{e.tag}</span>
      </div>
      <div className="grid h-[132px] grid-cols-6 items-end gap-2">
        {levels.map((v, i) => (
          <button key={i} onClick={() => cycle(i)} className="group flex h-full flex-col items-center justify-end gap-1">
            <div
              className="w-full origin-bottom rounded-[6px] transition-all duration-500 ease-out group-hover:opacity-90"
              style={{
                height: seen ? `${((v + 1) / 4) * 100}%` : "0%",
                transitionDelay: `${i * 55}ms`,
                background: `hsl(${TONES[v]} / ${i === peak ? 1 : 0.55})`,
                boxShadow: i === peak ? `0 0 0 1px hsl(${TONES[v]})` : "none",
              }}
            />
            <span className="font-mono text-[9.5px] text-muted-foreground">{e.times[i]}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-primary/30 bg-primary/[0.06] px-3 py-2">
        <Sparkles className="h-[13px] w-[13px] flex-shrink-0 text-primary" />
        <span className="text-[12px]">
          <span className="text-muted-foreground">{e.ai}</span>
          <span className="font-semibold">{e.times[peak]}</span>
        </span>
      </div>
    </div>
  );
}
