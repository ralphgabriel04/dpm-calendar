import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createMockDb,
  createTestTRPC,
  createTestContext,
  type MockDb,
} from "../helpers/trpc-test-utils";

// Create fresh mock instances
const mockDb = createMockDb();
const { createTRPCRouter, protectedProcedure } = createTestTRPC();

// Setup all mocks before anything else
vi.mock("@/infrastructure/db/client", () => ({
  db: mockDb,
}));

vi.mock("@/infrastructure/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/calendar/recurrence", () => ({
  expandRecurringEvents: vi.fn((events: unknown[]) =>
    events.map((e) => ({
      ...(e as Record<string, unknown>),
      isRecurrenceInstance: false,
    }))
  ),
}));

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

// Import router after mocks are set up
let eventRouter: Awaited<typeof import("@/features/calendar/server/event.router")>["eventRouter"];

beforeAll(async () => {
  const module = await import("@/features/calendar/server/event.router");
  eventRouter = module.eventRouter;
});

// Helper to create caller
const createCaller = (userId: string | null = "user-1") => {
  const ctx = createTestContext(mockDb, userId);
  return eventRouter.createCaller(ctx as never);
};

describe("eventRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns empty array when user has no calendars", async () => {
      // Arrange
      mockDb.calendar.findMany.mockResolvedValue([]);
      const caller = createCaller();

      // Act
      const result = await caller.list({
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });

      // Assert
      expect(result).toEqual([]);
      expect(mockDb.event.findMany).not.toHaveBeenCalled();
    });

    it("returns events from visible calendars within date range", async () => {
      // Arrange
      const mockCalendar = { id: "cal-1", userId: "user-1", isVisible: true };
      const mockEvent = {
        id: "evt-1",
        title: "Meeting",
        description: "Team sync",
        location: "Room A",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:00:00Z"),
        isAllDay: false,
        color: "#3B82F6",
        calendarId: "cal-1",
        rrule: null,
        parentEventId: null,
        duration: 60,
        calendar: { color: "#3B82F6", name: "Work" },
      };

      mockDb.calendar.findMany.mockResolvedValue([mockCalendar]);
      mockDb.event.findMany.mockResolvedValue([mockEvent]);

      const caller = createCaller();

      // Act
      const result = await caller.list({
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Meeting");
      expect(result[0].calendarId).toBe("cal-1");
    });

    it("filters events by specified calendarIds", async () => {
      // Arrange
      const mockCalendars = [
        { id: "cal-1", userId: "user-1" },
        { id: "cal-2", userId: "user-1" },
      ];
      mockDb.calendar.findMany.mockResolvedValue(mockCalendars);
      mockDb.event.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      await caller.list({
        calendarIds: ["cal-1", "cal-2"],
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });

      // Assert
      expect(mockDb.calendar.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["cal-1", "cal-2"] }, userId: "user-1" },
      });
    });
  });

  describe("get", () => {
    it("returns event when found and owned by user", async () => {
      // Arrange
      const mockEvent = {
        id: "evt-1",
        title: "Meeting",
        userId: "user-1",
        calendar: { id: "cal-1", name: "Work" },
        tasks: [],
        parentEvent: null,
      };
      mockDb.event.findFirst.mockResolvedValue(mockEvent);

      const caller = createCaller();

      // Act
      const result = await caller.get({ id: "evt-1" });

      // Assert
      expect(result.id).toBe("evt-1");
      expect(result.title).toBe("Meeting");
    });

    it("throws NOT_FOUND when event does not exist", async () => {
      // Arrange
      mockDb.event.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(caller.get({ id: "non-existent" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("throws NOT_FOUND when event belongs to another user", async () => {
      // Arrange - findFirst with userId filter returns null for other user's event
      mockDb.event.findFirst.mockResolvedValue(null);

      const caller = createCaller("user-1");

      // Act & Assert
      await expect(caller.get({ id: "evt-other-user" })).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe("create", () => {
    it("creates event with calculated duration", async () => {
      // Arrange
      const mockCalendar = {
        id: "cal-1",
        userId: "user-1",
        provider: "LOCAL",
      };
      const mockCreatedEvent = {
        id: "evt-new",
        title: "New Meeting",
        calendarId: "cal-1",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:30:00Z"),
        duration: 90,
        provider: "LOCAL",
        syncStatus: "SYNCED",
      };

      mockDb.calendar.findFirst.mockResolvedValue(mockCalendar);
      mockDb.event.create.mockResolvedValue(mockCreatedEvent);

      const caller = createCaller();

      // Act
      const result = await caller.create({
        calendarId: "cal-1",
        title: "New Meeting",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:30:00Z"),
      });

      // Assert
      expect(result.duration).toBe(90);
      expect(mockDb.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            duration: 90,
            syncStatus: "SYNCED",
          }),
        })
      );
    });

    it("sets syncStatus to PENDING_PUSH for external calendars", async () => {
      // Arrange
      const mockCalendar = {
        id: "cal-1",
        userId: "user-1",
        provider: "GOOGLE",
      };
      mockDb.calendar.findFirst.mockResolvedValue(mockCalendar);
      mockDb.event.create.mockResolvedValue({
        id: "evt-new",
        syncStatus: "PENDING_PUSH",
      });

      const caller = createCaller();

      // Act
      await caller.create({
        calendarId: "cal-1",
        title: "Google Meeting",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:00:00Z"),
      });

      // Assert
      expect(mockDb.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            syncStatus: "PENDING_PUSH",
          }),
        })
      );
    });

    it("throws NOT_FOUND when calendar does not exist", async () => {
      // Arrange
      mockDb.calendar.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.create({
          calendarId: "non-existent",
          title: "Meeting",
          startAt: new Date("2024-01-15T10:00:00Z"),
          endAt: new Date("2024-01-15T11:00:00Z"),
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Calendar not found",
      });
    });

    it("creates all-day event with correct duration", async () => {
      // Arrange
      const mockCalendar = { id: "cal-1", userId: "user-1", provider: "LOCAL" };
      mockDb.calendar.findFirst.mockResolvedValue(mockCalendar);
      mockDb.event.create.mockResolvedValue({
        id: "evt-allday",
        isAllDay: true,
        duration: 1440,
      });

      const caller = createCaller();

      // Act
      const startDate = new Date("2024-01-15T00:00:00Z");
      const endDate = new Date("2024-01-16T00:00:00Z");
      await caller.create({
        calendarId: "cal-1",
        title: "All Day Event",
        startAt: startDate,
        endAt: endDate,
        isAllDay: true,
      });

      // Assert
      expect(mockDb.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            duration: 1440,
            isAllDay: true,
          }),
        })
      );
    });
  });

  describe("update", () => {
    it("updates event and recalculates duration when times change", async () => {
      // Arrange
      const existingEvent = {
        id: "evt-1",
        title: "Old Title",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:00:00Z"),
        duration: 60,
        calendar: { provider: "LOCAL" },
      };
      mockDb.event.findFirst.mockResolvedValue(existingEvent);
      mockDb.event.update.mockResolvedValue({
        ...existingEvent,
        endAt: new Date("2024-01-15T12:00:00Z"),
        duration: 120,
      });

      const caller = createCaller();

      // Act
      const result = await caller.update({
        id: "evt-1",
        endAt: new Date("2024-01-15T12:00:00Z"),
      });

      // Assert
      expect(result.duration).toBe(120);
      expect(mockDb.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            duration: 120,
          }),
        })
      );
    });

    it("preserves duration when times are not changed", async () => {
      // Arrange
      const existingEvent = {
        id: "evt-1",
        title: "Meeting",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:00:00Z"),
        duration: 60,
        calendar: { provider: "LOCAL" },
      };
      mockDb.event.findFirst.mockResolvedValue(existingEvent);
      mockDb.event.update.mockResolvedValue({
        ...existingEvent,
        title: "Updated Title",
      });

      const caller = createCaller();

      // Act
      await caller.update({
        id: "evt-1",
        title: "Updated Title",
      });

      // Assert
      expect(mockDb.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            duration: 60,
          }),
        })
      );
    });

    it("throws NOT_FOUND when event does not exist", async () => {
      // Arrange
      mockDb.event.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.update({ id: "non-existent", title: "New Title" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("sets syncStatus to PENDING_PUSH for external calendar events", async () => {
      // Arrange
      const existingEvent = {
        id: "evt-1",
        title: "Google Meeting",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:00:00Z"),
        duration: 60,
        calendar: { provider: "GOOGLE" },
      };
      mockDb.event.findFirst.mockResolvedValue(existingEvent);
      mockDb.event.update.mockResolvedValue({
        ...existingEvent,
        syncStatus: "PENDING_PUSH",
      });

      const caller = createCaller();

      // Act
      await caller.update({ id: "evt-1", title: "Updated" });

      // Assert
      expect(mockDb.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            syncStatus: "PENDING_PUSH",
          }),
        })
      );
    });
  });

  describe("delete", () => {
    it("soft deletes event by setting status to CANCELLED", async () => {
      // Arrange
      const existingEvent = {
        id: "evt-1",
        title: "Meeting",
        calendar: { provider: "LOCAL" },
      };
      mockDb.event.findFirst.mockResolvedValue(existingEvent);
      mockDb.event.update.mockResolvedValue({
        ...existingEvent,
        status: "CANCELLED",
      });

      const caller = createCaller();

      // Act
      const result = await caller.delete({ id: "evt-1" });

      // Assert
      expect(result.success).toBe(true);
      expect(mockDb.event.update).toHaveBeenCalledWith({
        where: { id: "evt-1" },
        data: expect.objectContaining({
          status: "CANCELLED",
        }),
      });
    });

    it("throws NOT_FOUND when event does not exist", async () => {
      // Arrange
      mockDb.event.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(caller.delete({ id: "non-existent" })).rejects.toMatchObject(
        { code: "NOT_FOUND" }
      );
    });

    it("sets syncStatus to PENDING_PUSH for external calendar events", async () => {
      // Arrange
      const existingEvent = {
        id: "evt-1",
        calendar: { provider: "OUTLOOK" },
      };
      mockDb.event.findFirst.mockResolvedValue(existingEvent);
      mockDb.event.update.mockResolvedValue({});

      const caller = createCaller();

      // Act
      await caller.delete({ id: "evt-1" });

      // Assert
      expect(mockDb.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            syncStatus: "PENDING_PUSH",
          }),
        })
      );
    });
  });

  describe("move", () => {
    it("updates event times and recalculates duration", async () => {
      // Arrange
      const existingEvent = {
        id: "evt-1",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:00:00Z"),
        duration: 60,
      };
      mockDb.event.findFirst.mockResolvedValue(existingEvent);
      mockDb.event.update.mockResolvedValue({
        ...existingEvent,
        startAt: new Date("2024-01-16T14:00:00Z"),
        endAt: new Date("2024-01-16T15:30:00Z"),
        duration: 90,
      });

      const caller = createCaller();

      // Act
      const result = await caller.move({
        id: "evt-1",
        startAt: new Date("2024-01-16T14:00:00Z"),
        endAt: new Date("2024-01-16T15:30:00Z"),
      });

      // Assert
      expect(result.duration).toBe(90);
      expect(mockDb.event.update).toHaveBeenCalledWith({
        where: { id: "evt-1" },
        data: expect.objectContaining({
          startAt: new Date("2024-01-16T14:00:00Z"),
          endAt: new Date("2024-01-16T15:30:00Z"),
          duration: 90,
          syncStatus: "PENDING_PUSH",
        }),
      });
    });

    it("updates calendarId when moving to different calendar", async () => {
      // Arrange
      const existingEvent = {
        id: "evt-1",
        calendarId: "cal-1",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:00:00Z"),
      };
      mockDb.event.findFirst.mockResolvedValue(existingEvent);
      mockDb.event.update.mockResolvedValue({
        ...existingEvent,
        calendarId: "cal-2",
      });

      const caller = createCaller();

      // Act
      await caller.move({
        id: "evt-1",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:00:00Z"),
        calendarId: "cal-2",
      });

      // Assert
      expect(mockDb.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            calendarId: "cal-2",
          }),
        })
      );
    });

    it("throws NOT_FOUND when event does not exist", async () => {
      // Arrange
      mockDb.event.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.move({
          id: "non-existent",
          startAt: new Date("2024-01-15T10:00:00Z"),
          endAt: new Date("2024-01-15T11:00:00Z"),
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
