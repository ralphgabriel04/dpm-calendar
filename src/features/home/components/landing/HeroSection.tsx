"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, Flame, Sparkles, Star, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { Reveal, BrowserChrome } from "./_shared";

// Lazy load the heavy HeroMockup component
const HeroMockup = dynamic(
  () => import("./mockups/HeroMockup").then((mod) => ({ default: mod.HeroMockup })),
  { ssr: false, loading: () => <HeroMockupSkeleton /> }
);

function HeroMockupSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-6 shadow-lg">
      <div className="space-y-4">
        <div className="h-8 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

const BRANDS = ["Google Calendar", "Outlook", "Apple Calendar", "Todoist", "Slack", "Notion", "Zoom"];

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <header className="relative overflow-hidden pt-28 sm:pt-32">
      {/* ambient mesh */}
      <div
        className="lp-glow"
        style={{ width: 620, height: 620, top: -240, left: -120, background: "hsl(263 70% 55%)" }}
      />
      <div
        className="lp-glow"
        style={{ width: 520, height: 520, top: 40, right: -160, background: "hsl(330 75% 55%)", animationDelay: "-7s" }}
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-12 text-center sm:px-6 sm:pt-8 lg:px-8">
        <Reveal className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("hero.badge")}
          </span>
        </Reveal>

        <Reveal delay={60}>
          <h1
            className="mt-6 text-[clamp(40px,7vw,80px)] font-bold leading-[1.03] tracking-[-0.02em]"
            style={{ textWrap: "balance" }}
          >
            {t("hero.title1")}
            <br />
            <span className="lp-gradient-text font-serif font-normal italic">
              {t("hero.title2")}
            </span>
          </h1>
        </Reveal>

        <Reveal delay={120}>
          <p
            className="mx-auto mt-6 max-w-2xl text-[16.5px] leading-relaxed text-muted-foreground sm:text-[18px]"
            style={{ textWrap: "pretty" }}
          >
            {t("hero.subtitle")}
          </p>
        </Reveal>

        <Reveal delay={180} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
          >
            {t("hero.cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-base font-semibold transition-all hover:bg-accent"
          >
            {t("hero.ctaSecondary")}
          </Link>
        </Reveal>

        <Reveal delay={220}>
          <p className="mt-4 text-[12px] text-muted-foreground">{t("hero.trust")}</p>
        </Reveal>

        {/* social proof */}
        <Reveal delay={260} className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} className="h-[15px] w-[15px] fill-current text-amber-400" />
              ))}
            </div>
            <span className="text-[13px] font-semibold">4.9 / 5</span>
          </div>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Users className="h-[15px] w-[15px] text-primary" />
            <span className="font-semibold text-foreground">12,000+ planners</span>
          </div>
        </Reveal>

        {/* product stage */}
        <Reveal scale delay={140} className="relative mx-auto mt-14 max-w-[920px]">
          <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-primary/[0.18] blur-3xl" />
          <div className="relative">
            <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] text-muted-foreground shadow-lg">
                <span className="lp-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("hero.live")}
              </span>
            </div>

            <BrowserChrome url="app.dpmcalendar.com / calendar" className="text-left">
              <div className="lp-stage p-4 sm:p-5">
                <HeroMockup />
              </div>
            </BrowserChrome>

            {/* floating chips */}
            <div className="lp-float absolute -left-10 top-1/3 hidden md:block">
              <div className="lp-ring w-[140px] rounded-[14px] border border-border bg-card p-3 text-left shadow-xl">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-500">
                  <Flame className="h-3 w-3" /> 12 day streak
                </div>
                <div className="mt-2 flex gap-1">
                  {[1, 1, 1, 1, 1, 0, 0].map((v, i) => (
                    <span
                      key={i}
                      className={`h-5 flex-1 rounded-[3px] ${v ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="lp-float-slow absolute -right-12 top-12 hidden md:block">
              <div className="lp-ring w-[180px] rounded-[14px] border border-border bg-card p-3 text-left shadow-xl">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
                  <Sparkles className="h-3 w-3" /> DPM AI
                </div>
                <div className="mt-1.5 text-[11px] leading-snug text-foreground/90">
                  Move “Review PR” to 09:30 — your morning energy peak.
                </div>
              </div>
            </div>
            <div className="lp-float absolute -bottom-6 -right-8 hidden md:block">
              <div className="lp-ring flex items-center gap-2.5 rounded-[14px] border border-border bg-card px-3.5 py-2.5 shadow-xl">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                </span>
                <div className="text-left">
                  <div className="text-[12px] font-bold tabular-nums">3/5</div>
                  <div className="text-[9.5px] text-muted-foreground">done today</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* integrations marquee */}
        <div className="mt-16">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("hero.integrates")}
            </p>
          </Reveal>
          <div
            className="relative mt-5 overflow-hidden"
            style={{
              maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
            }}
          >
            <div className="lp-marquee">
              {[...BRANDS, ...BRANDS].map((b, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap px-7 text-[15px] font-semibold tracking-tight text-muted-foreground transition-colors hover:text-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
