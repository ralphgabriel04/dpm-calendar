"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================
   LANDING — animation hooks, ported verbatim from the DPM Elevate
   design prototype (landing-fx.jsx). Drive count-ups and chart bars
   that reset on exit and replay on re-entry.
============================================================ */

/** useCountUp — eases 0 → target while `active`, resets to 0 when it leaves view. */
export function useCountUp(target: number, active: boolean, dur = 1300): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) {
      setVal(0);
      return;
    }
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf = 0;
    let start: number | undefined;
    const tick = (ts: number) => {
      if (start === undefined) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, dur]);
  return val;
}

/** useInView — true WHILE the element is in view, false once it fully leaves
    (re-arming, not one-shot, so animations replay on re-entry). */
export function useInView(threshold = 0.3): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      if (!r.height) return;
      const visiblePx = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      const ratio = visiblePx / Math.min(r.height, vh);
      if (ratio >= threshold) setInView(true);
      else if (r.bottom <= 0 || r.top >= vh) setInView(false);
    };
    let obs: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      obs = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (e.isIntersecting && e.intersectionRatio >= threshold) setInView(true);
          else if (e.intersectionRatio <= 0.001) setInView(false);
        },
        { threshold: [0, threshold] }
      );
      obs.observe(el);
    }
    measure();
    const t1 = setTimeout(measure, 300);
    const t2 = setTimeout(measure, 1200);
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      obs?.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", measure, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", measure);
    };
  }, [threshold]);
  return [ref, inView];
}

/** Alias kept for parity with the prototype's naming. */
export const useInViewOnce = useInView;
