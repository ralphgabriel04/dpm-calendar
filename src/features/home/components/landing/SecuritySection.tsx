"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Shield, Lock, Cloud, ChevronDown } from "lucide-react";
import { SectionHead, Reveal, Eyebrow } from "./_shared";
import { cn } from "@/shared/lib/utils";

function FaqItem({
  q,
  a,
  open,
  onToggle,
  id,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="group flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span
          className="text-[15.5px] font-medium transition-colors group-hover:text-primary"
          style={{ textWrap: "balance" }}
        >
          {q}
        </span>
        <span
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border transition-all",
            open ? "rotate-180 border-transparent bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      <div
        id={id}
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p
            className="pb-5 pr-12 text-[14px] leading-relaxed text-muted-foreground"
            style={{ textWrap: "pretty" }}
          >
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SecuritySection() {
  const t = useTranslations("landing");
  const tf = useTranslations("landing.faq");
  const [open, setOpen] = useState(0);

  const pillars = [
    { Icon: Lock, title: t("security.encryption.title"), desc: t("security.encryption.description") },
    { Icon: Cloud, title: t("security.hosting.title"), desc: t("security.hosting.description") },
    { Icon: Shield, title: t("security.auth.title"), desc: t("security.auth.description") },
  ];

  const faqs = [
    { q: tf("q1"), a: tf("a1") },
    { q: tf("q2"), a: tf("a2") },
    { q: tf("q3"), a: tf("a3") },
    { q: tf("q4"), a: tf("a4") },
    { q: tf("q5"), a: tf("a5") },
  ];

  return (
    <>
      {/* Security band */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal scale>
          <div className="lp-ring relative overflow-hidden rounded-[24px] border border-border bg-card p-8 sm:p-12">
            <div
              className="lp-glow"
              style={{ width: 340, height: 340, top: -160, left: -40, background: "hsl(142 60% 45%)", opacity: 0.25 }}
            />
            <div className="relative grid items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-emerald-500/[0.14]">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </span>
                <Eyebrow>{t("security.badge")}</Eyebrow>
                <h2 className="mt-4 font-serif text-[clamp(26px,3.2vw,36px)] font-normal tracking-tight">
                  {t("security.title1")} {t("security.title2")}
                </h2>
                <p className="mb-6 mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {t("security.subtitle")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[t("security.rgpd"), t("security.compliant"), t("security.secure")].map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[12px] font-medium"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                {pillars.map((p, i) => (
                  <Reveal key={i} delay={i * 80}>
                    <div className="flex items-start gap-4 rounded-[12px] border border-border bg-background p-4">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                        <p.Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-[14px] font-semibold">{p.title}</div>
                        <div className="mt-1 text-[12.5px] text-muted-foreground">{p.desc}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ (06) */}
      <section id="faq" className="relative mx-auto max-w-[820px] scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHead n="06" label={tf("label")} title={tf("title")} sub={tf("subtitle")} />
        <Reveal delay={80} className="mt-10">
          <div className="rounded-[18px] border border-border bg-card px-6 sm:px-8">
            {faqs.map((it, i) => (
              <FaqItem
                key={i}
                id={`faq-${i}`}
                q={it.q}
                a={it.a}
                open={open === i}
                onToggle={() => setOpen(open === i ? -1 : i)}
              />
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
