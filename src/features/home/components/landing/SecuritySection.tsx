"use client";

import { Shield } from "lucide-react";
import { Reveal, Eyebrow } from "./_shared";
import { cn } from "@/shared/lib/utils";
import { modulesCopy as t } from "./copy";

const s = t.security;
const DOT = ["bg-emerald-500", "bg-sky-500", "bg-primary"];

/* Security band — eyebrow + title + desc + badges on the left, a 2×2 grid of
   guarantee cards on the right, with a green ambient glow. Ported from the
   prototype (landing.jsx). FAQ lives in its own FaqSection. */
export function SecuritySection() {
  return (
    <section className="relative mx-auto max-w-[1180px] px-6 py-16">
      <Reveal scale>
        <div className="lp-ring relative overflow-hidden rounded-[24px] border border-border bg-card p-8 sm:p-12">
          <div className="lp-glow" style={{ width: 340, height: 340, top: -160, left: -40, background: "hsl(142 60% 45%)", opacity: 0.3 }} />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-emerald-500/[0.14]">
                <Shield className="h-6 w-6 text-emerald-500" />
              </span>
              <Eyebrow>{s.tag}</Eyebrow>
              <h2 className="mt-4 text-[clamp(26px,3.2vw,36px)] font-bold tracking-tight">{s.title}</h2>
              <p className="mb-6 mt-4 text-[14.5px] leading-relaxed text-muted-foreground">{s.desc}</p>
              <div className="flex flex-wrap gap-2">
                {s.badges.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[12px] font-medium">
                    <span className={cn("h-1.5 w-1.5 rounded-full", DOT[i] ?? "bg-primary")} />
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {s.cards.map((card, i) => (
                <Reveal key={i} delay={i * 80} className="h-full">
                  <div className="lp-card-hover h-full rounded-[12px] border border-border bg-background p-4">
                    <div className="text-[14px] font-semibold">{card.t}</div>
                    <div className="mt-1 text-[12.5px] text-muted-foreground">{card.d}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
