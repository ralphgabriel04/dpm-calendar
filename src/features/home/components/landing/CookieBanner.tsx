"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { modulesCopy } from "./copy";

const c = modulesCopy.cookie;
const LS_KEY = "dpm-cookie-consent";

/** CookieBanner — persisted consent bar (essential vs all). Ported from
    landing-sections.jsx; "Politique cookies" links to the privacy page. */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let seen: string | null = "1";
    try {
      seen = localStorage.getItem(LS_KEY);
    } catch {
      /* storage unavailable */
    }
    if (!seen) setVisible(true);
  }, []);

  const decide = (val: string) => {
    try {
      localStorage.setItem(LS_KEY, val);
    } catch {
      /* storage unavailable */
    }
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="lp-slide-up fixed inset-x-0 bottom-0 z-[70] p-4 sm:p-5" role="region" aria-label={c.title}>
      <div className="mx-auto flex max-w-[920px] flex-col gap-4 rounded-[16px] border border-border bg-card p-5 shadow-2xl sm:flex-row sm:items-center sm:p-6">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-primary/[0.12]">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{c.title}</div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
            {c.body}{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              {c.learn}
            </Link>
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={() => decide("essential")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {c.essential}
          </button>
          <button
            onClick={() => decide("all")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {c.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
