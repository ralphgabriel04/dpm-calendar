"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Reveal, SectionHead } from "./_shared";
import { modulesCopy as t } from "./copy";

const p = t.pricing;

/* Pricing (section 06) — monthly/yearly toggle, three plans, popular ring. */
export function PricingSection() {
  const [yearly, setYearly] = useState(true);
  const ctaFor = (id: string) => (id === "free" ? p.cta : id === "pro" ? p.ctaPro : p.ctaTeam);

  return (
    <section id="pricing" className="relative mx-auto max-w-[1180px] scroll-mt-24 px-6 py-16">
      <SectionHead n="06" label={p.label} title={p.title} sub={p.sub} />

      {/* billing toggle */}
      <Reveal delay={80} className="mt-9 flex items-center justify-center gap-3">
        <span className={cn("text-[13.5px] font-medium transition-colors", !yearly ? "text-foreground" : "text-muted-foreground")}>
          {p.monthly}
        </span>
        <button
          onClick={() => setYearly((y) => !y)}
          role="switch"
          aria-checked={yearly}
          aria-label={p.yearly}
          className={cn("relative h-[26px] w-12 rounded-full p-0.5 transition-colors", yearly ? "bg-primary" : "bg-muted")}
        >
          <span className={cn("block h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform", yearly ? "translate-x-[24px]" : "translate-x-0")} />
        </button>
        <span className={cn("text-[13.5px] font-medium transition-colors", yearly ? "text-foreground" : "text-muted-foreground")}>
          {p.yearly}
        </span>
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/[0.16] px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
          {p.save}
        </span>
      </Reveal>

      <div className="mt-10 grid items-stretch gap-5 md:grid-cols-3">
        {p.plans.map((plan, i) => {
          const popular = plan.id === "pro";
          const price = yearly ? plan.priceY : plan.priceM;
          return (
            <Reveal key={plan.id} delay={i * 90} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-[18px] border p-7 transition-all",
                  popular ? "lp-ring border-primary/60 bg-card shadow-xl" : "lp-card-hover border-border bg-card"
                )}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
                      {p.popular}
                    </span>
                  </div>
                )}
                <div className="text-[15px] font-semibold">{plan.name}</div>
                <div className="mt-0.5 text-[12.5px] text-muted-foreground">{plan.tagline}</div>
                <div className="mt-5 flex items-end gap-1.5">
                  <span className="text-[40px] font-bold leading-none tracking-tight tabular-nums">CA${price}</span>
                  <span className="mb-1.5 text-[13px] text-muted-foreground">{price === 0 ? p.forever : p.perMonth}</span>
                </div>
                <div className="mt-1 h-4 text-[11.5px] text-muted-foreground">
                  {price > 0 ? (yearly ? `${p.billedYearly}${plan.id === "team" ? ` · ${p.perSeat}` : ""}` : plan.id === "team" ? p.perSeat : "") : ""}
                </div>
                <Link
                  href="/login"
                  className={cn(
                    "mt-5 flex h-10 w-full items-center justify-center gap-1.5 rounded-[8px] text-[13px] font-medium transition-colors",
                    popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:bg-accent"
                  )}
                >
                  {ctaFor(plan.id)} <ArrowRight className="h-4 w-4" />
                </Link>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="mt-0.5 h-[15px] w-[15px] flex-shrink-0 text-primary" strokeWidth={2.5} />
                      <span className="text-foreground/90">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
