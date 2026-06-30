"use client";

import { useRef, useState } from "react";
import { Check, Flame } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { lpCelebrate } from "../lpFx";
import { modulesCopy } from "../copy";

const h = modulesCopy.habits;

/** HabitTrackerDemo — tap the days you showed up; the streak grows, the flame
    lights, and checking a day bursts confetti. Ported from landing-demos.jsx. */
export function HabitTrackerDemo() {
  const [days, setDays] = useState([true, true, true, true, false, false, false]);
  const hostRef = useRef<HTMLDivElement>(null);

  // streak = longest run of consecutive checked days
  const streak = (() => {
    let best = 0,
      run = 0;
    for (const d of days) {
      run = d ? run + 1 : 0;
      if (run > best) best = run;
    }
    return best;
  })();

  const toggle = (i: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !days[i];
    setDays((d) => d.map((v, k) => (k === i ? next : v)));
    if (next && hostRef.current) {
      const host = hostRef.current;
      const box = e.currentTarget.getBoundingClientRect();
      const hb = host.getBoundingClientRect();
      const b = document.createElement("div");
      b.style.cssText = `position:absolute;left:${box.left - hb.left + box.width / 2}px;top:${box.top - hb.top + box.height / 2}px;`;
      host.appendChild(b);
      lpCelebrate(b, ["38 92% 56%", "20 90% 58%", "0 84% 62%"]);
      setTimeout(() => b.remove(), 1200);
    }
  };

  return (
    <div ref={hostRef} className="relative rounded-[12px] border border-border bg-background p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold tracking-tight">{h.habit}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{h.bullets[0]}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/[0.14] px-2.5 py-1">
          <Flame className="h-[15px] w-[15px] text-amber-500" />
          <span className="text-[14px] font-bold tabular-nums text-amber-400">{streak}</span>
          <span className="text-[10px] text-muted-foreground">{h.streak}</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {h.week.map((d, i) => (
          <button
            key={i}
            onClick={(e) => toggle(i, e)}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-[9px] border-2 transition-all",
              days[i]
                ? "lp-check-pop border-primary bg-primary text-white"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            )}
          >
            <span className="text-[10px] font-semibold">{d}</span>
            {days[i] ? (
              <Check className="h-3 w-3" strokeWidth={3} />
            ) : (
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
