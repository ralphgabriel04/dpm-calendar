"use client";

import { useTranslations } from "next-intl";
import { MousePointerClick, Sparkles, Zap } from "lucide-react";

export function HowItWorksSection() {
  const t = useTranslations("landing");

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            {t("howItWorks.title1")}{" "}
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              {t("howItWorks.title2")}
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* Step 1 */}
          <div className="relative group">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative rounded-2xl border border-border bg-card p-8 h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                  <MousePointerClick className="h-6 w-6" />
                </div>
                <span className="text-4xl font-bold text-violet-500/20">01</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t("howItWorks.step1.title")}</h3>
              <p className="text-muted-foreground">
                {t("howItWorks.step1.description")}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative group">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative rounded-2xl border border-border bg-card p-8 h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Sparkles className="h-6 w-6" />
                </div>
                <span className="text-4xl font-bold text-emerald-500/20">02</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t("howItWorks.step2.title")}</h3>
              <p className="text-muted-foreground">
                {t("howItWorks.step2.description")}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative group">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative rounded-2xl border border-border bg-card p-8 h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
                  <Zap className="h-6 w-6" />
                </div>
                <span className="text-4xl font-bold text-pink-500/20">03</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t("howItWorks.step3.title")}</h3>
              <p className="text-muted-foreground">
                {t("howItWorks.step3.description")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
