"use client";

import { Flame } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useInViewOnce, useCountUp } from "../lpHooks";
import { modulesCopy } from "../copy";

const g = modulesCopy.goalsPro;
type Goal = (typeof g.items)[number];

function GoalRow({ goal, gi, seen }: { goal: Goal; gi: number; seen: boolean }) {
  const cur = useCountUp(goal.cur, seen, 1000 + gi * 140);
  const pct = Math.min(100, (cur / goal.max) * 100);
  return (
    <div className="rounded-[10px] border border-border bg-card/50 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold leading-tight">{goal.t}</div>
          <div className="text-[9.5px] text-muted-foreground">{goal.cat}</div>
        </div>
        <div className="ml-2 flex-shrink-0 text-right">
          <span className="text-[15px] font-bold tabular-nums" style={{ color: `hsl(${goal.c})` }}>
            {Math.round(cur)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            /{goal.max} {goal.unit}
          </span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `hsl(${goal.c})` }} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {g.smart.map((sm, si) => (
            <span
              key={si}
              title={g.smartFull[si]}
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-[4px] text-[8px] font-bold transition-all",
                goal.smart[si] ? "text-white" : "bg-muted text-muted-foreground",
                seen && "lp-check-pop"
              )}
              style={{
                ...(goal.smart[si] ? { background: `hsl(${goal.c})` } : {}),
                animationDelay: `${gi * 140 + si * 60}ms`,
              }}
            >
              {sm}
            </span>
          ))}
        </div>
        {goal.linked && (
          <span className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
            <Flame className="h-[9px] w-[9px]" /> {goal.linked}
          </span>
        )}
      </div>
    </div>
  );
}

/** GoalsProDemo — SMART-scored goals with count-up progress, ported from
    landing-demos5.jsx. */
export function GoalsProDemo() {
  const [ref, seen] = useInViewOnce(0.3);
  return (
    <div ref={ref} className="flex flex-col gap-2.5 rounded-[12px] border border-border bg-background p-3.5">
      {g.items.map((goal, gi) => (
        <GoalRow key={gi} goal={goal} gi={gi} seen={seen} />
      ))}
    </div>
  );
}
