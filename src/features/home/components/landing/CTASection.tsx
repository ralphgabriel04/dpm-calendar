"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "./_shared";

export function CTASection() {
  const t = useTranslations("landing");

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal scale>
        <div className="lp-stage relative overflow-hidden rounded-[28px] border border-border px-6 py-16 text-center sm:py-20">
          <div
            className="lp-glow"
            style={{ width: 500, height: 500, top: -200, left: "50%", marginLeft: -250, background: "hsl(263 70% 55%)" }}
          />
          <div className="relative">
            <h2
              className="font-serif text-[clamp(32px,5vw,52px)] font-normal leading-[1.05] tracking-tight"
              style={{ textWrap: "balance" }}
            >
              {t("cta.title1")} {t("cta.title2")}?
            </h2>
            <p className="mt-4 text-[15.5px] text-muted-foreground">{t("cta.subtitle")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
              >
                {t("cta.button")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-base font-semibold transition-all hover:bg-accent"
              >
                {t("finalCta.secondary")}
              </Link>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              {t("finalCta.reassure")}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
