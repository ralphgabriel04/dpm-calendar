"use client";

import { AlertTriangle, Calendar as CalendarIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";

interface MeetingLoadWidgetProps {
  className?: string;
}

export function MeetingLoadWidget({ className }: MeetingLoadWidgetProps) {
  const utils = trpc.useUtils();
  const { data: load, isLoading: loadLoading } =
    trpc.meetingLoad.weeklyMeetingLoad.useQuery();
  const { data: buffers, isLoading: buffersLoading } =
    trpc.meetingLoad.backToBackBuffers.useQuery();

  const insertAllMutation = trpc.meetingLoad.insertAllBuffers.useMutation({
    onSuccess: (res) => {
      utils.meetingLoad.backToBackBuffers.invalidate();
      utils.meetingLoad.weeklyMeetingLoad.invalidate();
      utils.event.invalidate();
      toast.success(`Added ${res.createdCount} buffer${res.createdCount === 1 ? "" : "s"}`);
    },
    onError: (error) => {
      toast.error("Failed to add buffers", { description: error.message });
    },
  });

  const isLoading = loadLoading || buffersLoading;
  const pairs = buffers?.pairs ?? [];
  const overThreshold = load?.isOverThreshold ?? false;

  const handleAddAll = () => {
    if (pairs.length === 0) return;
    insertAllMutation.mutate({
      pairs: pairs.map((p) => ({
        calendarId: p.calendarId,
        suggestedBufferStart: p.suggestedBufferStart,
        suggestedBufferEnd: p.suggestedBufferEnd,
      })),
    });
  };

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Meeting load (next 7 days)
        </h3>
        {!isLoading && load && (
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              overThreshold
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            )}
          >
            {load.totalHours}h / {load.threshold}h
          </span>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}

      {!isLoading && load && (
        <>
          {overThreshold && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900 dark:text-red-300">
                  High meeting load
                </p>
                <p className="text-red-700 dark:text-red-400 text-xs mt-0.5">
                  You have {load.totalHours}h of meetings this week (threshold:{" "}
                  {load.threshold}h). Consider declining or rescheduling.
                </p>
              </div>
            </div>
          )}

          {/* Daily breakdown */}
          <div className="space-y-1.5 mb-4">
            {load.byDay.map((d) => {
              const maxHours = Math.max(...load.byDay.map((x) => x.hours), 1);
              const width = (d.hours / maxHours) * 100;
              return (
                <div key={d.date} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-muted-foreground">
                    {new Date(d.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-muted-foreground">
                    {d.hours}h
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Back-to-back buffers CTA */}
      {!isLoading && pairs.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm">
              <p className="font-medium">
                {pairs.length} back-to-back meeting{pairs.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add 30-min buffers to recover between them.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleAddAll}
              disabled={insertAllMutation.isPending}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add buffers
            </Button>
          </div>
        </div>
      )}

      {!isLoading && pairs.length === 0 && !overThreshold && load && load.meetingCount > 0 && (
        <p className="text-xs text-muted-foreground border-t pt-3">
          No back-to-back meetings detected. Good spacing.
        </p>
      )}
    </div>
  );
}
