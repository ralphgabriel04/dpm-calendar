"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/* ============================================================
   LANDING — shared editorial building blocks
   Ported from the DPM Elevate design prototype (landing-fx.jsx /
   landing-sections.jsx). Reveal-on-scroll, numbered section heads,
   browser chrome and demo shell. Purely visual.
============================================================ */

/** Reveal — fades + lifts children in when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  scale = false,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  scale?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.12) {
            e.target.classList.add("is-visible");
          }
        });
      },
      { threshold: [0, 0.12], rootMargin: "0px 0px -6% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ ["--lp-delay" as string]: `${delay}ms` }}
      className={cn("lp-reveal", scale && "lp-reveal-scale", className)}
    >
      {children}
    </div>
  );
}

/** Eyebrow — mono small-caps section label, optional index + rule. */
export function Eyebrow({
  n,
  children,
  className = "",
}: {
  n?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.16em]",
        className
      )}
    >
      {n && <span className="tabular-nums text-primary">{n}</span>}
      {n && <span className="h-px w-7 bg-primary/50" />}
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

/** SectionHead — centered eyebrow + serif display title + optional sub. */
export function SectionHead({
  label,
  title,
  sub,
  n,
  className = "",
}: {
  label: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  n?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <Reveal className="flex justify-center">
        <Eyebrow n={n}>{label}</Eyebrow>
      </Reveal>
      <Reveal delay={70}>
        <h2
          className="mt-5 font-serif text-[clamp(30px,4.4vw,46px)] font-normal leading-[1.08] tracking-tight"
          style={{ textWrap: "balance" }}
        >
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal delay={130}>
          <p
            className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground"
            style={{ textWrap: "pretty" }}
          >
            {sub}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/** BrowserChrome — macOS-style window frame for product mockups. */
export function BrowserChrome({
  url,
  children,
  className = "",
}: {
  url?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border border-border bg-card shadow-2xl",
        className
      )}
    >
      <div className="flex h-9 items-center gap-1.5 border-b border-border bg-muted/40 px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
        {url && (
          <span className="ml-3 truncate font-mono text-[11px] text-muted-foreground">
            {url}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** DemoShell — the tinted "stage" panel with dotgrid + optional live hint. */
export function DemoShell({
  hint,
  children,
  className = "",
}: {
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "lp-ring lp-stage relative overflow-hidden rounded-[18px] p-4 sm:p-5",
        className
      )}
    >
      <div className="lp-dotgrid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative">{children}</div>
      {hint && (
        <div className="relative mt-3.5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="lp-pulse h-1.5 w-1.5 rounded-full bg-primary" />
          {hint}
        </div>
      )}
    </div>
  );
}

/** LpGroup — a cluster label with a hairline rule (separates feature groups). */
export function LpGroup({ label }: { label: ReactNode }) {
  return (
    <Reveal className="flex items-center gap-4 pt-6">
      <Eyebrow>{label}</Eyebrow>
      <span className="h-px flex-1 bg-border" />
    </Reveal>
  );
}

/** FeatureRow — numbered editorial feature row: copy + bullets on one side, a
    live demo on the other, alternating sides per `reverse`. */
export function FeatureRow({
  n,
  tag,
  title,
  desc,
  bullets = [],
  reverse = false,
  children,
}: {
  n: string;
  tag: ReactNode;
  title: ReactNode;
  desc: ReactNode;
  bullets?: readonly ReactNode[];
  reverse?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid items-center gap-9 lg:grid-cols-2 lg:gap-14" data-trail-row data-trail-reverse={reverse ? "1" : "0"}>
      <Reveal className={cn("min-w-0", reverse && "lg:order-2")}>
        <Eyebrow n={n}>{tag}</Eyebrow>
        <h3
          data-trail-title
          className="mt-5 text-[clamp(24px,3vw,34px)] font-bold leading-[1.12] tracking-tight"
          style={{ textWrap: "balance" }}
        >
          {title}
        </h3>
        <p
          className="mt-4 text-[15px] leading-relaxed text-muted-foreground"
          style={{ textWrap: "pretty" }}
        >
          {desc}
        </p>
        {bullets.length > 0 && (
          <ul className="mt-6 space-y-2.5">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px]">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/[0.14]">
                  <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                </span>
                <span className="text-foreground/90">{b}</span>
              </li>
            ))}
          </ul>
        )}
      </Reveal>
      <Reveal scale delay={120} className={cn("min-w-0", reverse && "lg:order-1")}>
        {children}
      </Reveal>
    </div>
  );
}
