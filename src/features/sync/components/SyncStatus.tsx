"use client";

import { useState } from "react";
import { trpc } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/Popover";
import {
  RefreshCw,
  Check,
  AlertTriangle,
  Cloud,
  CloudOff,
  Settings,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useAutoSync } from "../hooks/useAutoSync";

interface SyncStatusProps {
  showDetails?: boolean;
}

export function SyncStatus({ showDetails = true }: SyncStatusProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { accounts, syncAccount, syncAllAccounts, isSyncing } = useAutoSync({
    enabled: true,
    showToasts: true,
  });

  const { data: conflicts } = trpc.sync.getConflicts.useQuery({});
  const conflictCount = conflicts?.length || 0;

  const hasErrors = accounts?.some((a) => a.lastError);
  const allSynced = accounts?.every((a) => a.lastSyncAt);

  const getStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (conflictCount > 0) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
    if (hasErrors) {
      return <CloudOff className="h-4 w-4 text-destructive" />;
    }
    if (allSynced) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    return <Cloud className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isSyncing) return "Synchronisation...";
    if (conflictCount > 0) return `${conflictCount} conflit${conflictCount > 1 ? "s" : ""}`;
    if (hasErrors) return "Erreur de sync";
    if (allSynced) return "Synchronisé";
    return "Non synchronisé";
  };

  if (!showDetails) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => syncAllAccounts()}
        disabled={isSyncing}
        title={getStatusText()}
      >
        {getStatusIcon()}
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2",
            conflictCount > 0 && "text-amber-500",
            hasErrors && "text-destructive"
          )}
        >
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Synchronisation</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                syncAllAccounts();
                toast.info("Synchronisation de tous les comptes...");
              }}
              disabled={isSyncing}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")}
              />
              Sync
            </Button>
          </div>

          {/* Account list */}
          <div className="space-y-2">
            {accounts?.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {account.provider === "GOOGLE" ? "G" : "M"}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[150px]">
                      {account.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {account.lastSyncAt
                        ? `Sync ${formatDistanceToNow(account.lastSyncAt, {
                            addSuffix: true,
                            locale: fr,
                          })}`
                        : "Jamais synchronisé"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {account.lastError && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  {!account.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Inactif
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => syncAccount(account.id)}
                    disabled={isSyncing}
                  >
                    <RefreshCw
                      className={cn("h-3 w-3", isSyncing && "animate-spin")}
                    />
                  </Button>
                </div>
              </div>
            ))}

            {(!accounts || accounts.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun compte connecté
              </p>
            )}
          </div>

          {/* Conflict warning */}
          {conflictCount > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">
                {conflictCount} conflit{conflictCount > 1 ? "s" : ""} à résoudre
              </span>
            </div>
          )}

          {/* Settings link */}
          <div className="pt-2 border-t">
            <a
              href="/settings"
              className="flex items-center gap-2 w-full px-4 py-2 text-sm rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              Gérer les calendriers
            </a>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
