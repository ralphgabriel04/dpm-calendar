"use client";

import { useState } from "react";
import { trpc } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { AlertTriangle, Check, X, RefreshCw, GitMerge } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { SyncConflictModal } from "./SyncConflictModal";

export function SyncConflictList() {
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);

  const { data: conflicts, refetch, isLoading } = trpc.sync.getConflicts.useQuery({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Check className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="font-semibold text-lg">Aucun conflit</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tous vos calendriers sont synchronisés
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold">
            {conflicts.length} conflit{conflicts.length > 1 ? "s" : ""} de synchronisation
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="space-y-3">
        {conflicts.map((conflict) => {
          const localData = conflict.localData as Record<string, unknown>;
          const remoteData = conflict.remoteData as Record<string, unknown>;

          return (
            <div
              key={conflict.id}
              className={cn(
                "border rounded-lg p-4 bg-card",
                "hover:border-primary/50 transition-colors cursor-pointer"
              )}
              onClick={() => setSelectedConflict(conflict.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        conflict.conflictType === "DELETE_CONFLICT"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {conflict.conflictType === "DELETE_CONFLICT"
                        ? "Suppression"
                        : "Modification"}
                    </Badge>
                    <Badge variant="outline">
                      {conflict.calendarAccount.provider}
                    </Badge>
                  </div>

                  <h3 className="font-medium">
                    {(localData.title as string) || "Événement sans titre"}
                  </h3>

                  <div className="mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>
                        Local: {localData.title as string}
                      </span>
                      <span>vs</span>
                      <span>
                        Distant: {(remoteData.title as string) || (remoteData.status === "cancelled" ? "Supprimé" : "N/A")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConflict(conflict.id);
                    }}
                  >
                    <GitMerge className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedConflict && (
        <SyncConflictModal
          conflictId={selectedConflict}
          open={!!selectedConflict}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedConflict(null);
              refetch();
            }
          }}
        />
      )}
    </div>
  );
}
