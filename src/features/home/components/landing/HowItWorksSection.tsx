"use client";

import { Sunrise, Zap, BarChart3 } from "lucide-react";
import { Reveal, Eyebrow, SectionHead } from "./_shared";
import { useCountUp, useInViewOnce } from "./lpHooks";
import { modulesCopy } from "./copy";

function StatItem({ v, suffix, tt, d, seen, i }: { v: number; suffix: string; tt: string; d: string; seen: boolean; i: number }) {
  const n = useCountUp(v, seen, 1300 + i * 150);
  return (
    <Reveal delay={i * 90} className="text-center sm:text-left">
      <div className="text-[clamp(38px,5vw,56px)] font-bold leading-none tracking-tight">
        {Math.round(n)}
        <span className="text-primary">{suffix}</span>
      </div>
      <div className="mt-2 text-[14px] font-semibold">{tt}</div>
      <div className="mt-1 text-[13px] leading-snug text-muted-foreground">{d}</div>
    </Reveal>
  );
}

function StatBand() {
  const s = modulesCopy.stats;
  const [ref, seen] = useInViewOnce(0.4);
  return (
    <section className="relative mx-auto max-w-[1180px] px-6 pt-16">
      <div className="rounded-[20px] border border-border bg-card px-7 py-10 sm:px-12">
        <Reveal>
          <Eyebrow className="mb-8 justify-center">{s.label}</Eyebrow>
        </Reveal>
        <div ref={ref} className="grid gap-8 sm:grid-cols-3 sm:gap-10">
          {s.items.map((it, i) => (
            <StatItem key={i} v={it.v} suffix={it.suffix} tt={it.t} d={it.d} seen={seen} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

const STEP_ICONS = [Sunrise, Zap, BarChart3];

export function HowItWorksSection() {
  const how = modulesCopy.how;

  return (
    <>
      <StatBand />

      <section id="how" className="relative mx-auto max-w-[1180px] scroll-mt-24 px-6 py-16">
        <SectionHead n="01" label={how.label} title={how.title} />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {how.steps.map((step, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <Reveal key={step.n} delay={i * 110}>
                <div className="lp-ring lp-card-hover relative h-full overflow-hidden rounded-[16px] border border-border bg-card p-7">
                  <div className="pointer-events-none absolute right-5 top-3 select-none font-serif text-[68px] italic leading-none text-primary/[0.18]">
                    {step.n}
                  </div>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary/[0.12]">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 text-[19px] font-semibold tracking-tight">{step.t}</h3>
                  <p className="text-[13.5px] leading-relaxed text-muted-foreground">{step.d}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
