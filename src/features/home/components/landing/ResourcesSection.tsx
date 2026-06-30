"use client";

import { Check } from "lucide-react";
import { Reveal, SectionHead } from "./_shared";
import { ResourcesDemo } from "./demos/ResourcesDemo";
import { modulesCopy as t } from "./copy";

/* Resources & tutorials (section 04). */
export function ResourcesSection() {
  return (
    <section className="relative mx-auto max-w-[1180px] px-6 py-16">
      <SectionHead n="04" label={t.resources.tag} title={t.resources.title} sub={t.resources.desc} />
      <Reveal scale className="mt-12">
        <ResourcesDemo />
      </Reveal>
      <Reveal delay={120}>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[13px] text-muted-foreground">
          {t.resources.bullets.map((b, i) => (
            <span key={i} className="flex items-center gap-2">
              <Check className="h-[13px] w-[13px] text-primary" /> {b}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
