"use client";

import { createElement } from "react";
import { Briefcase, Compass, GraduationCap, Sparkles, Star, Users, type LucideIcon } from "lucide-react";
import { Reveal } from "../_shared";
import { modulesCopy } from "../copy";

const r = modulesCopy.reviews;
const ICONS: Record<string, LucideIcon> = { Briefcase, GraduationCap, Compass, Users };

/** ReviewsGrid — testimonial cards with star ratings and a "tip" footer.
    Ported from landing-demos5.jsx. */
export function ReviewsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {r.items.map((rv, i) => (
        <Reveal key={i} delay={i * 80} className="h-full">
          <div className="lp-card-hover flex h-full flex-col rounded-[14px] border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="gradient-violet flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                {createElement(ICONS[rv.icon] ?? Users, { className: "h-[18px] w-[18px] text-white" })}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{rv.name}</div>
                <div className="text-[11px] text-muted-foreground">{rv.role}</div>
              </div>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star
                    key={s}
                    className={s < rv.stars ? "h-3 w-3 text-amber-500" : "h-3 w-3 text-muted"}
                    fill={s < rv.stars ? "currentColor" : "none"}
                  />
                ))}
              </div>
            </div>
            <p className="flex-1 text-[13.5px] leading-relaxed text-foreground/90" style={{ textWrap: "pretty" }}>
              {rv.text}
            </p>
            <div className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-[12px] text-muted-foreground">
              <Sparkles className="mt-0.5 h-[13px] w-[13px] flex-shrink-0 text-primary" />
              <span style={{ textWrap: "pretty" }}>{rv.tip}</span>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
