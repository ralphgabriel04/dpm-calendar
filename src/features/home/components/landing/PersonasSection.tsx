"use client";

import { useTranslations } from "next-intl";
import {
  GraduationCap,
  Rocket,
  Briefcase,
  Users,
  Check,
  Star,
  Compass,
} from "lucide-react";
import { SectionHead, Reveal } from "./_shared";

function PersonaCard({
  Icon,
  title,
  description,
  features,
  delay,
}: {
  Icon: typeof GraduationCap;
  title: string;
  description: string;
  features: string[];
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="lp-card-hover group h-full rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        <ul className="space-y-2 text-sm">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

export function PersonasSection() {
  const t = useTranslations("landing");
  const tr = useTranslations("landing.reviews");

  const personas = [
    {
      Icon: GraduationCap,
      title: t("personas.students.title"),
      description: t("personas.students.description"),
      features: [
        t("personas.students.feature1"),
        t("personas.students.feature2"),
        t("personas.students.feature3"),
      ],
    },
    {
      Icon: Rocket,
      title: t("personas.entrepreneurs.title"),
      description: t("personas.entrepreneurs.description"),
      features: [
        t("personas.entrepreneurs.feature1"),
        t("personas.entrepreneurs.feature2"),
        t("personas.entrepreneurs.feature3"),
      ],
    },
    {
      Icon: Briefcase,
      title: t("personas.freelancers.title"),
      description: t("personas.freelancers.description"),
      features: [
        t("personas.freelancers.feature1"),
        t("personas.freelancers.feature2"),
        t("personas.freelancers.feature3"),
      ],
    },
    {
      Icon: Users,
      title: t("personas.teams.title"),
      description: t("personas.teams.description"),
      features: [
        t("personas.teams.feature1"),
        t("personas.teams.feature2"),
        t("personas.teams.feature3"),
      ],
    },
  ];

  const reviews = [
    { Icon: Briefcase, name: tr("review1Name"), role: tr("review1Role"), text: tr("review1Text"), stars: 5 },
    { Icon: GraduationCap, name: tr("review2Name"), role: tr("review2Role"), text: tr("review2Text"), stars: 5 },
    { Icon: Compass, name: tr("review3Name"), role: tr("review3Role"), text: tr("review3Text"), stars: 5 },
    { Icon: Users, name: tr("review4Name"), role: tr("review4Role"), text: tr("review4Text"), stars: 4 },
  ];

  return (
    <>
      {/* 03 — Who it's for */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHead
          n="03"
          label={t("personas.title1")}
          title={t("personas.title2")}
          sub={t("personas.subtitle")}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {personas.map((p, i) => (
            <PersonaCard key={p.title} {...p} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* 04 — Reviews */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHead n="04" label={tr("label")} title={tr("title")} sub={tr("subtitle")} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 80} className="h-full">
              <div className="lp-card-hover flex h-full flex-col rounded-[16px] border border-border bg-card p-6">
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star
                      key={s}
                      className={`h-[15px] w-[15px] ${
                        s < r.stars ? "fill-current text-amber-400" : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-foreground/90">
                  “{r.text}”
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <r.Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-[13.5px] font-semibold">{r.name}</div>
                    <div className="text-[12px] text-muted-foreground">{r.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
