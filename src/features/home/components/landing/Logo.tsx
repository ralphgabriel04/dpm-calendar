import { cn } from "@/shared/lib/utils";

/** DPM calendar-clock glyph — white calendar with a cyan→green clock overlapping
    the bottom-right, matching the brand mark. */
function CalClockGlyph({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="dpm-clock-grad" x1="11" y1="11" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>
      {/* calendar */}
      <rect x="3.1" y="5" width="13.4" height="13.6" rx="2.4" stroke="#ffffff" strokeWidth="1.7" />
      <path d="M7 3.2v3.4M12.6 3.2v3.4" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3.1 9.3h13.4" stroke="#ffffff" strokeWidth="1.4" />
      {/* clock (overlaps bottom-right) */}
      <circle cx="16.7" cy="16.3" r="5" fill="#3a2c80" stroke="url(#dpm-clock-grad)" strokeWidth="1.7" />
      <path d="M16.7 13.9v2.5l1.7 1" stroke="url(#dpm-clock-grad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Logo — the DPM Elevate brand lockup: a calendar-clock glyph in a rounded
    violet gradient tile, then "DPM" (bold) over "ELEVATE" (uppercase, tracked). */
export function Logo({ size = 34, withText = true, className }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className="flex flex-shrink-0 items-center justify-center bg-gradient-to-br from-[#8b6ff5] to-[#5a39c9] shadow-md shadow-primary/20 ring-1 ring-white/15"
        style={{ width: size, height: size, borderRadius: size * 0.3 }}
      >
        <CalClockGlyph s={size * 0.6} />
      </span>
      {withText && (
        <div className="leading-none">
          <div className="text-[19px] font-bold leading-none tracking-tight text-foreground">DPM</div>
          <div className="mt-1 text-[10.5px] font-semibold uppercase leading-none tracking-[0.26em] text-muted-foreground">
            Elevate
          </div>
        </div>
      )}
    </div>
  );
}
