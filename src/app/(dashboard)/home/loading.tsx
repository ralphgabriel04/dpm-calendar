/**
 * Loading skeleton for /home page
 * Displays animated placeholders while content is being fetched
 */

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-muted rounded-md ${className || ""}`}
    />
  );
}

export function HomeLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <header className="border-b bg-card px-4 py-4 md:px-6 md:py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="hidden sm:block">
              <Skeleton className="h-10 w-64" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          {/* Workload bar */}
          <div className="rounded-xl border bg-card p-4 md:p-5">
            <Skeleton className="h-4 w-48 mb-3" />
            <Skeleton className="h-8 w-full" />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current task card */}
              <div className="rounded-xl border bg-card p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-24 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>

              {/* Daily overview */}
              <div className="rounded-xl border bg-card p-4 md:p-5">
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="rounded-xl border bg-card p-4 md:p-5">
                <Skeleton className="h-4 w-32 mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Timeline */}
              <div className="rounded-xl border bg-card p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks list */}
              <div className="rounded-xl border bg-card p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-14" />
                </div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>

              {/* Smart tips */}
              <div className="rounded-xl border bg-card p-4 md:p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomeLoadingSkeleton;
