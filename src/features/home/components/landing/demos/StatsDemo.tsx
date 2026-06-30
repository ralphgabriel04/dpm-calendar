"use client";

import { useInViewOnce, useCountUp } from "../lpHooks";
import { modulesCopy } from "../copy";

const s = modulesCopy.stats2;

function StatBar({ label, v, c, seen, i }: { label: string; v: number; c: string; seen: boolean; i: number }) {
  const pct = useCountUp(v, seen, 1200 + i * 120);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11.5px]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${c})` }} />
          {label}
        </span>
        <span className="font-mono tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: `hsl(${c})` }} />
      </div>
    </div>
  );
}

/** StatsDemo — a conic-gradient donut that draws itself, count-up category
    bars, and a focus-hours sparkline. Ported from landing-demos2.jsx. */
export function StatsDemo() {
  const [ref, seen] = useInViewOnce(0.35);
  const total = s.breakdown.reduce((a, b) => a + b.v, 0);
  const grow = useCountUp(1, seen, 1100);
  const maxAngle = grow * 360;
  let acc = 0;
  const parts = s.breakdown.map((b) => {
    const start = (acc / total) * 360;
    acc += b.v;
    const end = (acc / total) * 360;
    return `hsl(${b.c}) ${Math.min(start, maxAngle)}deg ${Math.min(end, maxAngle)}deg`;
  });
  const segs = parts.join(", ") + `, hsl(var(--muted) / 0.4) ${maxAngle}deg 360deg`;
  const score = useCountUp(8.6, seen, 1400);
  const hrs = [4, 6, 3, 7, 5, 2, 6];

  return (
    <div ref={ref} className="rounded-[12px] border border-border bg-background p-4">
      <div className="grid grid-cols-2 items-center gap-4">
        <div className="relative mx-auto h-[128px] w-[128px] rounded-full" style={{ background: `conic-gradient(${segs})` }}>
          <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-background">
            <div className="text-[22px] font-bold leading-none tabular-nums">{score.toFixed(1)}</div>
            <div className="mt-1 px-2 text-center text-[9px] uppercase tracking-wide text-muted-foreground">{s.score}</div>
          </div>
        </div>
        <div className="space-y-2">
          {s.breakdown.map((b, i) => (
            <StatBar key={i} label={b.label} v={b.v} c={b.c} seen={seen} i={i} />
          ))}
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <div className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">{s.hours}</div>
        <div className="flex h-12 items-end gap-1.5">
          {hrs.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[3px] bg-primary/65 transition-all duration-700"
              style={{ height: seen ? `${(v / 7) * 100}%` : "0%", transitionDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
