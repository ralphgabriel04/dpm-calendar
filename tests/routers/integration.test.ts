import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import {
  createMockDb,
  createTestContext,
} from "../helpers/trpc-test-utils";

const mockDb = createMockDb();

// Augment the shared mock db with the tables this router touches.
Object.assign(mockDb, {
  externalIntegration: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  externalItem: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  integrationSyncRun: {
    create: vi.fn(),
  },
});
// Extend existing tables with the methods this router uses.
Object.assign(mockDb.event, { deleteMany: vi.fn(), create: vi.fn() });
Object.assign(mockDb.calendar, { findFirst: vi.fn(), create: vi.fn() });
// $transaction runs the callback against the same mock db.
Object.assign(mockDb, { $transaction: vi.fn((fn) => fn(mockDb)) });

// parseIcs is mocked; the registry is the real (env-based) implementation.
const parseIcsMock = vi.fn();
vi.mock("@/lib/integrations/ics", () => ({
  parseIcs: (...args: unknown[]) => parseIcsMock(...args),
}));

vi.mock("@/infrastructure/db/client", () => ({ db: mockDb }));
vi.mock("@/infrastructure/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 100 })),
}));
vi.mock("@/infrastructure/trpc/context", async () => {
  const { createTestTRPC } = await import("../helpers/trpc-test-utils");
  const { createTRPCRouter } = createTestTRPC();
  return { createTRPCRouter };
});
vi.mock("@/infrastructure/trpc/procedures", async () => {
  const { createTestTRPC } = await import("../helpers/trpc-test-utils");
  const { protectedProcedure, publicProcedure } = createTestTRPC();
  return { protectedProcedure, publicProcedure };
});

let integrationRouter: Awaited<
  typeof import("@/features/integrations/server/integration.router")
>["integrationRouter"];

beforeAll(async () => {
  integrationRouter = (
    await import("@/features/integrations/server/integration.router")
  ).integrationRouter;
});

const createCaller = (userId: string | null = "user-1") =>
  integrationRouter.createCaller(
    createTestContext(mockDb as never, userId) as never
  );

const icsFixture = [
  {
    uid: "evt-1",
    title: "Standup",
    description: "daily",
    location: "Zoom",
    startAt: new Date("2026-01-01T09:00:00Z"),
    endAt: new Date("2026-01-01T09:30:00Z"),
    isAllDay: false,
    rrule: "FREQ=DAILY",
  },
  {
    uid: "evt-2",
    title: "Review",
    startAt: new Date("2026-01-02T14:00:00Z"),
    endAt: new Date("2026-01-02T15:00:00Z"),
    isAllDay: false,
  },
];

describe("integrationRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("providers", () => {
    it("returns the 5 providers with configured + connected flags", async () => {
      (mockDb as any).externalIntegration.findMany.mockResolvedValue([
        { provider: "ICS" },
      ]);
      const result = await createCaller().providers();
      expect(result).toHaveLength(5);
      const ics = result.find((p) => p.provider === "ICS");
      const notion = result.find((p) => p.provider === "NOTION");
      expect(ics).toMatchObject({ configured: true, connected: true });
      // NOTION needs OAuth env vars (absent in test) and is not connected.
      expect(notion).toMatchObject({ connected: false });
      expect(typeof notion?.configured).toBe("boolean");
    });

    it("scopes the connection lookup to the caller", async () => {
      (mockDb as any).externalIntegration.findMany.mockResolvedValue([]);
      await createCaller().providers();
      expect(
        (mockDb as any).externalIntegration.findMany
      ).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        select: { provider: true },
      });
    });
  });

  describe("list", () => {
    it("never selects token / credential fields", async () => {
      (mockDb as any).externalIntegration.findMany.mockResolvedValue([]);
      await createCaller().list();
      const call = (mockDb as any).externalIntegration.findMany.mock
        .calls[0][0];
      expect(call.where).toEqual({ userId: "user-1" });
      // Explicit allowlist — no secrets.
      expect(call.select).not.toHaveProperty("accessToken");
      expect(call.select).not.toHaveProperty("refreshToken");
      expect(call.select).not.toHaveProperty("password");
      expect(call.select).toMatchObject({
        id: true,
        provider: true,
        sourceUrl: true,
        _count: { select: { items: true } },
      });
    });
  });

  describe("importIcsText", () => {
    it("creates the integration, events, items and a COMPLETED sync run", async () => {
      parseIcsMock.mockReturnValue(icsFixture);
      (mockDb as any).externalIntegration.create.mockResolvedValue({
        id: "int-1",
      });
      (mockDb as any).calendar.findFirst.mockResolvedValue(null);
      (mockDb as any).calendar.create.mockResolvedValue({ id: "cal-1" });
      (mockDb as any).event.create
        .mockResolvedValueOnce({ id: "ev-1" })
        .mockResolvedValueOnce({ id: "ev-2" });
      (mockDb as any).externalItem.create.mockResolvedValue({ id: "it" });
      (mockDb as any).externalIntegration.update.mockResolvedValue({});
      (mockDb as any).integrationSyncRun.create.mockResolvedValue({});

      const result = await createCaller().importIcsText({
        content: "BEGIN:VCALENDAR...",
        label: "Team",
      });

      expect(result).toEqual({ integrationId: "int-1", imported: 2 });
      expect((mockDb as any).event.create).toHaveBeenCalledTimes(2);
      expect((mockDb as any).externalItem.create).toHaveBeenCalledTimes(2);
      expect((mockDb as any).integrationSyncRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            integrationId: "int-1",
            direction: "PULL",
            status: "COMPLETED",
            itemsProcessed: 2,
          }),
        })
      );
    });

    it("creates events with a computed duration and the event uid as externalId", async () => {
      parseIcsMock.mockReturnValue([icsFixture[0]]);
      (mockDb as any).externalIntegration.create.mockResolvedValue({
        id: "int-1",
      });
      (mockDb as any).calendar.findFirst.mockResolvedValue({ id: "cal-1" });
      (mockDb as any).event.create.mockResolvedValue({ id: "ev-1" });
      (mockDb as any).externalItem.create.mockResolvedValue({ id: "it" });

      await createCaller().importIcsText({ content: "x" });

      expect((mockDb as any).event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            calendarId: "cal-1",
            duration: 30,
            rrule: "FREQ=DAILY",
            userId: "user-1",
          }),
        })
      );
      expect((mockDb as any).externalItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            externalId: "evt-1",
            kind: "event",
            localEventId: "ev-1",
          }),
        })
      );
    });
  });

  describe("connectIcsUrl", () => {
    it("stores the source url and returns the new integration id", async () => {
      (mockDb as any).externalIntegration.create.mockResolvedValue({
        id: "int-9",
      });
      const result = await createCaller().connectIcsUrl({
        url: "https://example.com/cal.ics",
      });
      expect(result).toEqual({ integrationId: "int-9" });
      expect((mockDb as any).externalIntegration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            provider: "ICS",
            sourceUrl: "https://example.com/cal.ics",
            userId: "user-1",
          }),
        })
      );
    });
  });

  describe("syncNow", () => {
    it("throws PRECONDITION_FAILED for a TODOIST integration", async () => {
      (mockDb as any).externalIntegration.findFirst.mockResolvedValue({
        id: "int-1",
        provider: "TODOIST",
        sourceUrl: null,
      });
      await expect(
        createCaller().syncNow({ integrationId: "int-1" })
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    });

    it("throws NOT_FOUND when the integration is not the caller's", async () => {
      (mockDb as any).externalIntegration.findFirst.mockResolvedValue(null);
      await expect(
        createCaller().syncNow({ integrationId: "nope" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("imports new and updates existing ICS events from the remote url", async () => {
      (mockDb as any).externalIntegration.findFirst.mockResolvedValue({
        id: "int-1",
        provider: "ICS",
        sourceUrl: "https://example.com/cal.ics",
        label: "Team",
      });
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, text: async () => "ICS" });
      vi.stubGlobal("fetch", fetchMock);
      parseIcsMock.mockReturnValue(icsFixture);
      (mockDb as any).calendar.findFirst.mockResolvedValue({ id: "cal-1" });
      // evt-1 already exists, evt-2 is new.
      (mockDb as any).externalItem.findFirst
        .mockResolvedValueOnce({ id: "it-1", localEventId: "ev-1" })
        .mockResolvedValueOnce(null);
      (mockDb as any).event.update.mockResolvedValue({ id: "ev-1" });
      (mockDb as any).externalItem.update.mockResolvedValue({ id: "it-1" });
      (mockDb as any).event.create.mockResolvedValue({ id: "ev-2" });
      (mockDb as any).externalItem.create.mockResolvedValue({ id: "it-2" });

      const result = await createCaller().syncNow({ integrationId: "int-1" });

      expect(result).toEqual({ imported: 1, updated: 1 });
      expect((mockDb as any).event.update).toHaveBeenCalledTimes(1);
      expect((mockDb as any).event.create).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });

    it("records a FAILED run and throws when the fetch fails", async () => {
      (mockDb as any).externalIntegration.findFirst.mockResolvedValue({
        id: "int-1",
        provider: "ICS",
        sourceUrl: "https://example.com/cal.ics",
        label: null,
      });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("network down"))
      );
      await expect(
        createCaller().syncNow({ integrationId: "int-1" })
      ).rejects.toMatchObject({ code: "BAD_GATEWAY" });
      expect((mockDb as any).integrationSyncRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED" }),
        })
      );
      vi.unstubAllGlobals();
    });
  });

  describe("disconnect", () => {
    it("deletes the integration and its imported events when asked", async () => {
      (mockDb as any).externalIntegration.findFirst.mockResolvedValue({
        id: "int-1",
      });
      (mockDb as any).externalItem.findMany.mockResolvedValue([
        { localEventId: "ev-1" },
        { localEventId: "ev-2" },
        { localEventId: null },
      ]);
      (mockDb as any).event.deleteMany.mockResolvedValue({ count: 2 });
      (mockDb as any).externalIntegration.delete.mockResolvedValue({});

      const result = await createCaller().disconnect({
        integrationId: "int-1",
        deleteImported: true,
      });

      expect(result).toEqual({ ok: true });
      expect((mockDb as any).event.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["ev-1", "ev-2"] }, userId: "user-1" },
      });
      expect((mockDb as any).externalIntegration.delete).toHaveBeenCalledWith({
        where: { id: "int-1" },
      });
    });

    it("deletes only the integration when deleteImported is false", async () => {
      (mockDb as any).externalIntegration.findFirst.mockResolvedValue({
        id: "int-1",
      });
      (mockDb as any).externalIntegration.delete.mockResolvedValue({});

      await createCaller().disconnect({ integrationId: "int-1" });

      expect((mockDb as any).event.deleteMany).not.toHaveBeenCalled();
      expect((mockDb as any).externalIntegration.delete).toHaveBeenCalled();
    });

    it("throws NOT_FOUND for an integration the caller does not own", async () => {
      (mockDb as any).externalIntegration.findFirst.mockResolvedValue(null);
      await expect(
        createCaller().disconnect({ integrationId: "nope" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
