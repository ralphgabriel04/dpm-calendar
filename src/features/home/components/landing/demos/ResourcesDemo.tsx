"use client";

import { useState } from "react";
import { Pause, Play, PlayCircle } from "lucide-react";
import { modulesCopy } from "../copy";

const r = modulesCopy.resources;

/** ResourcesDemo — video walkthrough cards; click to play (a progress sweep
    runs). Ported from landing-demos2.jsx. */
export function ResourcesDemo() {
  const [playing, setPlaying] = useState<number | null>(null);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {r.videos.map((v, i) => (
        <div key={i} className="group overflow-hidden rounded-[12px] border border-border bg-card">
          <button onClick={() => setPlaying(playing === i ? null : i)} className="striped relative block aspect-video w-full">
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 shadow-lg backdrop-blur transition-transform group-hover:scale-110">
                {playing === i ? (
                  <Pause className="h-4 w-4 text-primary" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4 text-primary" />
                )}
              </span>
            </span>
            <span className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-foreground">{v.len}</span>
            <span className="absolute left-2 top-2 rounded bg-primary/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">{v.tag}</span>
            {playing === i && <span className="lp-sweep absolute bottom-0 left-0 h-0.5 bg-primary" style={{ width: "40%" }} />}
          </button>
          <div className="p-3">
            <div className="text-[13px] font-medium leading-snug" style={{ textWrap: "balance" }}>
              {v.t}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-primary">
              <PlayCircle className="h-[13px] w-[13px]" /> {r.watch}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
