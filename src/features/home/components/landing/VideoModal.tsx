"use client";

import { useEffect, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { modulesCopy } from "./copy";

const d = modulesCopy.demo;

/** VideoModal — the hero's "play with the demo" overlay (placeholder player).
    Ported from landing-sections.jsx. */
export function VideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!open) {
      setPlaying(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={d.title}>
      <div className="lp-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="lp-pop relative w-full max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold text-white">{d.title}</div>
            <div className="text-[12.5px] text-white/60">{d.sub}</div>
          </div>
          <button
            onClick={onClose}
            aria-label={d.close}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-[16px] border border-white/15 bg-[#0b0b14]">
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 100% at 50% 0%, #2d1b69 0%, #12121c 70%)" }} />
          <div className="lp-glow" style={{ width: 320, height: 320, top: -120, left: "50%", marginLeft: -160, background: "hsl(263 70% 55%)", opacity: 0.5 }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <button
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause" : "Play"}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#1e1b4b] shadow-2xl transition-transform hover:scale-105"
            >
              {playing ? <Pause className="h-[26px] w-[26px]" /> : <Play className="ml-1 h-[26px] w-[26px]" />}
            </button>
            <div className="font-mono text-[12px] text-white/70">{d.caption}</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
            <Play className="h-3.5 w-3.5 text-white/80" />
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div className={cn("h-full rounded-full bg-white", playing && "lp-video-progress")} style={{ width: playing ? undefined : "8%" }} />
            </div>
            <span className="font-mono text-[11px] text-white/70">{d.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
