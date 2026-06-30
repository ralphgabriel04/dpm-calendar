"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Reveal, SectionHead } from "./_shared";
import { modulesCopy as t } from "./copy";

const f = t.faq;

function FaqItem({ q, a, open, onToggle, id }: { q: string; a: string; open: boolean; onToggle: () => void; id: string }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button onClick={onToggle} aria-expanded={open} aria-controls={id} className="group flex w-full items-center justify-between gap-4 py-5 text-left">
        <span className="text-[15.5px] font-medium transition-colors group-hover:text-primary" style={{ textWrap: "balance" }}>
          {q}
        </span>
        <span
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border transition-all",
            open ? "rotate-180 border-transparent bg-primary text-white" : "text-muted-foreground"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }} id={id}>
        <div className="overflow-hidden">
          <p className="pb-5 pr-12 text-[14px] leading-relaxed text-muted-foreground" style={{ textWrap: "pretty" }}>
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

/* FAQ accordion (section 07). */
export function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="relative mx-auto max-w-[820px] scroll-mt-24 px-6 py-16">
      <SectionHead n="07" label={f.label} title={f.title} sub={f.sub} />
      <Reveal delay={80} className="mt-10">
        <div className="rounded-[18px] border border-border bg-card px-6 sm:px-8">
          {f.items.map((it, i) => (
            <FaqItem key={i} id={`faq-${i}`} q={it.q} a={it.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
