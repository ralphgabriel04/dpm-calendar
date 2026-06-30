"use client";

/* lpCelebrate — confetti burst from the center of `host` (task / habit done).
   Ported verbatim from the DPM Elevate prototype (landing-fx.jsx). The host
   must be position:relative; pieces are absolutely placed and self-remove. */
export function lpCelebrate(host: HTMLElement | null, colors?: string[]): void {
  if (!host) return;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const palette = colors || ["263 70% 62%", "330 80% 64%", "38 92% 56%", "142 70% 52%", "217 91% 62%"];
  const N = 18;
  for (let i = 0; i < N; i++) {
    const piece = document.createElement("span");
    piece.className = "lp-confetti-piece";
    const ang = (Math.PI * 2 * i) / N + (Math.random() - 0.5) * 0.6;
    const dist = 34 + Math.random() * 52;
    piece.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    piece.style.setProperty("--dy", Math.sin(ang) * dist - 12 + "px");
    piece.style.setProperty("--dr", Math.random() * 560 - 280 + "deg");
    piece.style.background = `hsl(${palette[i % palette.length]})`;
    piece.style.animationDelay = Math.random() * 70 + "ms";
    if (Math.random() > 0.5) piece.style.borderRadius = "50%";
    host.appendChild(piece);
    setTimeout(() => piece.remove(), 1100);
  }
}
