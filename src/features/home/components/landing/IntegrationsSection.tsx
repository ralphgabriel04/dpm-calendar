"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";
import { SectionHead, Reveal } from "./_shared";
import { cn } from "@/shared/lib/utils";

/**
 * Pricing section (05) — ported from the design prototype's PricingSection.
 * Replaces the old "Integrations" strip (the hero marquee already covers
 * sync logos). Kept under the same export so page.tsx wiring is unchanged.
 */
export function IntegrationsSection() {
  const t = useTranslations("landing.pricing");
  const [yearly, setYearly] = useState(true);

  const plans = [
    {
      id: "free",
      name: t("free"),
      tagline: t("freeTagline"),
      priceM: 0,
      priceY: 0,
      cta: t("ctaFree"),
      features: [t("freeF1"), t("freeF2"), t("freeF3")],
      popular: false,
    },
    {
      id: "pro",
      name: t("pro"),
      tagline: t("proTagline"),
      priceM: 9,
      priceY: 7,
      cta: t("ctaPro"),
      features: [t("proF1"), t("proF2"), t("proF3"), t("proF4")],
      popular: true,
    },
    {
      id: "team",
      name: t("team"),
      tagline: t("teamTagline"),
      priceM: 15,
      priceY: 12,
      cta: t("ctaTeam"),
      features: [t("teamF1"), t("teamF2"), t("teamF3"), t("teamF4")],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
      <SectionHead n="05" label={t("label")} title={t("title")} sub={t("subtitle")} />

      {/* billing toggle */}
      <Reveal delay={80} className="mt-9 flex items-center justify-center gap-3">
        <span
          className={cn(
            "text-[13.5px] font-medium transition-colors",
            !yearly ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {t("monthly")}
        </span>
        <button
          type="button"
          onClick={() => setYearly((y) => !y)}
          role="switch"
          aria-checked={yearly}
          aria-label={t("yearly")}
          className={cn(
            "relative h-[26px] w-12 rounded-full p-0.5 transition-colors",
            yearly ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "block h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform",
              yearly ? "translate-x-[24px]" : "translate-x-0"
            )}
          />
        </button>
        <span
          className={cn(
            "text-[13.5px] font-medium transition-colors",
            yearly ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {t("yearly")}
        </span>
        <span className="ml-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
          {t("save")}
        </span>
      </Reveal>

      <div className="mt-10 grid items-stretch gap-5 md:grid-cols-3">
        {plans.map((plan, i) => {
          const price = yearly ? plan.priceY : plan.priceM;
          return (
            <Reveal key={plan.id} delay={i * 90} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-[18px] border bg-card p-7 transition-all",
                  plan.popular
                    ? "lp-ring border-primary/60 shadow-xl"
                    : "lp-card-hover border-border"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg">
                      {t("popular")}
                    </span>
                  </div>
                )}
                <div className="text-[15px] font-semibold">{plan.name}</div>
                <div className="mt-0.5 text-[12.5px] text-muted-foreground">{plan.tagline}</div>
                <div className="mt-5 flex items-end gap-1.5">
                  <span className="text-[40px] font-bold leading-none tracking-tight tabular-nums">
                    ${price}
                  </span>
                  <span className="mb-1.5 text-[13px] text-muted-foreground">
                    {price === 0 ? t("forever") : t("perMonth")}
                  </span>
                </div>
                <div className="mt-1 h-4 text-[11.5px] text-muted-foreground">
                  {price > 0 && yearly ? t("billedYearly") : ""}
                </div>
                <Link
                  href="/login"
                  className={cn(
                    "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                    plan.popular
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                      : "border border-border bg-card hover:bg-accent"
                  )}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="mt-0.5 h-[15px] w-[15px] flex-shrink-0 text-primary" strokeWidth={2.5} />
                      <span className="text-foreground/90">{f}</span>
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
