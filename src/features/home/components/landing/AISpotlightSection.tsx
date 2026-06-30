"use client";

import { Reveal, Eyebrow } from "./_shared";
import { AISuggestionDemo } from "./demos/AISuggestionDemo";
import { modulesCopy as t } from "./copy";

/* AI — feature spotlight band (section 03). */
export function AISpotlightSection() {
  return (
    <section className="relative mx-auto max-w-[1180px] px-6 py-24">
      <div className="lp-ring lp-stage relative overflow-hidden rounded-[24px] border border-border">
        <div
          className="lp-glow"
          style={{ width: 360, height: 360, top: -140, right: 40, background: "hsl(263 70% 58%)" }}
        />
        <div className="relative grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow n="03">{t.ai.tag}</Eyebrow>
            <h2 className="mt-5 text-[clamp(26px,3.4vw,38px)] font-bold leading-[1.1] tracking-tight" style={{ textWrap: "balance" }}>
              {t.ai.title}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{t.ai.desc}</p>
          </Reveal>
          <Reveal scale delay={120}>
            <AISuggestionDemo />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
