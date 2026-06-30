"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** FeatureTrail — a scroll-drawn SVG route that threads down the Modules tour,
    hugging each feature row in its side gutter. Ported from landing-fx.jsx.
    Purely decorative (aria-hidden, pointer-events:none); honors reduced motion. */
export function FeatureTrail({ containerRef }: { containerRef: RefObject<HTMLElement> }) {
  const pathRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const lenRef = useRef(0);
  const [geom, setGeom] = useState<{ d: string; w: number; h: number }>({ d: "", w: 0, h: 0 });
  const reduced =
    typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // build the path geometry from the live feature rows
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const offsetWithin = (el: HTMLElement, anc: HTMLElement) => {
      let x = 0,
        y = 0;
      let n: HTMLElement | null = el;
      while (n && n !== anc) {
        x += n.offsetLeft;
        y += n.offsetTop;
        n = n.offsetParent as HTMLElement | null;
      }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight };
    };

    const rounded = (pts: number[][], r: number) => {
      if (pts.length < 2) return "";
      const f = (v: number) => v.toFixed(1);
      let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        const v1x = x0 - x1,
          v1y = y0 - y1,
          v2x = x2 - x1,
          v2y = y2 - y1;
        const l1 = Math.hypot(v1x, v1y) || 1,
          l2 = Math.hypot(v2x, v2y) || 1;
        const rr = Math.min(r, l1 / 2, l2 / 2);
        const ax = x1 + (v1x / l1) * rr,
          ay = y1 + (v1y / l1) * rr;
        const bx = x1 + (v2x / l2) * rr,
          by = y1 + (v2y / l2) * rr;
        d += ` L ${f(ax)} ${f(ay)} Q ${f(x1)} ${f(y1)} ${f(bx)} ${f(by)}`;
      }
      const last = pts[pts.length - 1];
      d += ` L ${f(last[0])} ${f(last[1])}`;
      return d;
    };

    const build = () => {
      const rows = Array.from(container.querySelectorAll<HTMLElement>("[data-trail-row]"));
      if (!rows.length) return;
      const W = container.clientWidth;
      const H = container.offsetHeight;
      const desktop = window.innerWidth >= 1024;
      const pts: number[][] = [];
      if (desktop) {
        const cr = container.getBoundingClientRect();
        const outL = Math.max(0, Math.min(cr.left - 8, 14));
        const outR = Math.max(0, Math.min(window.innerWidth - cr.right - 8, 14));
        const leftX = -outL;
        const rightX = W + outR;
        const boxes = rows.map((el) => {
          const b = offsetWithin(el, container);
          const rev = el.getAttribute("data-trail-reverse") === "1";
          return { top: b.y, bottom: b.y + b.h, x: rev ? rightX : leftX };
        });
        pts.push([boxes[0].x, boxes[0].top + 10]);
        for (let i = 0; i < boxes.length - 1; i++) {
          const cur = boxes[i];
          const gap = boxes[i + 1].top - cur.bottom;
          const gapY = Math.min(cur.bottom + Math.min(Math.max(gap * 0.5, 24), 46), H - 34);
          pts.push([cur.x, gapY]);
          pts.push([boxes[i + 1].x, gapY]);
        }
        const last = boxes[boxes.length - 1];
        const endY = Math.min(last.bottom + 30, H - 10);
        pts.push([last.x, endY]);
        pts.push([last.x === leftX ? last.x + 150 : last.x - 150, endY]);
      } else {
        const x = 22;
        const titles = Array.from(container.querySelectorAll<HTMLElement>("[data-trail-title]"));
        const list = titles.length ? titles : rows;
        list.forEach((el) => {
          const b = offsetWithin(el, container);
          pts.push([x, b.y + b.h / 2]);
        });
        const lp = pts[pts.length - 1];
        pts.push([x, Math.min(lp[1] + 130, H - 6)]);
      }
      setGeom({ d: rounded(pts, desktop ? 12 : 14), w: W, h: H });
    };

    build();
    let ro: ResizeObserver | undefined;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(build);
      ro.observe(container);
    }
    window.addEventListener("resize", build);
    const t1 = setTimeout(build, 450);
    const t2 = setTimeout(build, 1300);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", build);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [containerRef]);

  // length + initial dash
  useEffect(() => {
    const path = pathRef.current;
    if (!path || !geom.d) return;
    const len = path.getTotalLength();
    lenRef.current = len;
    path.style.strokeDasharray = `${len}`;
    if (reduced) {
      path.style.strokeDashoffset = "0";
      if (headRef.current) headRef.current.style.opacity = "0";
    } else if (!path.style.strokeDashoffset) {
      path.style.strokeDashoffset = `${len}`;
    }
  }, [geom.d, reduced]);

  // scroll-driven draw
  useEffect(() => {
    if (reduced || !geom.d) return;
    const container = containerRef.current;
    const path = pathRef.current;
    const head = headRef.current;
    if (!container || !path) return;

    let raf = 0;
    let active = true;
    const update = () => {
      raf = 0;
      const len = lenRef.current || path.getTotalLength();
      const r = container.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const lead = vh * 0.62;
      let p = (lead - r.top) / Math.max(1, r.height);
      p = Math.max(0, Math.min(1, p));
      path.style.strokeDashoffset = `${len * (1 - p)}`;
      if (head) {
        if (p <= 0.001 || p >= 0.999) {
          head.style.opacity = "0";
        } else {
          const pt = path.getPointAtLength(len * p);
          head.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
          head.style.opacity = "1";
        }
      }
    };
    const onScroll = () => {
      if (!raf && active) raf = requestAnimationFrame(update);
    };

    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([e]) => {
          active = e.isIntersecting;
          if (active) onScroll();
        },
        { rootMargin: "240px 0px 240px 0px" }
      );
      io.observe(container);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [geom.d, reduced, containerRef]);

  return (
    <svg className="lp-trail-svg" width={geom.w} height={geom.h} viewBox={`0 0 ${geom.w || 1} ${geom.h || 1}`} aria-hidden="true" focusable="false">
      <path className="lp-trail-base" d={geom.d} />
      <path ref={pathRef} className="lp-trail-path" d={geom.d} />
      <g ref={headRef} className="lp-trail-head-g" style={{ opacity: 0 }}>
        <circle className="lp-trail-halo" r="12" />
        <circle className="lp-trail-head" r="4.5" />
      </g>
    </svg>
  );
}
