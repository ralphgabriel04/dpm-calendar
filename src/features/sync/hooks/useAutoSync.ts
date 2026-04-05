"use client";

import { useEffect, useCallback, useRef } from "react";
import { trpc } from "@/infrastructure/trpc/client";
import { toast } from "sonner";

interface UseAutoSyncOptions {
  enabled?: boolean;
  showToasts?: boolean;
}

/**
 * Hook for automatic calendar synchronization
 * Syncs all active calendar accounts based on their syncInterval setting
 */
export function useAutoSync(options: UseAutoSyncOptions = {}) {
  const { enabled = true, showToasts = true } = options;
  const syncInProgressRef = useRef<Set<string>>(new Set());

  // Get all calendar accounts
  const { data: accounts, refetch: refetchAccounts } = trpc.sync.listAccounts.useQuery(
    undefined,
    { enabled }
  );

  // Trigger sync mutation
  const triggerSync = trpc.sync.triggerSync.useMutation({
    onSuccess: (result, variables) => {
      syncInProgressRef.current.delete(variables.accountId);
      if (showToasts && result.itemsProcessed > 0) {
        toast.success(`Sync completed: ${result.itemsProcessed} events processed`);
      }
      if (result.conflictsDetected > 0) {
        toast.warning(`${result.conflictsDetected} conflicts detected - review required`);
      }
    },
    onError: (error, variables) => {
      syncInProgressRef.current.delete(variables.accountId);
      if (showToasts) {
        toast.error(`Sync failed: ${error.message}`);
      }
    },
  });

  // Sync a single account
  const syncAccount = useCallback(
    async (accountId: string) => {
      // Prevent duplicate syncs
      if (syncInProgressRef.current.has(accountId)) {
        return;
      }

      syncInProgressRef.current.add(accountId);
      try {
        await triggerSync.mutateAsync({ accountId });
      } catch {
        // Error handled in onError callback
      }
    },
    [triggerSync]
  );

  // Sync all active accounts
  const syncAllAccounts = useCallback(async () => {
    if (!accounts) return;

    const activeAccounts = accounts.filter((a) => a.isActive);
    for (const account of activeAccounts) {
      await syncAccount(account.id);
    }
  }, [accounts, syncAccount]);

  // Set up automatic sync intervals
  useEffect(() => {
    if (!enabled || !accounts) return;

    const intervals: NodeJS.Timeout[] = [];

    // Create interval for each active account based on its syncInterval
    for (const account of accounts) {
      if (!account.isActive) continue;

      const intervalMs = (account.syncInterval || 15) * 60 * 1000; // Default 15 minutes

      // Initial sync after a short delay
      const initialTimeout = setTimeout(() => {
        syncAccount(account.id);
      }, 5000); // 5 second initial delay

      // Periodic sync
      const interval = setInterval(() => {
        syncAccount(account.id);
      }, intervalMs);

      intervals.push(initialTimeout as unknown as NodeJS.Timeout);
      intervals.push(interval);
    }

    return () => {
      intervals.forEach((interval) => clearInterval(interval));
    };
  }, [enabled, accounts, syncAccount]);

  return {
    accounts,
    syncAccount,
    syncAllAccounts,
    isSyncing: triggerSync.isPending,
    refetchAccounts,
  };
}
