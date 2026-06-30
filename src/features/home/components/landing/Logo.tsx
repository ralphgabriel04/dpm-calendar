import { CalendarClock } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/** Logo — the DPM Elevate wordmark written as live text (no image), matching
    the brand lockup: a calendar-clock glyph in a rounded violet tile, then
    "DPM" (bold) over "ELEVATE" (uppercase, letter-spaced). */
export function Logo({ size = 34, withText = true, className }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className="flex flex-shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#4f46e5] to-[#312e81] shadow-sm ring-1 ring-white/10"
        style={{ width: size, height: size }}
      >
        <CalendarClock className="text-cyan-300" style={{ width: size * 0.56, height: size * 0.56 }} strokeWidth={2} />
      </span>
      {withText && (
        <div className="leading-none">
          <div className="text-[18px] font-bold leading-none tracking-tight text-foreground">DPM</div>
          <div className="mt-1 text-[10.5px] font-medium uppercase leading-none tracking-[0.22em] text-muted-foreground">
            Elevate
          </div>
        </div>
      )}
    </div>
  );
}
