import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";
import { parseIcs, type ParsedIcsEvent } from "@/lib/integrations/ics";
import {
  fetchTodoistTasks,
  todoistTaskToData,
} from "@/lib/integrations/todoist";
import {
  fetchTickTickTasks,
  tickTickTaskToData,
} from "@/lib/integrations/ticktick";
import {
  fetchNotionPages,
  notionPageToData,
} from "@/lib/integrations/notion";
import { encryptToken, decryptToken } from "@/lib/crypto";
import {
  getProviderRegistry,
} from "@/features/integrations/lib/registry";

/**
 * External calendar integrations (ICS import/subscribe, plus future OAuth
 * providers). All access is scoped to the authenticated user; tokens and
 * credentials are NEVER returned to the client.
 */

// A small, stable hash of an event's identity so we can detect changes on
// re-sync without storing the whole payload. Not cryptographic.
function simpleHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(16);
}

function eventHash(ev: ParsedIcsEvent): string {
  return simpleHash(`${ev.title}|${ev.startAt.toISOString()}`);
}

function durationMinutes(startAt: Date, endAt: Date): number {
  const ms = endAt.getTime() - startAt.getTime();
  return Math.max(0, Math.round(ms / 60000));
}

export const integrationRouter = createTRPCRouter({
  // Provider catalogue augmented with whether the caller has connected each one.
  providers: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    const registry = getProviderRegistry();
    const rows = await ctx.db.externalIntegration.findMany({
      where: { userId: uid },
      select: { provider: true },
    });
    const connected = new Set(rows.map((r) => r.provider));
    return registry.map((p) => ({
      ...p,
      connected: connected.has(p.provider),
    }));
  }),

  // The caller's integrations. Never selects token/credential fields.
  list: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    return ctx.db.externalIntegration.findMany({
      where: { userId: uid },
      select: {
        id: true,
        provider: true,
        label: true,
        sourceUrl: true,
        isActive: true,
        lastSyncAt: true,
        lastError: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Import an ICS payload pasted/uploaded by the user as a one-shot.
  importIcsText: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        label: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const parsed = parseIcs(input.content);

      return ctx.db.$transaction(async (tx) => {
        const integration = await tx.externalIntegration.create({
          data: { userId: uid, provider: "ICS", label: input.label },
        });

        const calendarName = input.label ?? "ICS Import";
        let calendar = await tx.calendar.findFirst({
          where: { userId: uid, name: calendarName },
          select: { id: true },
        });
        if (!calendar) {
          calendar = await tx.calendar.create({
            data: { userId: uid, name: calendarName, color: "#888888" },
            select: { id: true },
          });
        }

        let imported = 0;
        for (const ev of parsed) {
          const event = await tx.event.create({
            data: {
              userId: uid,
              calendarId: calendar.id,
              title: ev.title,
              description: ev.description,
              location: ev.location,
              startAt: ev.startAt,
              endAt: ev.endAt,
              duration: durationMinutes(ev.startAt, ev.endAt),
              isAllDay: ev.isAllDay,
              rrule: ev.rrule ?? null,
              timezone: "UTC",
            },
            select: { id: true },
          });
          await tx.externalItem.create({
            data: {
              integrationId: integration.id,
              externalId: ev.uid,
              kind: "event",
              localEventId: event.id,
              hash: eventHash(ev),
            },
          });
          imported++;
        }

        await tx.externalIntegration.update({
          where: { id: integration.id },
          data: { lastSyncAt: new Date() },
        });

        await tx.integrationSyncRun.create({
          data: {
            integrationId: integration.id,
            direction: "PULL",
            status: "COMPLETED",
            itemsProcessed: imported,
            completedAt: new Date(),
          },
        });

        return { integrationId: integration.id, imported };
      });
    }),

  // Subscribe to a remote ICS URL. The actual fetch+import happens in syncNow.
  connectIcsUrl: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        label: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const integration = await ctx.db.externalIntegration.create({
        data: {
          userId: uid,
          provider: "ICS",
          sourceUrl: input.url,
          label: input.label,
        },
        select: { id: true },
      });
      return { integrationId: integration.id };
    }),

  // Connect a Todoist account via a personal API token (no OAuth app). The
  // token is validated by listing tasks, then stored encrypted, and the active
  // tasks are imported as DPM tasks.
  connectTodoist: protectedProcedure
    .input(
      z.object({
        apiToken: z.string().min(1),
        label: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;

      // Validate the token by listing tasks before persisting anything.
      let tasks;
      try {
        tasks = await fetchTodoistTasks(input.apiToken);
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "TODOIST_AUTH_FAILED",
        });
      }

      return ctx.db.$transaction(async (tx) => {
        const integration = await tx.externalIntegration.create({
          data: {
            userId: uid,
            provider: "TODOIST",
            label: input.label ?? "Todoist",
            accessToken: encryptToken(input.apiToken),
          },
        });

        let imported = 0;
        for (const task of tasks) {
          const createdTask = await tx.task.create({
            data: todoistTaskToData(task, uid),
          });
          await tx.externalItem.create({
            data: {
              integrationId: integration.id,
              externalId: task.id,
              kind: "task",
              localTaskId: createdTask.id,
              hash: task.content,
            },
          });
          imported++;
        }

        await tx.externalIntegration.update({
          where: { id: integration.id },
          data: { lastSyncAt: new Date() },
        });

        await tx.integrationSyncRun.create({
          data: {
            integrationId: integration.id,
            direction: "PULL",
            status: "COMPLETED",
            itemsProcessed: imported,
            completedAt: new Date(),
          },
        });

        return { integrationId: integration.id, imported };
      });
    }),

  // Pull the latest data for an integration. ICS-by-URL and Todoist are wired.
  syncNow: protectedProcedure
    .input(z.object({ integrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const integration = await ctx.db.externalIntegration.findFirst({
        where: { id: input.integrationId, userId: uid },
      });
      if (!integration) throw new TRPCError({ code: "NOT_FOUND" });

      // Todoist: re-pull tasks via the stored personal API token and upsert.
      if (integration.provider === "TODOIST") {
        if (!integration.accessToken) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "INTEGRATION_NOT_CONFIGURED",
          });
        }

        const token = decryptToken(integration.accessToken);
        let tasks;
        try {
          tasks = await fetchTodoistTasks(token);
        } catch (err) {
          const message = err instanceof Error ? err.message : "fetch failed";
          await ctx.db.externalIntegration.update({
            where: { id: integration.id },
            data: { lastError: message },
          });
          await ctx.db.integrationSyncRun.create({
            data: {
              integrationId: integration.id,
              direction: "PULL",
              status: "FAILED",
              itemsProcessed: 0,
              errorMessage: message,
            },
          });
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "TODOIST_FETCH_FAILED",
          });
        }

        let imported = 0;
        let updated = 0;
        for (const task of tasks) {
          const existing = await ctx.db.externalItem.findFirst({
            where: { integrationId: integration.id, externalId: task.id },
          });
          const taskData = todoistTaskToData(task, uid);

          if (existing?.localTaskId) {
            await ctx.db.task.update({
              where: { id: existing.localTaskId },
              data: taskData,
            });
            await ctx.db.externalItem.update({
              where: { id: existing.id },
              data: { hash: task.content },
            });
            updated++;
          } else {
            const createdTask = await ctx.db.task.create({ data: taskData });
            await ctx.db.externalItem.create({
              data: {
                integrationId: integration.id,
                externalId: task.id,
                kind: "task",
                localTaskId: createdTask.id,
                hash: task.content,
              },
            });
            imported++;
          }
        }

        await ctx.db.externalIntegration.update({
          where: { id: integration.id },
          data: { lastSyncAt: new Date(), lastError: null },
        });
        await ctx.db.integrationSyncRun.create({
          data: {
            integrationId: integration.id,
            direction: "PULL",
            status: "COMPLETED",
            itemsProcessed: imported + updated,
            completedAt: new Date(),
          },
        });

        return { imported, updated };
      }

      // TickTick: re-pull tasks via the stored OAuth token and upsert.
      if (integration.provider === "TICKTICK") {
        if (!integration.accessToken) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "INTEGRATION_NOT_CONFIGURED",
          });
        }

        const token = decryptToken(integration.accessToken);
        let tasks;
        try {
          tasks = await fetchTickTickTasks(token);
        } catch (err) {
          const message = err instanceof Error ? err.message : "fetch failed";
          await ctx.db.externalIntegration.update({
            where: { id: integration.id },
            data: { lastError: message },
          });
          await ctx.db.integrationSyncRun.create({
            data: {
              integrationId: integration.id,
              direction: "PULL",
              status: "FAILED",
              itemsProcessed: 0,
              errorMessage: message,
            },
          });
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "TICKTICK_FETCH_FAILED",
          });
        }

        let imported = 0;
        let updated = 0;
        for (const task of tasks) {
          const existing = await ctx.db.externalItem.findFirst({
            where: { integrationId: integration.id, externalId: task.id },
          });
          const taskData = tickTickTaskToData(task, uid);

          if (existing?.localTaskId) {
            await ctx.db.task.update({
              where: { id: existing.localTaskId },
              data: taskData,
            });
            await ctx.db.externalItem.update({
              where: { id: existing.id },
              data: { hash: task.title },
            });
            updated++;
          } else {
            const createdTask = await ctx.db.task.create({ data: taskData });
            await ctx.db.externalItem.create({
              data: {
                integrationId: integration.id,
                externalId: task.id,
                kind: "task",
                localTaskId: createdTask.id,
                hash: task.title,
              },
            });
            imported++;
          }
        }

        await ctx.db.externalIntegration.update({
          where: { id: integration.id },
          data: { lastSyncAt: new Date(), lastError: null },
        });
        await ctx.db.integrationSyncRun.create({
          data: {
            integrationId: integration.id,
            direction: "PULL",
            status: "COMPLETED",
            itemsProcessed: imported + updated,
            completedAt: new Date(),
          },
        });

        return { imported, updated };
      }

      // Notion: re-pull pages via the stored OAuth token and upsert as tasks.
      if (integration.provider === "NOTION") {
        if (!integration.accessToken) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "INTEGRATION_NOT_CONFIGURED",
          });
        }

        const token = decryptToken(integration.accessToken);
        let pages;
        try {
          pages = await fetchNotionPages(token);
        } catch (err) {
          const message = err instanceof Error ? err.message : "fetch failed";
          await ctx.db.externalIntegration.update({
            where: { id: integration.id },
            data: { lastError: message },
          });
          await ctx.db.integrationSyncRun.create({
            data: {
              integrationId: integration.id,
              direction: "PULL",
              status: "FAILED",
              itemsProcessed: 0,
              errorMessage: message,
            },
          });
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "NOTION_FETCH_FAILED",
          });
        }

        let imported = 0;
        let updated = 0;
        for (const page of pages) {
          const existing = await ctx.db.externalItem.findFirst({
            where: { integrationId: integration.id, externalId: page.id },
          });
          const taskData = notionPageToData(page, uid);

          if (existing?.localTaskId) {
            await ctx.db.task.update({
              where: { id: existing.localTaskId },
              data: taskData,
            });
            await ctx.db.externalItem.update({
              where: { id: existing.id },
              data: { hash: taskData.title },
            });
            updated++;
          } else {
            const createdTask = await ctx.db.task.create({ data: taskData });
            await ctx.db.externalItem.create({
              data: {
                integrationId: integration.id,
                externalId: page.id,
                kind: "task",
                localTaskId: createdTask.id,
                hash: taskData.title,
              },
            });
            imported++;
          }
        }

        await ctx.db.externalIntegration.update({
          where: { id: integration.id },
          data: { lastSyncAt: new Date(), lastError: null },
        });
        await ctx.db.integrationSyncRun.create({
          data: {
            integrationId: integration.id,
            direction: "PULL",
            status: "COMPLETED",
            itemsProcessed: imported + updated,
            completedAt: new Date(),
          },
        });

        return { imported, updated };
      }

      if (integration.provider === "CALDAV") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "INTEGRATION_NOT_CONFIGURED",
        });
      }

      if (integration.provider !== "ICS" || !integration.sourceUrl) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "INTEGRATION_NOT_CONFIGURED",
        });
      }

      // Fetch the remote calendar. On any failure record it and bail cleanly.
      let text: string;
      try {
        const res = await fetch(integration.sourceUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        text = await res.text();
      } catch (err) {
        const message = err instanceof Error ? err.message : "fetch failed";
        await ctx.db.externalIntegration.update({
          where: { id: integration.id },
          data: { lastError: message },
        });
        await ctx.db.integrationSyncRun.create({
          data: {
            integrationId: integration.id,
            direction: "PULL",
            status: "FAILED",
            itemsProcessed: 0,
            errorMessage: message,
          },
        });
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "ICS_FETCH_FAILED",
        });
      }

      const parsed = parseIcs(text);

      // Find-or-create the calendar these events land in.
      const calendarName = integration.label ?? "ICS Import";
      let calendar = await ctx.db.calendar.findFirst({
        where: { userId: uid, name: calendarName },
        select: { id: true },
      });
      if (!calendar) {
        calendar = await ctx.db.calendar.create({
          data: { userId: uid, name: calendarName, color: "#888888" },
          select: { id: true },
        });
      }

      let imported = 0;
      let updated = 0;
      for (const ev of parsed) {
        const existing = await ctx.db.externalItem.findFirst({
          where: { integrationId: integration.id, externalId: ev.uid },
        });
        const eventData = {
          title: ev.title,
          description: ev.description,
          location: ev.location,
          startAt: ev.startAt,
          endAt: ev.endAt,
          duration: durationMinutes(ev.startAt, ev.endAt),
          isAllDay: ev.isAllDay,
          rrule: ev.rrule ?? null,
          timezone: "UTC",
        };

        if (existing?.localEventId) {
          await ctx.db.event.update({
            where: { id: existing.localEventId },
            data: eventData,
          });
          await ctx.db.externalItem.update({
            where: { id: existing.id },
            data: { hash: eventHash(ev) },
          });
          updated++;
        } else {
          const event = await ctx.db.event.create({
            data: { userId: uid, calendarId: calendar.id, ...eventData },
            select: { id: true },
          });
          await ctx.db.externalItem.create({
            data: {
              integrationId: integration.id,
              externalId: ev.uid,
              kind: "event",
              localEventId: event.id,
              hash: eventHash(ev),
            },
          });
          imported++;
        }
      }

      await ctx.db.externalIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date(), lastError: null },
      });
      await ctx.db.integrationSyncRun.create({
        data: {
          integrationId: integration.id,
          direction: "PULL",
          status: "COMPLETED",
          itemsProcessed: imported + updated,
          completedAt: new Date(),
        },
      });

      return { imported, updated };
    }),

  // Remove an integration. Optionally delete the events it imported.
  disconnect: protectedProcedure
    .input(
      z.object({
        integrationId: z.string(),
        deleteImported: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const integration = await ctx.db.externalIntegration.findFirst({
        where: { id: input.integrationId, userId: uid },
        select: { id: true },
      });
      if (!integration) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.deleteImported) {
        const items = await ctx.db.externalItem.findMany({
          where: { integrationId: integration.id },
          select: { localEventId: true },
        });
        const eventIds = items
          .map((i) => i.localEventId)
          .filter((id): id is string => Boolean(id));
        if (eventIds.length) {
          await ctx.db.event.deleteMany({
            where: { id: { in: eventIds }, userId: uid },
          });
        }
      }

      // Cascade removes ExternalItems and IntegrationSyncRuns.
      await ctx.db.externalIntegration.delete({
        where: { id: integration.id },
      });
      return { ok: true };
    }),
});
