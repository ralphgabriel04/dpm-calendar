import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure, protectedSyncProcedure, protectedMutationProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";
import {
  listEvents as listGoogleEvents,
  refreshAccessToken as refreshGoogleToken,
  listCalendars as listGoogleCalendars,
  createEvent as createGoogleEvent,
  updateEvent as updateGoogleEvent,
  deleteEvent as deleteGoogleEvent,
  type GoogleEvent,
} from "@/lib/google/calendar";
import {
  listEvents as listMicrosoftEvents,
  refreshAccessToken as refreshMicrosoftToken,
  listCalendars as listMicrosoftCalendars,
  createEvent as createMicrosoftEvent,
  updateEvent as updateMicrosoftEvent,
  deleteEvent as deleteMicrosoftEvent,
  type MicrosoftEvent,
} from "@/lib/microsoft/calendar";
import { encryptToken, decryptToken } from "@/lib/crypto";
import type { PrismaClient, Event, Calendar, CalendarAccount, Prisma } from "@prisma/client";

export const syncRouter = createTRPCRouter({
  // List calendar accounts
  listAccounts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.calendarAccount.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        calendars: true,
        _count: {
          select: { syncConflicts: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  // Get sync conflicts
  getConflicts: protectedProcedure
    .input(z.object({ accountId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.syncConflict.findMany({
        where: {
          calendarAccount: {
            userId: ctx.session.user.id,
            ...(input.accountId ? { id: input.accountId } : {}),
          },
          resolution: null,
        },
        include: {
          calendarAccount: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Resolve conflict and apply the resolution
  resolveConflict: protectedProcedure
    .input(
      z.object({
        conflictId: z.string(),
        resolution: z.enum(["USE_LOCAL", "USE_REMOTE", "MERGE", "SKIP"]),
        mergedData: z.record(z.string(), z.unknown()).optional(), // For MERGE resolution
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conflict = await ctx.db.syncConflict.findFirst({
        where: {
          id: input.conflictId,
          calendarAccount: { userId: ctx.session.user.id },
        },
        include: {
          calendarAccount: true,
        },
      });

      if (!conflict) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const event = conflict.eventId
        ? await ctx.db.event.findUnique({
            where: { id: conflict.eventId },
            include: { calendar: true },
          })
        : null;

      // Apply the resolution based on the choice
      if (event) {
        const remoteData = conflict.remoteData as Record<string, unknown>;
        const localData = conflict.localData as Record<string, unknown>;

        switch (input.resolution) {
          case "USE_LOCAL":
            // Keep local data, mark as PENDING_PUSH to sync to remote
            await ctx.db.event.update({
              where: { id: event.id },
              data: { syncStatus: "PENDING_PUSH" },
            });
            break;

          case "USE_REMOTE":
            // Apply remote data to local
            if (remoteData.status === "cancelled" || remoteData.isCancelled) {
              // Remote deleted the event
              await ctx.db.event.delete({ where: { id: event.id } });
            } else {
              await ctx.db.event.update({
                where: { id: event.id },
                data: {
                  title: (remoteData.title as string) || event.title,
                  description: remoteData.description as string | null,
                  location: remoteData.location as string | null,
                  startAt: remoteData.startAt
                    ? new Date(remoteData.startAt as string)
                    : event.startAt,
                  endAt: remoteData.endAt
                    ? new Date(remoteData.endAt as string)
                    : event.endAt,
                  duration: (remoteData.duration as number) || event.duration,
                  isAllDay: (remoteData.isAllDay as boolean) ?? event.isAllDay,
                  etag: remoteData.etag as string | null,
                  syncStatus: "SYNCED",
                  lastSyncAt: new Date(),
                },
              });
            }
            break;

          case "MERGE":
            // Apply merged data if provided
            if (input.mergedData) {
              await ctx.db.event.update({
                where: { id: event.id },
                data: {
                  title: (input.mergedData.title as string) || event.title,
                  description: input.mergedData.description as string | null,
                  location: input.mergedData.location as string | null,
                  startAt: input.mergedData.startAt
                    ? new Date(input.mergedData.startAt as string)
                    : event.startAt,
                  endAt: input.mergedData.endAt
                    ? new Date(input.mergedData.endAt as string)
                    : event.endAt,
                  syncStatus: "PENDING_PUSH", // Push merged data to remote
                  lastSyncAt: new Date(),
                },
              });
            }
            break;

          case "SKIP":
            // Just mark as SYNCED, keep local as-is without pushing
            await ctx.db.event.update({
              where: { id: event.id },
              data: { syncStatus: "SYNCED" },
            });
            break;
        }
      }

      // Mark conflict as resolved
      return ctx.db.syncConflict.update({
        where: { id: input.conflictId },
        data: {
          resolution: input.resolution,
          resolvedAt: new Date(),
        },
      });
    }),

  // Update account settings
  updateAccount: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        isPrimary: z.boolean().optional(),
        syncDirection: z.enum(["PULL", "PUSH", "FULL"]).optional(),
        syncInterval: z.number().min(5).max(60).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const account = await ctx.db.calendarAccount.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // If setting as primary, unset other primary accounts
      if (data.isPrimary) {
        await ctx.db.calendarAccount.updateMany({
          where: { userId: ctx.session.user.id, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return ctx.db.calendarAccount.update({
        where: { id },
        data,
      });
    }),

  // Delete account
  deleteAccount: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.calendarAccount.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.calendarAccount.delete({
        where: { id: input.id },
      });
    }),

  // Get sync logs
  getLogs: protectedProcedure
    .input(
      z.object({
        accountId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const accounts = await ctx.db.calendarAccount.findMany({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });

      const accountIds = accounts.map((a) => a.id);

      return ctx.db.syncLog.findMany({
        where: {
          calendarAccountId: input.accountId
            ? input.accountId
            : { in: accountIds },
        },
        orderBy: { startedAt: "desc" },
        take: input.limit,
      });
    }),

  // Trigger manual sync
  // SECURITY: Uses sync-specific rate limit (10/5min) to prevent API quota exhaustion
  triggerSync: protectedSyncProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.calendarAccount.findFirst({
        where: { id: input.accountId, userId: ctx.session.user.id },
        include: { calendars: true },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Create sync log entry
      const syncLog = await ctx.db.syncLog.create({
        data: {
          calendarAccountId: input.accountId,
          direction: account.syncDirection,
          status: "IN_PROGRESS",
        },
      });

      let itemsProcessed = 0;
      let itemsFailed = 0;
      let conflictsDetected = 0;
      let errorMessage: string | null = null;

      try {
        // Check if token needs refresh
        let accessToken = decryptToken(account.accessToken);
        if (account.expiresAt && account.expiresAt < new Date()) {
          if (!account.refreshToken) {
            throw new Error("No refresh token available");
          }

          const refreshToken = decryptToken(account.refreshToken);
          const newTokens = account.provider === "GOOGLE"
            ? await refreshGoogleToken(refreshToken)
            : await refreshMicrosoftToken(refreshToken);
          accessToken = newTokens.accessToken;

          // Store rotated refresh token if provided
          await ctx.db.calendarAccount.update({
            where: { id: account.id },
            data: {
              accessToken: encryptToken(newTokens.accessToken),
              refreshToken: newTokens.refreshToken
                ? encryptToken(newTokens.refreshToken)
                : account.refreshToken, // Keep existing if not rotated
              expiresAt: newTokens.expiryDate
                ? new Date(newTokens.expiryDate)
                : null,
            },
          });
        }

        // Sync each calendar based on syncDirection
        for (const calendar of account.calendars) {
          if (!calendar.externalId) continue;

          try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const ninetyDaysAhead = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

            // PULL: Fetch events from external calendar → local DB
            if (account.syncDirection === "PULL" || account.syncDirection === "FULL") {
              if (account.provider === "GOOGLE") {
                const pullResult = await pullFromGoogle(
                  ctx.db,
                  account,
                  calendar,
                  accessToken,
                  thirtyDaysAgo,
                  ninetyDaysAhead,
                  ctx.session.user.id
                );
                itemsProcessed += pullResult.processed;
                itemsFailed += pullResult.failed;
                conflictsDetected += pullResult.conflicts;
              } else if (account.provider === "MICROSOFT") {
                const pullResult = await pullFromMicrosoft(
                  ctx.db,
                  account,
                  calendar,
                  accessToken,
                  thirtyDaysAgo,
                  ninetyDaysAhead,
                  ctx.session.user.id
                );
                itemsProcessed += pullResult.processed;
                itemsFailed += pullResult.failed;
                conflictsDetected += pullResult.conflicts;
              }
            }

            // PUSH: Push local events → external calendar
            if (account.syncDirection === "PUSH" || account.syncDirection === "FULL") {
              if (account.provider === "GOOGLE") {
                const pushResult = await pushToGoogle(
                  ctx.db,
                  calendar,
                  accessToken,
                  ctx.session.user.id
                );
                itemsProcessed += pushResult.processed;
                itemsFailed += pushResult.failed;
              } else if (account.provider === "MICROSOFT") {
                const pushResult = await pushToMicrosoft(
                  ctx.db,
                  calendar,
                  accessToken,
                  ctx.session.user.id
                );
                itemsProcessed += pushResult.processed;
                itemsFailed += pushResult.failed;
              }
            }
          } catch (calError) {
            console.error("Error syncing calendar:", calError);
            itemsFailed++;
          }
        }

        // Mark sync as completed
        await ctx.db.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: itemsFailed > 0 ? "PARTIAL" : "COMPLETED",
            itemsProcessed,
            itemsFailed,
            completedAt: new Date(),
            details: { conflictsDetected },
          },
        });

        await ctx.db.calendarAccount.update({
          where: { id: input.accountId },
          data: { lastSyncAt: new Date(), lastError: null },
        });
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : "Unknown error";

        await ctx.db.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: "FAILED",
            itemsProcessed,
            itemsFailed,
            errorMessage,
            completedAt: new Date(),
          },
        });

        await ctx.db.calendarAccount.update({
          where: { id: input.accountId },
          data: { lastError: errorMessage },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Sync failed: ${errorMessage}`,
        });
      }

      return { success: true, syncLogId: syncLog.id, itemsProcessed, itemsFailed, conflictsDetected };
    }),

  // Disconnect Google Calendar
  disconnectGoogle: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.calendarAccount.findFirst({
        where: {
          id: input.accountId,
          userId: ctx.session.user.id,
          provider: "GOOGLE",
        },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Delete calendars associated with this account
      await ctx.db.calendar.deleteMany({
        where: { calendarAccountId: input.accountId },
      });

      // Delete the account
      await ctx.db.calendarAccount.delete({
        where: { id: input.accountId },
      });

      return { success: true };
    }),

  // Refresh calendars from Google
  // SECURITY: Uses sync-specific rate limit (10/5min) to prevent API quota exhaustion
  refreshGoogleCalendars: protectedSyncProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.calendarAccount.findFirst({
        where: {
          id: input.accountId,
          userId: ctx.session.user.id,
          provider: "GOOGLE",
        },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Refresh token if needed
      let accessToken = decryptToken(account.accessToken);
      if (account.expiresAt && account.expiresAt < new Date()) {
        if (!account.refreshToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token expired and no refresh token available",
          });
        }
        const newTokens = await refreshGoogleToken(decryptToken(account.refreshToken));
        accessToken = newTokens.accessToken;

        // Store rotated refresh token if provided
        await ctx.db.calendarAccount.update({
          where: { id: account.id },
          data: {
            accessToken: encryptToken(newTokens.accessToken),
            refreshToken: newTokens.refreshToken
              ? encryptToken(newTokens.refreshToken)
              : account.refreshToken, // Keep existing if not rotated
            expiresAt: newTokens.expiryDate
              ? new Date(newTokens.expiryDate)
              : null,
          },
        });
      }

      // Get calendars from Google
      const googleCalendars = await listGoogleCalendars(accessToken);

      // Get existing calendars
      const existingCalendars = await ctx.db.calendar.findMany({
        where: { calendarAccountId: input.accountId },
      });

      const existingExternalIds = new Set(existingCalendars.map((c) => c.externalId));

      // Add new calendars
      for (const googleCal of googleCalendars) {
        if (existingExternalIds.has(googleCal.id)) continue;
        if (googleCal.accessRole === "reader" || googleCal.id.includes("holiday")) {
          continue;
        }

        await ctx.db.calendar.create({
          data: {
            userId: ctx.session.user.id,
            calendarAccountId: input.accountId,
            externalId: googleCal.id,
            name: googleCal.summary,
            description: googleCal.description,
            color: googleCal.backgroundColor || "#3b82f6",
            provider: "GOOGLE",
            isDefault: googleCal.primary || false,
            canEdit: googleCal.accessRole === "owner" || googleCal.accessRole === "writer",
          },
        });
      }

      return { success: true };
    }),

  // Disconnect Microsoft Calendar
  disconnectMicrosoft: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.calendarAccount.findFirst({
        where: {
          id: input.accountId,
          userId: ctx.session.user.id,
          provider: "MICROSOFT",
        },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Delete calendars associated with this account
      await ctx.db.calendar.deleteMany({
        where: { calendarAccountId: input.accountId },
      });

      // Delete the account
      await ctx.db.calendarAccount.delete({
        where: { id: input.accountId },
      });

      return { success: true };
    }),

  // Refresh calendars from Microsoft
  // SECURITY: Uses sync-specific rate limit (10/5min) to prevent API quota exhaustion
  refreshMicrosoftCalendars: protectedSyncProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.calendarAccount.findFirst({
        where: {
          id: input.accountId,
          userId: ctx.session.user.id,
          provider: "MICROSOFT",
        },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Refresh token if needed
      let accessToken = decryptToken(account.accessToken);
      if (account.expiresAt && account.expiresAt < new Date()) {
        if (!account.refreshToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token expired and no refresh token available",
          });
        }
        const newTokens = await refreshMicrosoftToken(decryptToken(account.refreshToken));
        accessToken = newTokens.accessToken;

        // Store rotated refresh token if provided (Microsoft rotates tokens)
        await ctx.db.calendarAccount.update({
          where: { id: account.id },
          data: {
            accessToken: encryptToken(newTokens.accessToken),
            refreshToken: newTokens.refreshToken
              ? encryptToken(newTokens.refreshToken)
              : account.refreshToken, // Keep existing if not rotated
            expiresAt: newTokens.expiryDate
              ? new Date(newTokens.expiryDate)
              : null,
          },
        });
      }

      // Get calendars from Microsoft
      const microsoftCalendars = await listMicrosoftCalendars(accessToken);

      // Get existing calendars
      const existingCalendars = await ctx.db.calendar.findMany({
        where: { calendarAccountId: input.accountId },
      });

      const existingExternalIds = new Set(existingCalendars.map((c) => c.externalId));

      // Add new calendars
      for (const msCal of microsoftCalendars) {
        if (existingExternalIds.has(msCal.id)) continue;

        await ctx.db.calendar.create({
          data: {
            userId: ctx.session.user.id,
            calendarAccountId: input.accountId,
            externalId: msCal.id,
            name: msCal.name,
            color: msCal.color || "#0078D4",
            provider: "MICROSOFT",
            isDefault: msCal.isDefaultCalendar || false,
            canEdit: msCal.canEdit || false,
          },
        });
      }

      return { success: true };
    }),
});

// =============================================================================
// PULL FUNCTIONS: External Calendar → Local Database
// =============================================================================

interface SyncResult {
  processed: number;
  failed: number;
  conflicts: number;
}

type DbClient = typeof import("@/infrastructure/db/client").db;

async function pullFromGoogle(
  db: DbClient,
  account: CalendarAccount,
  calendar: Calendar,
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
  userId: string
): Promise<SyncResult> {
  let processed = 0;
  let failed = 0;
  let conflicts = 0;

  try {
    const { events: googleEvents, nextSyncToken } = await listGoogleEvents(
      accessToken,
      calendar.externalId!,
      {
        timeMin,
        timeMax,
        syncToken: account.syncToken || undefined,
      }
    );

    for (const googleEvent of googleEvents) {
      try {
        const result = await syncGoogleEventWithConflictDetection(
          db,
          account.id,
          calendar.id,
          userId,
          googleEvent
        );
        processed++;
        if (result.conflict) conflicts++;
      } catch (error) {
        console.error("Error syncing Google event:", error);
        failed++;
      }
    }

    // Save sync token for incremental sync
    if (nextSyncToken) {
      await db.calendarAccount.update({
        where: { id: account.id },
        data: { syncToken: nextSyncToken },
      });
    }
  } catch (error) {
    console.error("Error pulling from Google:", error);
    failed++;
  }

  return { processed, failed, conflicts };
}

async function pullFromMicrosoft(
  db: DbClient,
  account: CalendarAccount,
  calendar: Calendar,
  accessToken: string,
  startDateTime: Date,
  endDateTime: Date,
  userId: string
): Promise<SyncResult> {
  let processed = 0;
  let failed = 0;
  let conflicts = 0;

  try {
    const { events: msEvents, deltaLink } = await listMicrosoftEvents(
      accessToken,
      calendar.externalId!,
      {
        startDateTime,
        endDateTime,
        deltaToken: account.syncToken || undefined,
      }
    );

    for (const msEvent of msEvents) {
      try {
        const result = await syncMicrosoftEventWithConflictDetection(
          db,
          account.id,
          calendar.id,
          userId,
          msEvent
        );
        processed++;
        if (result.conflict) conflicts++;
      } catch (error) {
        console.error("Error syncing Microsoft event:", error);
        failed++;
      }
    }

    // Save delta token for incremental sync
    if (deltaLink) {
      await db.calendarAccount.update({
        where: { id: account.id },
        data: { syncToken: deltaLink },
      });
    }
  } catch (error) {
    console.error("Error pulling from Microsoft:", error);
    failed++;
  }

  return { processed, failed, conflicts };
}

// =============================================================================
// PUSH FUNCTIONS: Local Database → External Calendar
// =============================================================================

async function pushToGoogle(
  db: DbClient,
  calendar: Calendar,
  accessToken: string,
  userId: string
): Promise<SyncResult> {
  let processed = 0;
  let failed = 0;

  // Find events that need to be pushed
  const pendingEvents = await db.event.findMany({
    where: {
      calendarId: calendar.id,
      userId,
      syncStatus: "PENDING_PUSH",
      provider: "GOOGLE",
    },
  });

  for (const event of pendingEvents) {
    try {
      if (event.status === "CANCELLED") {
        // Delete event from Google
        if (event.externalId) {
          await deleteGoogleEvent(accessToken, calendar.externalId!, event.externalId);
        }
        // Hard delete locally after successful remote delete
        await db.event.delete({ where: { id: event.id } });
      } else if (event.externalId) {
        // Update existing event in Google
        const updatedEvent = await updateGoogleEvent(
          accessToken,
          calendar.externalId!,
          event.externalId,
          {
            summary: event.title,
            description: event.description || undefined,
            location: event.location || undefined,
            start: event.startAt,
            end: event.endAt,
            isAllDay: event.isAllDay,
            recurrence: event.rrule ? [event.rrule] : undefined,
          }
        );

        await db.event.update({
          where: { id: event.id },
          data: {
            etag: updatedEvent.etag,
            syncStatus: "SYNCED",
            lastSyncAt: new Date(),
          },
        });
      } else {
        // Create new event in Google
        const createdEvent = await createGoogleEvent(
          accessToken,
          calendar.externalId!,
          {
            summary: event.title,
            description: event.description || undefined,
            location: event.location || undefined,
            start: event.startAt,
            end: event.endAt,
            isAllDay: event.isAllDay,
            recurrence: event.rrule ? [event.rrule] : undefined,
          }
        );

        await db.event.update({
          where: { id: event.id },
          data: {
            externalId: createdEvent.id,
            etag: createdEvent.etag,
            syncStatus: "SYNCED",
            lastSyncAt: new Date(),
          },
        });
      }
      processed++;
    } catch (error) {
      console.error("Error pushing event to Google:", error);
      await db.event.update({
        where: { id: event.id },
        data: { syncStatus: "ERROR" },
      });
      failed++;
    }
  }

  return { processed, failed, conflicts: 0 };
}

async function pushToMicrosoft(
  db: DbClient,
  calendar: Calendar,
  accessToken: string,
  userId: string
): Promise<SyncResult> {
  let processed = 0;
  let failed = 0;

  // Find events that need to be pushed
  const pendingEvents = await db.event.findMany({
    where: {
      calendarId: calendar.id,
      userId,
      syncStatus: "PENDING_PUSH",
      provider: "MICROSOFT",
    },
  });

  for (const event of pendingEvents) {
    try {
      if (event.status === "CANCELLED") {
        // Delete event from Microsoft
        if (event.externalId) {
          await deleteMicrosoftEvent(accessToken, calendar.externalId!, event.externalId);
        }
        // Hard delete locally after successful remote delete
        await db.event.delete({ where: { id: event.id } });
      } else if (event.externalId) {
        // Update existing event in Microsoft
        const updatedEvent = await updateMicrosoftEvent(
          accessToken,
          calendar.externalId!,
          event.externalId,
          {
            subject: event.title,
            body: event.description || undefined,
            location: event.location || undefined,
            start: event.startAt,
            end: event.endAt,
            isAllDay: event.isAllDay,
            timeZone: event.timezone || "UTC",
          }
        );

        await db.event.update({
          where: { id: event.id },
          data: {
            etag: updatedEvent.changeKey,
            syncStatus: "SYNCED",
            lastSyncAt: new Date(),
          },
        });
      } else {
        // Create new event in Microsoft
        const createdEvent = await createMicrosoftEvent(
          accessToken,
          calendar.externalId!,
          {
            subject: event.title,
            body: event.description || undefined,
            location: event.location || undefined,
            start: event.startAt,
            end: event.endAt,
            isAllDay: event.isAllDay,
            timeZone: event.timezone || "UTC",
          }
        );

        await db.event.update({
          where: { id: event.id },
          data: {
            externalId: createdEvent.id,
            etag: createdEvent.changeKey,
            syncStatus: "SYNCED",
            lastSyncAt: new Date(),
          },
        });
      }
      processed++;
    } catch (error) {
      console.error("Error pushing event to Microsoft:", error);
      await db.event.update({
        where: { id: event.id },
        data: { syncStatus: "ERROR" },
      });
      failed++;
    }
  }

  return { processed, failed, conflicts: 0 };
}

// =============================================================================
// CONFLICT DETECTION: Compare local vs remote and create SyncConflict records
// =============================================================================

async function syncGoogleEventWithConflictDetection(
  db: DbClient,
  accountId: string,
  calendarId: string,
  userId: string,
  googleEvent: GoogleEvent
): Promise<{ conflict: boolean }> {
  const startAt = googleEvent.start.dateTime
    ? new Date(googleEvent.start.dateTime)
    : googleEvent.start.date
    ? new Date(googleEvent.start.date)
    : new Date();

  const endAt = googleEvent.end.dateTime
    ? new Date(googleEvent.end.dateTime)
    : googleEvent.end.date
    ? new Date(googleEvent.end.date)
    : new Date(startAt.getTime() + 60 * 60 * 1000);

  const isAllDay = !googleEvent.start.dateTime && !!googleEvent.start.date;
  const duration = Math.round((endAt.getTime() - startAt.getTime()) / (1000 * 60));

  // Check if event already exists locally
  const existingEvent = await db.event.findFirst({
    where: {
      calendarId,
      externalId: googleEvent.id,
    },
  });

  // Handle cancelled events
  if (googleEvent.status === "cancelled") {
    if (existingEvent) {
      // Check for delete conflict: local has pending changes but remote deleted
      if (existingEvent.syncStatus === "PENDING_PUSH") {
        await db.syncConflict.create({
          data: {
            calendarAccountId: accountId,
            eventId: existingEvent.id,
            localData: existingEvent as unknown as Prisma.InputJsonValue,
            remoteData: { id: googleEvent.id, status: "cancelled" },
            conflictType: "DELETE_CONFLICT",
          },
        });
        // Mark event as conflict, don't delete yet
        await db.event.update({
          where: { id: existingEvent.id },
          data: { syncStatus: "CONFLICT" },
        });
        return { conflict: true };
      }
      // No conflict, safe to delete
      await db.event.delete({ where: { id: existingEvent.id } });
    }
    return { conflict: false };
  }

  const remoteData = {
    title: googleEvent.summary || "Sans titre",
    description: googleEvent.description,
    location: googleEvent.location,
    startAt,
    endAt,
    duration,
    isAllDay,
    etag: googleEvent.etag,
    rrule: googleEvent.recurrence?.[0] || null,
  };

  if (existingEvent) {
    // Check for update conflict: both local and remote have changes
    const hasLocalChanges = existingEvent.syncStatus === "PENDING_PUSH";
    const hasRemoteChanges = existingEvent.etag !== googleEvent.etag;

    if (hasLocalChanges && hasRemoteChanges) {
      // Conflict detected! Create SyncConflict record
      await db.syncConflict.create({
        data: {
          calendarAccountId: accountId,
          eventId: existingEvent.id,
          localData: existingEvent as unknown as Prisma.InputJsonValue,
          remoteData: remoteData as unknown as Prisma.InputJsonValue,
          conflictType: "UPDATE_CONFLICT",
        },
      });
      // Mark event as conflict
      await db.event.update({
        where: { id: existingEvent.id },
        data: { syncStatus: "CONFLICT" },
      });
      return { conflict: true };
    }

    // No conflict, update local with remote data
    await db.event.update({
      where: { id: existingEvent.id },
      data: {
        ...remoteData,
        provider: "GOOGLE",
        syncStatus: "SYNCED",
        lastSyncAt: new Date(),
      },
    });
  } else {
    // Create new event locally
    await db.event.create({
      data: {
        ...remoteData,
        userId,
        calendarId,
        externalId: googleEvent.id,
        provider: "GOOGLE",
        syncStatus: "SYNCED",
        lastSyncAt: new Date(),
      },
    });
  }

  return { conflict: false };
}

async function syncMicrosoftEventWithConflictDetection(
  db: DbClient,
  accountId: string,
  calendarId: string,
  userId: string,
  msEvent: MicrosoftEvent
): Promise<{ conflict: boolean }> {
  // Parse Microsoft datetime with proper timezone handling
  const startAt = parseMicrosoftDateTime(msEvent.start);
  const endAt = parseMicrosoftDateTime(msEvent.end);

  const isAllDay = msEvent.isAllDay || false;
  const duration = Math.round((endAt.getTime() - startAt.getTime()) / (1000 * 60));

  // Check if event already exists locally
  const existingEvent = await db.event.findFirst({
    where: {
      calendarId,
      externalId: msEvent.id,
    },
  });

  // Handle cancelled events
  if (msEvent.isCancelled) {
    if (existingEvent) {
      // Check for delete conflict
      if (existingEvent.syncStatus === "PENDING_PUSH") {
        await db.syncConflict.create({
          data: {
            calendarAccountId: accountId,
            eventId: existingEvent.id,
            localData: existingEvent as unknown as Prisma.InputJsonValue,
            remoteData: { id: msEvent.id, isCancelled: true },
            conflictType: "DELETE_CONFLICT",
          },
        });
        await db.event.update({
          where: { id: existingEvent.id },
          data: { syncStatus: "CONFLICT" },
        });
        return { conflict: true };
      }
      await db.event.delete({ where: { id: existingEvent.id } });
    }
    return { conflict: false };
  }

  const remoteData = {
    title: msEvent.subject || "Sans titre",
    description: msEvent.bodyPreview,
    location: msEvent.location?.displayName,
    startAt,
    endAt,
    duration,
    isAllDay,
    etag: msEvent.changeKey,
    timezone: msEvent.start.timeZone || "UTC",
  };

  if (existingEvent) {
    // Check for update conflict
    const hasLocalChanges = existingEvent.syncStatus === "PENDING_PUSH";
    const hasRemoteChanges = existingEvent.etag !== msEvent.changeKey;

    if (hasLocalChanges && hasRemoteChanges) {
      await db.syncConflict.create({
        data: {
          calendarAccountId: accountId,
          eventId: existingEvent.id,
          localData: existingEvent as unknown as Prisma.InputJsonValue,
          remoteData: remoteData as unknown as Prisma.InputJsonValue,
          conflictType: "UPDATE_CONFLICT",
        },
      });
      await db.event.update({
        where: { id: existingEvent.id },
        data: { syncStatus: "CONFLICT" },
      });
      return { conflict: true };
    }

    await db.event.update({
      where: { id: existingEvent.id },
      data: {
        ...remoteData,
        provider: "MICROSOFT",
        syncStatus: "SYNCED",
        lastSyncAt: new Date(),
      },
    });
  } else {
    await db.event.create({
      data: {
        ...remoteData,
        userId,
        calendarId,
        externalId: msEvent.id,
        provider: "MICROSOFT",
        syncStatus: "SYNCED",
        lastSyncAt: new Date(),
      },
    });
  }

  return { conflict: false };
}

// =============================================================================
// UTILITY: Parse Microsoft datetime with proper timezone handling
// =============================================================================

function parseMicrosoftDateTime(dateTime: { dateTime: string; timeZone: string }): Date {
  // Microsoft returns datetime in ISO format but sometimes without timezone indicator
  // If timeZone is UTC, the dateTime might not have 'Z' suffix
  const dt = dateTime.dateTime;
  const tz = dateTime.timeZone;

  // If already has timezone indicator (Z or +/-), parse directly
  if (dt.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dt)) {
    return new Date(dt);
  }

  // If timezone is UTC, append Z
  if (tz === "UTC" || tz === "Etc/UTC") {
    return new Date(dt + "Z");
  }

  // For other timezones, the datetime is local to that timezone
  // We'll parse it as-is and let JavaScript handle it
  // This isn't perfect but handles most cases
  return new Date(dt);
}
