"use client";

import type { ReactNode } from "react";

/* Monochrome/brand SVG marks (theme-aware), ported from the prototype. */
const BrandMarks: Record<string, ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="1" fill="#fff" />
      <path fill="#EA4335" d="M5 7a2 2 0 0 1 2-2h1.2v3H5z" />
      <path fill="#FBBC05" d="M19 7a2 2 0 0 0-2-2h-1.2v3H19z" />
      <path fill="#34A853" d="M19 17a2 2 0 0 1-2 2h-1.2v-3H19z" />
      <path fill="#4285F4" d="M5 17a2 2 0 0 0 2 2h1.2v-3H5z" />
      <text x="12" y="15.6" fontSize="7.4" fontWeight="700" textAnchor="middle" fill="#4285F4" fontFamily="Arial, sans-serif">
        31
      </text>
    </svg>
  ),
  outlook: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="11" y="7" width="10" height="10" rx="1" fill="#28A8EA" />
      <path fill="#fff" d="M11 8.4l5 3.1 5-3.1V7.6l-5 3.1-5-3.1z" />
      <path fill="#0A4A8C" d="M3 6 13 4.3v15.4L3 18z" />
      <ellipse cx="7.7" cy="12" rx="2.7" ry="3.3" fill="none" stroke="#fff" strokeWidth="1.6" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.99-.74.84-1.95 1.49-3.13 1.4-.14-1.13.43-2.31 1.09-3.06.74-.84 2.01-1.45 3.16-1.33zM20.5 17.2c-.57 1.32-.85 1.91-1.59 3.08-1.03 1.63-2.49 3.66-4.29 3.67-1.6.02-2.01-1.04-4.18-1.03-2.17.01-2.62 1.05-4.22 1.03-1.8-.02-3.18-1.85-4.21-3.48-2.88-4.56-3.19-9.91-1.41-12.76 1.27-2.02 3.27-3.2 5.15-3.2 1.92 0 3.12 1.05 4.71 1.05 1.54 0 2.48-1.05 4.7-1.05 1.68 0 3.46.91 4.73 2.49-4.16 2.28-3.48 8.21.81 9.94z" />
    </svg>
  ),
  todoist: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="#E44332" />
      <path d="M7 9.1l1.7 1 4.3-2.5M7 12.3l1.7 1 4.3-2.5M7 15.5l1.7 1 4.3-2.5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  slack: (
    <svg viewBox="0 0 122.8 122.8" width="18" height="18" aria-hidden="true">
      <path fill="#E01E5A" d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" />
      <path fill="#36C5F0" d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" />
      <path fill="#2EB67D" d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" />
      <path fill="#ECB22E" d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" />
    </svg>
  ),
  notion: (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#fff" stroke="#000" strokeWidth="0.8" strokeOpacity="0.15" />
      <path fill="#000" d="M8 7.8v8.4h1.7v-5.1l3.8 5.1H15V7.8h-1.7v5l-3.7-5z" />
    </svg>
  ),
  zoom: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#2D8CFF" />
      <path fill="#fff" d="M6 9.7C6 8.8 6.8 8 7.7 8h5.1c.9 0 1.7.8 1.7 1.7v4.6c0 .9-.8 1.7-1.7 1.7H7.7C6.8 16 6 15.2 6 14.3V9.7zm9.5 1.6 2.7-2c.43-.32 1 0 1 .52v5.36c0 .52-.57.84-1 .52l-2.7-2v-2.4z" />
    </svg>
  ),
};

const BRANDS = [
  { id: "google", name: "Google Calendar" },
  { id: "outlook", name: "Outlook" },
  { id: "apple", name: "Apple Calendar" },
  { id: "todoist", name: "Todoist" },
  { id: "slack", name: "Slack" },
  { id: "notion", name: "Notion" },
  { id: "zoom", name: "Zoom" },
];

/** BrandMarquee — infinite-scroll row of brand logos with edge fade.
    Ported from landing-sections.jsx. */
export function BrandMarquee() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <div
      className="relative mt-5 overflow-hidden"
      style={{
        maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
      }}
    >
      <div className="lp-marquee">
        {row.map((b, i) => (
          <span key={i} className="flex items-center gap-2.5 px-7 text-muted-foreground transition-colors hover:text-foreground">
            <span className="opacity-90">{BrandMarks[b.id]}</span>
            <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight">{b.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
