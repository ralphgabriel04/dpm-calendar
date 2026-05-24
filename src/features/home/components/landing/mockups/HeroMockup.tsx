"use client";

export function HeroMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-violet-500/10">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="ml-2 text-xs text-muted-foreground">DPM Calendar</span>
      </div>
      <div className="p-4 bg-gradient-to-br from-muted to-muted/50">
        <div className="flex gap-3">
          {/* Mini Sidebar */}
          <div className="w-32 space-y-2 rounded-lg border border-border bg-card p-2">
            <div className="h-4 w-16 rounded bg-violet-500/30" />
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-violet-500" />
                <div className="h-2 w-12 rounded bg-muted" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="h-2 w-10 rounded bg-muted" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="h-2 w-14 rounded bg-muted" />
              </div>
            </div>
          </div>
          {/* Mini Calendar Grid */}
          <div className="flex-1 rounded-lg border border-border bg-card p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-16 rounded bg-violet-500/30" />
              <div className="flex gap-1">
                <div className="h-3 w-8 rounded bg-muted" />
                <div className="h-3 w-8 rounded bg-violet-500/30" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded flex items-center justify-center text-[8px] ${
                    i === 2 ? "bg-violet-500 text-white" : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
