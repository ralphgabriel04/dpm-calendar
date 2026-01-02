import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  listEvents as listGoogleEvents,
  refreshAccessToken as refreshGoogleToken,
  listCalendars as listGoogleCalendars,
  type GoogleEvent,
} from "@/lib/google/calendar";
import {
  listEvents as listMicrosoftEvents,
  refreshAccessToken as refreshMicrosoftToken,
  listCalendars as listMicrosoftCalendars,
  type MicrosoftEvent,
} from "@/lib/microsoft/calendar";

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

  // Resolve conflict
  resolveConflict: protectedProcedure
    .input(
      z.object({
        conflictId: z.string(),
        resolution: z.enum(["USE_LOCAL", "USE_REMOTE", "MERGE", "SKIP"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conflict = await ctx.db.syncConflict.findFirst({
        where: {
          id: input.conflictId,
          calendarAccount: { userId: ctx.session.user.id },
        },
      });

      if (!conflict) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

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
  triggerSync: protectedProcedure
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
      let errorMessage: string | null = null;

      try {
        // Check if token needs refresh
        let accessToken = account.accessToken;
        if (account.expiresAt && account.expiresAt < new Date()) {
          if (!account.refreshToken) {
            throw new Error("No refresh token available");
          }

          const newTokens = account.provider === "GOOGLE"
            ? await refreshGoogleToken(account.refreshToken)
            : await refreshMicrosoftToken(account.refreshToken);
          accessToken = newTokens.accessToken;

          await ctx.db.calendarAccount.update({
            where: { id: account.id },
            data: {
              accessToken: newTokens.accessToken,
              expiresAt: newTokens.expiryDate
                ? new Date(newTokens.expiryDate)
                : null,
            },
          });
        }

        // Sync each calendar
        for (const calendar of account.calendars) {
          if (!calendar.externalId) continue;

          try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const ninetyDaysAhead = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

            if (account.provider === "GOOGLE") {
              // Fetch events from Google
              const { events: googleEvents, nextSyncToken } = await listGoogleEvents(
                accessToken,
                calendar.externalId,
                {
                  timeMin: thirtyDaysAgo,
                  timeMax: ninetyDaysAhead,
                  syncToken: account.syncToken || undefined,
                }
              );

              // Process each event
              for (const googleEvent of googleEvents) {
                try {
                  await syncGoogleEvent(ctx.db, calendar.id, ctx.session.user.id, googleEvent);
                  itemsProcessed++;
                } catch (eventError) {
                  console.error("Error syncing event:", eventError);
                  itemsFailed++;
                }
              }

              // Save sync token
              if (nextSyncToken) {
                await ctx.db.calendarAccount.update({
                  where: { id: account.id },
                  data: { syncToken: nextSyncToken },
                });
              }
            } else if (account.provider === "MICROSOFT") {
              // Fetch events from Microsoft
              const { events: msEvents, deltaLink } = await listMicrosoftEvents(
                accessToken,
                calendar.externalId,
                {
                  startDateTime: thirtyDaysAgo,
                  endDateTime: ninetyDaysAhead,
                  deltaToken: account.syncToken || undefined,
                }
              );

              // Process each event
              for (const msEvent of msEvents) {
                try {
                  await syncMicrosoftEvent(ctx.db, calendar.id, ctx.session.user.id, msEvent);
                  itemsProcessed++;
                } catch (eventError) {
                  console.error("Error syncing event:", eventError);
                  itemsFailed++;
                }
              }

              // Save delta token
              if (deltaLink) {
                await ctx.db.calendarAccount.update({
                  where: { id: account.id },
                  data: { syncToken: deltaLink },
                });
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

      return { success: true, syncLogId: syncLog.id, itemsProcessed, itemsFailed };
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
  refreshGoogleCalendars: protectedProcedure
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
      let accessToken = account.accessToken;
      if (account.expiresAt && account.expiresAt < new Date()) {
        if (!account.refreshToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token expired and no refresh token available",
          });
        }
        const newTokens = await refreshGoogleToken(account.refreshToken);
        accessToken = newTokens.accessToken;

        await ctx.db.calendarAccount.update({
          where: { id: account.id },
          data: {
            accessToken: newTokens.accessToken,
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
  refreshMicrosoftCalendars: protectedProcedure
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
      let accessToken = account.accessToken;
      if (account.expiresAt && account.expiresAt < new Date()) {
        if (!account.refreshToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token expired and no refresh token available",
          });
        }
        const newTokens = await refreshMicrosoftToken(account.refreshToken);
        accessToken = newTokens.accessToken;

        await ctx.db.calendarAccount.update({
          where: { id: account.id },
          data: {
            accessToken: newTokens.accessToken,
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

// Helper function to sync a single Google event to local database
async function syncGoogleEvent(
  db: typeof import("@/server/db/client").db,
  calendarId: string,
  userId: string,
  googleEvent: GoogleEvent
) {
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

  // Check if event already exists
  const existingEvent = await db.event.findFirst({
    where: {
      calendarId,
      externalId: googleEvent.id,
    },
  });

  if (googleEvent.status === "cancelled") {
    // Delete cancelled events
    if (existingEvent) {
      await db.event.delete({ where: { id: existingEvent.id } });
    }
    return;
  }

  const eventData = {
    title: googleEvent.summary || "Sans titre",
    description: googleEvent.description,
    location: googleEvent.location,
    startAt,
    endAt,
    duration,
    isAllDay,
    etag: googleEvent.etag,
    provider: "GOOGLE" as const,
    syncStatus: "SYNCED" as const,
    lastSyncAt: new Date(),
  };

  if (existingEvent) {
    // Update existing event
    await db.event.update({
      where: { id: existingEvent.id },
      data: eventData,
    });
  } else {
    // Create new event
    await db.event.create({
      data: {
        ...eventData,
        userId,
        calendarId,
        externalId: googleEvent.id,
      },
    });
  }
}

// Helper function to sync a single Microsoft event to local database
async function syncMicrosoftEvent(
  db: typeof import("@/server/db/client").db,
  calendarId: string,
  userId: string,
  msEvent: MicrosoftEvent
) {
  const startAt = msEvent.start.dateTime
    ? new Date(msEvent.start.dateTime + (msEvent.start.timeZone === "UTC" ? "Z" : ""))
    : new Date();

  const endAt = msEvent.end.dateTime
    ? new Date(msEvent.end.dateTime + (msEvent.end.timeZone === "UTC" ? "Z" : ""))
    : new Date(startAt.getTime() + 60 * 60 * 1000);

  const isAllDay = msEvent.isAllDay || false;
  const duration = Math.round((endAt.getTime() - startAt.getTime()) / (1000 * 60));

  // Check if event already exists
  const existingEvent = await db.event.findFirst({
    where: {
      calendarId,
      externalId: msEvent.id,
    },
  });

  if (msEvent.isCancelled) {
    // Delete cancelled events
    if (existingEvent) {
      await db.event.delete({ where: { id: existingEvent.id } });
    }
    return;
  }

  const eventData = {
    title: msEvent.subject || "Sans titre",
    description: msEvent.bodyPreview,
    location: msEvent.location?.displayName,
    startAt,
    endAt,
    duration,
    isAllDay,
    etag: msEvent.changeKey,
    provider: "MICROSOFT" as const,
    syncStatus: "SYNCED" as const,
    lastSyncAt: new Date(),
  };

  if (existingEvent) {
    // Update existing event
    await db.event.update({
      where: { id: existingEvent.id },
      data: eventData,
    });
  } else {
    // Create new event
    await db.event.create({
      data: {
        ...eventData,
        userId,
        calendarId,
        externalId: msEvent.id,
      },
    });
  }
}
