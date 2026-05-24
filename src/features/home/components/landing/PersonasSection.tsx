"use client";

import { useTranslations } from "next-intl";
import { GraduationCap, Rocket, Briefcase, Users, Check } from "lucide-react";

export function PersonasSection() {
  const t = useTranslations("landing");

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            {t("personas.title1")}{" "}
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              {t("personas.title2")}
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("personas.subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Etudiants */}
          <div className="group rounded-2xl border border-border bg-card p-6 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 text-violet-500 mb-5 group-hover:scale-110 transition-transform">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("personas.students.title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("personas.students.description")}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.students.feature1")}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.students.feature2")}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.students.feature3")}
              </li>
            </ul>
          </div>

          {/* Entrepreneurs */}
          <div className="group rounded-2xl border border-border bg-card p-6 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 text-emerald-500 mb-5 group-hover:scale-110 transition-transform">
              <Rocket className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("personas.entrepreneurs.title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("personas.entrepreneurs.description")}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.entrepreneurs.feature1")}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.entrepreneurs.feature2")}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.entrepreneurs.feature3")}
              </li>
            </ul>
          </div>

          {/* Freelances */}
          <div className="group rounded-2xl border border-border bg-card p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-500 mb-5 group-hover:scale-110 transition-transform">
              <Briefcase className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("personas.freelancers.title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("personas.freelancers.description")}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.freelancers.feature1")}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.freelancers.feature2")}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.freelancers.feature3")}
              </li>
            </ul>
          </div>

          {/* Equipes */}
          <div className="group rounded-2xl border border-border bg-card p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 text-orange-500 mb-5 group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("personas.teams.title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("personas.teams.description")}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.teams.feature1")}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.teams.feature2")}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {t("personas.teams.feature3")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
