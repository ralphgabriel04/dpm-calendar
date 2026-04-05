import { NextRequest, NextResponse } from "next/server";
import { db } from "@/infrastructure/db/client";
import { encryptToken, decryptToken } from "@/lib/crypto";
import {
  listEvents as listGoogleEvents,
  refreshAccessToken as refreshGoogleToken,
  createEvent as createGoogleEvent,
  updateEvent as updateGoogleEvent,
  deleteEvent as deleteGoogleEvent,
} from "@/lib/google/calendar";
import {
  listEvents as listMicrosoftEvents,
  refreshAccessToken as refreshMicrosoftToken,
  createEvent as createMicrosoftEvent,
  updateEvent as updateMicrosoftEvent,
  deleteEvent as deleteMicrosoftEvent,
} from "@/lib/microsoft/calendar";

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// Vercel Cron endpoint for automatic calendar synchronization
// Configured via vercel.json to run every 5 minutes
export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: {
    accountId: string;
    email: string;
    provider: string;
    status: "success" | "skipped" | "failed";
    itemsProcessed?: number;
    error?: string;
  }[] = [];

  try {
    // Get all active accounts that need syncing
    const now = new Date();
    const accounts = await db.calendarAccount.findMany({
      where: {
        isActive: true,
      },
      include: {
        calendars: true,
      },
    });

    for (const account of accounts) {
      // Check if account needs sync based on syncInterval
      const lastSync = account.lastSyncAt;
      const syncIntervalMs = (account.syncInterval || 15) * 60 * 1000;

      if (lastSync && now.getTime() - lastSync.getTime() < syncIntervalMs) {
        results.push({
          accountId: account.id,
          email: account.email,
          provider: account.provider,
          status: "skipped",
        });
        continue;
      }

      try {
        // Refresh token if needed
        let accessToken = decryptToken(account.accessToken);
        if (account.expiresAt && account.expiresAt < now) {
          if (!account.refreshToken) {
            throw new Error("No refresh token available");
          }

          const refreshToken = decryptToken(account.refreshToken);
          const newTokens =
            account.provider === "GOOGLE"
              ? await refreshGoogleToken(refreshToken)
              : await refreshMicrosoftToken(refreshToken);

          accessToken = newTokens.accessToken;

          await db.calendarAccount.update({
            where: { id: account.id },
            data: {
              accessToken: encryptToken(newTokens.accessToken),
              refreshToken: newTokens.refreshToken
                ? encryptToken(newTokens.refreshToken)
                : account.refreshToken,
              expiresAt: newTokens.expiryDate
                ? new Date(newTokens.expiryDate)
                : null,
            },
          });
        }

        let totalProcessed = 0;

        // Sync each calendar
        for (const calendar of account.calendars) {
          if (!calendar.externalId) continue;

          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const ninetyDaysAhead = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

          // PULL: Fetch from external calendar
          if (account.syncDirection === "PULL" || account.syncDirection === "FULL") {
            if (account.provider === "GOOGLE") {
              const { events, nextSyncToken } = await listGoogleEvents(
                accessToken,
                calendar.externalId,
                {
                  timeMin: thirtyDaysAgo,
                  timeMax: ninetyDaysAhead,
                  syncToken: account.syncToken || undefined,
                }
              );

              for (const event of events) {
                await syncGoogleEventToLocal(db, calendar.id, account.userId, event);
                totalProcessed++;
              }

              if (nextSyncToken) {
                await db.calendarAccount.update({
                  where: { id: account.id },
                  data: { syncToken: nextSyncToken },
                });
              }
            } else if (account.provider === "MICROSOFT") {
              const { events, deltaLink } = await listMicrosoftEvents(
                accessToken,
                calendar.externalId,
                {
                  startDateTime: thirtyDaysAgo,
                  endDateTime: ninetyDaysAhead,
                  deltaToken: account.syncToken || undefined,
                }
              );

              for (const event of events) {
                await syncMicrosoftEventToLocal(db, calendar.id, account.userId, event);
                totalProcessed++;
              }

              if (deltaLink) {
                await db.calendarAccount.update({
                  where: { id: account.id },
                  data: { syncToken: deltaLink },
                });
              }
            }
          }

          // PUSH: Send to external calendar
          if (account.syncDirection === "PUSH" || account.syncDirection === "FULL") {
            const pendingEvents = await db.event.findMany({
              where: {
                calendarId: calendar.id,
                syncStatus: "PENDING_PUSH",
                provider: account.provider,
              },
            });

            for (const event of pendingEvents) {
              try {
                if (account.provider === "GOOGLE") {
                  await pushEventToGoogle(db, accessToken, calendar.externalId!, event);
                } else {
                  await pushEventToMicrosoft(db, accessToken, calendar.externalId!, event);
                }
                totalProcessed++;
              } catch (pushError) {
                console.error("Push error:", pushError);
                await db.event.update({
                  where: { id: event.id },
                  data: { syncStatus: "ERROR" },
                });
              }
            }
          }
        }

        // Update last sync timestamp
        await db.calendarAccount.update({
          where: { id: account.id },
          data: { lastSyncAt: now, lastError: null },
        });

        // Log sync
        await db.syncLog.create({
          data: {
            calendarAccountId: account.id,
            direction: account.syncDirection,
            status: "COMPLETED",
            itemsProcessed: totalProcessed,
            completedAt: new Date(),
          },
        });

        results.push({
          accountId: account.id,
          email: account.email,
          provider: account.provider,
          status: "success",
          itemsProcessed: totalProcessed,
        });
      } catch (accountError) {
        const errorMessage = accountError instanceof Error ? accountError.message : "Unknown error";

        await db.calendarAccount.update({
          where: { id: account.id },
          data: { lastError: errorMessage },
        });

        await db.syncLog.create({
          data: {
            calendarAccountId: account.id,
            direction: account.syncDirection,
            status: "FAILED",
            errorMessage,
            completedAt: new Date(),
          },
        });

        results.push({
          accountId: account.id,
          email: account.email,
          provider: account.provider,
          status: "failed",
          error: errorMessage,
        });
      }
    }

    const duration = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      results,
      summary: {
        total: results.length,
        success: results.filter((r) => r.status === "success").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        failed: results.filter((r) => r.status === "failed").length,
      },
    });
  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper functions for sync operations
async function syncGoogleEventToLocal(
  prisma: typeof db,
  calendarId: string,
  userId: string,
  googleEvent: Awaited<ReturnType<typeof listGoogleEvents>>["events"][0]
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

  const existing = await prisma.event.findFirst({
    where: { calendarId, externalId: googleEvent.id },
  });

  if (googleEvent.status === "cancelled") {
    if (existing) {
      await prisma.event.delete({ where: { id: existing.id } });
    }
    return;
  }

  const data = {
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

  if (existing) {
    await prisma.event.update({ where: { id: existing.id }, data });
  } else {
    await prisma.event.create({
      data: { ...data, userId, calendarId, externalId: googleEvent.id },
    });
  }
}

async function syncMicrosoftEventToLocal(
  prisma: typeof db,
  calendarId: string,
  userId: string,
  msEvent: Awaited<ReturnType<typeof listMicrosoftEvents>>["events"][0]
) {
  const startAt = msEvent.start.dateTime ? new Date(msEvent.start.dateTime) : new Date();
  const endAt = msEvent.end.dateTime
    ? new Date(msEvent.end.dateTime)
    : new Date(startAt.getTime() + 60 * 60 * 1000);

  const isAllDay = msEvent.isAllDay || false;
  const duration = Math.round((endAt.getTime() - startAt.getTime()) / (1000 * 60));

  const existing = await prisma.event.findFirst({
    where: { calendarId, externalId: msEvent.id },
  });

  if (msEvent.isCancelled) {
    if (existing) {
      await prisma.event.delete({ where: { id: existing.id } });
    }
    return;
  }

  const data = {
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

  if (existing) {
    await prisma.event.update({ where: { id: existing.id }, data });
  } else {
    await prisma.event.create({
      data: { ...data, userId, calendarId, externalId: msEvent.id },
    });
  }
}

async function pushEventToGoogle(
  prisma: typeof db,
  accessToken: string,
  calendarExternalId: string,
  event: { id: string; externalId: string | null; title: string; description: string | null; location: string | null; startAt: Date; endAt: Date; isAllDay: boolean; status: string; rrule: string | null }
) {
  if (event.status === "CANCELLED") {
    if (event.externalId) {
      await deleteGoogleEvent(accessToken, calendarExternalId, event.externalId);
    }
    await prisma.event.delete({ where: { id: event.id } });
  } else if (event.externalId) {
    const updated = await updateGoogleEvent(accessToken, calendarExternalId, event.externalId, {
      summary: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      start: event.startAt,
      end: event.endAt,
      isAllDay: event.isAllDay,
      recurrence: event.rrule ? [event.rrule] : undefined,
    });
    await prisma.event.update({
      where: { id: event.id },
      data: { etag: updated.etag, syncStatus: "SYNCED", lastSyncAt: new Date() },
    });
  } else {
    const created = await createGoogleEvent(accessToken, calendarExternalId, {
      summary: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      start: event.startAt,
      end: event.endAt,
      isAllDay: event.isAllDay,
      recurrence: event.rrule ? [event.rrule] : undefined,
    });
    await prisma.event.update({
      where: { id: event.id },
      data: { externalId: created.id, etag: created.etag, syncStatus: "SYNCED", lastSyncAt: new Date() },
    });
  }
}

async function pushEventToMicrosoft(
  prisma: typeof db,
  accessToken: string,
  calendarExternalId: string,
  event: { id: string; externalId: string | null; title: string; description: string | null; location: string | null; startAt: Date; endAt: Date; isAllDay: boolean; status: string; timezone: string }
) {
  if (event.status === "CANCELLED") {
    if (event.externalId) {
      await deleteMicrosoftEvent(accessToken, calendarExternalId, event.externalId);
    }
    await prisma.event.delete({ where: { id: event.id } });
  } else if (event.externalId) {
    const updated = await updateMicrosoftEvent(accessToken, calendarExternalId, event.externalId, {
      subject: event.title,
      body: event.description || undefined,
      location: event.location || undefined,
      start: event.startAt,
      end: event.endAt,
      isAllDay: event.isAllDay,
      timeZone: event.timezone || "UTC",
    });
    await prisma.event.update({
      where: { id: event.id },
      data: { etag: updated.changeKey, syncStatus: "SYNCED", lastSyncAt: new Date() },
    });
  } else {
    const created = await createMicrosoftEvent(accessToken, calendarExternalId, {
      subject: event.title,
      body: event.description || undefined,
      location: event.location || undefined,
      start: event.startAt,
      end: event.endAt,
      isAllDay: event.isAllDay,
      timeZone: event.timezone || "UTC",
    });
    await prisma.event.update({
      where: { id: event.id },
      data: { externalId: created.id, etag: created.changeKey, syncStatus: "SYNCED", lastSyncAt: new Date() },
    });
  }
}
