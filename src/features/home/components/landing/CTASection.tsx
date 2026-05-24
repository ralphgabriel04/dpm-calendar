"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const t = useTranslations("landing");

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          {t("cta.title1")}{" "}
          <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
            {t("cta.title2")}
          </span>
          ?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("cta.subtitle")}
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all"
          >
            {t("cta.button")}
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("cta.noCreditCard")}
        </p>
      </div>
    </section>
  );
}
