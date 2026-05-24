"use client";

import { useTranslations } from "next-intl";
import { Shield, Lock, Cloud } from "lucide-react";

export function SecuritySection() {
  const t = useTranslations("landing");

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 mb-6">
              <Shield className="h-4 w-4" />
              {t("security.badge")}
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl mb-6">
              {t("security.title1")}{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                {t("security.title2")}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("security.subtitle")}
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500 flex-shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t("security.encryption.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("security.encryption.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500 flex-shrink-0">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t("security.hosting.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("security.hosting.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500 flex-shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t("security.auth.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("security.auth.description")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Technical claims */}
          <div className="lg:pl-8">
            <div className="rounded-2xl border border-border bg-card p-8">
              <h3 className="font-semibold text-lg mb-6 text-center">{t("security.certifications")}</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm block">TLS 1.3</span>
                    <span className="text-xs text-muted-foreground">Vercel Edge Network</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm block">OAuth 2.0</span>
                    <span className="text-xs text-muted-foreground">Google / Microsoft</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
