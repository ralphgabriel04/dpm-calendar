"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

// Lazy load the heavy HeroMockup component
const HeroMockup = dynamic(
  () => import("./mockups/HeroMockup").then((mod) => ({ default: mod.HeroMockup })),
  { ssr: false, loading: () => <HeroMockupSkeleton /> }
);

function HeroMockupSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg animate-pulse">
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="pt-36 pb-16 sm:pt-40 md:pt-44 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            {/* Early Access Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 mb-6 border border-violet-500/20">
              <Sparkles className="h-4 w-4" />
              {t("hero.earlyAccess")}
            </div>
            <h1 className="font-serif text-5xl font-normal tracking-tight sm:text-6xl lg:text-7xl">
              {t("hero.title1")}{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                {t("hero.title2")}
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="group flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all"
              >
                {t("hero.cta")}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-base font-semibold hover:bg-accent transition-all"
              >
                {t("hero.seeFeatures")}
              </Link>
            </div>
          </div>
          {/* Right: Mockup */}
          <div className="hidden lg:block">
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
