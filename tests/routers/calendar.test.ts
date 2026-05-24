import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createMockDb,
  createTestTRPC,
  createTestContext,
} from "../helpers/trpc-test-utils";

// Create fresh mock instances
const mockDb = createMockDb();

// Add calendar-specific mock methods
Object.assign(mockDb, {
  calendar: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  calendarSection: {
    findFirst: vi.fn(),
  },
});

// Setup mocks
vi.mock("@/infrastructure/db/client", () => ({
  db: mockDb,
}));

vi.mock("@/infrastructure/auth/config", () => ({
  auth: vi.fn(),
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
let calendarRouter: Awaited<
  typeof import("@/features/calendar/server/calendar.router")
>["calendarRouter"];

beforeAll(async () => {
  const module = await import("@/features/calendar/server/calendar.router");
  calendarRouter = module.calendarRouter;
});

// Helper to create caller
const createCaller = (userId: string | null = "user-1") => {
  const ctx = createTestContext(mockDb, userId);
  return calendarRouter.createCaller(ctx as never);
};

describe("calendarRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns existing calendars for user", async () => {
      // Arrange
      const mockCalendars = [
        { id: "cal-1", name: "Work", isDefault: true, userId: "user-1" },
        { id: "cal-2", name: "Personal", isDefault: false, userId: "user-1" },
      ];
      mockDb.calendar.findMany.mockResolvedValue(mockCalendars);

      const caller = createCaller();

      // Act
      const result = await caller.list();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Work");
    });

    it("creates default calendar when user has none", async () => {
      // Arrange
      mockDb.calendar.findMany.mockResolvedValue([]);
      mockDb.calendar.create.mockResolvedValue({
        id: "new-cal",
        name: "Mon Calendrier",
        color: "#3b82f6",
        isDefault: true,
        provider: "LOCAL",
      });

      const caller = createCaller();

      // Act
      const result = await caller.list();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Mon Calendrier");
      expect(result[0].isDefault).toBe(true);
      expect(mockDb.calendar.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          name: "Mon Calendrier",
          isDefault: true,
          provider: "LOCAL",
        }),
      });
    });
  });

  describe("get", () => {
    it("returns calendar when found and owned by user", async () => {
      // Arrange
      const mockCalendar = {
        id: "cal-1",
        name: "Work",
        color: "#3B82F6",
        isDefault: true,
        userId: "user-1",
      };
      mockDb.calendar.findFirst.mockResolvedValue(mockCalendar);

      const caller = createCaller();

      // Act
      const result = await caller.get({ id: "cal-1" });

      // Assert
      expect(result.id).toBe("cal-1");
      expect(result.name).toBe("Work");
    });

    it("throws NOT_FOUND when calendar does not exist", async () => {
      // Arrange
      mockDb.calendar.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(caller.get({ id: "non-existent" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("throws NOT_FOUND when calendar belongs to another user", async () => {
      // Arrange
      mockDb.calendar.findFirst.mockResolvedValue(null); // Auth filter returns null

      const caller = createCaller("user-1");

      // Act & Assert
      await expect(caller.get({ id: "other-user-cal" })).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe("create", () => {
    it("creates calendar with default values", async () => {
      // Arrange
      mockDb.calendar.create.mockResolvedValue({
        id: "new-cal",
        name: "New Calendar",
        color: "#3B82F6",
        isDefault: false,
        provider: "LOCAL",
      });

      const caller = createCaller();

      // Act
      const result = await caller.create({ name: "New Calendar" });

      // Assert
      expect(result.name).toBe("New Calendar");
      expect(mockDb.calendar.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "New Calendar",
          userId: "user-1",
          provider: "LOCAL",
        }),
      });
    });

    it("unsets other default calendars when creating new default", async () => {
      // Arrange
      mockDb.calendar.updateMany.mockResolvedValue({ count: 1 });
      mockDb.calendar.create.mockResolvedValue({
        id: "new-cal",
        name: "New Default",
        isDefault: true,
      });

      const caller = createCaller();

      // Act
      await caller.create({ name: "New Default", isDefault: true });

      // Assert
      expect(mockDb.calendar.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isDefault: true },
        data: { isDefault: false },
      });
    });

    it("creates calendar with custom color", async () => {
      // Arrange
      mockDb.calendar.create.mockResolvedValue({
        id: "new-cal",
        name: "Work",
        color: "#FF5733",
      });

      const caller = createCaller();

      // Act
      await caller.create({ name: "Work", color: "#FF5733" });

      // Assert
      expect(mockDb.calendar.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          color: "#FF5733",
        }),
      });
    });

    it("creates calendar in section when sectionId provided", async () => {
      // Arrange
      mockDb.calendarSection.findFirst.mockResolvedValue({
        id: "section-1",
        userId: "user-1",
      });
      mockDb.calendar.create.mockResolvedValue({
        id: "new-cal",
        sectionId: "section-1",
      });

      const caller = createCaller();

      // Act
      await caller.create({ name: "Work", sectionId: "section-1" });

      // Assert
      expect(mockDb.calendar.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sectionId: "section-1",
        }),
      });
    });

    it("throws NOT_FOUND when section does not exist", async () => {
      // Arrange
      mockDb.calendarSection.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.create({ name: "Work", sectionId: "non-existent" })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Section not found",
      });
    });
  });

  describe("update", () => {
    it("updates calendar name", async () => {
      // Arrange
      const existingCalendar = {
        id: "cal-1",
        name: "Old Name",
        userId: "user-1",
      };
      mockDb.calendar.findFirst.mockResolvedValue(existingCalendar);
      mockDb.calendar.update.mockResolvedValue({
        ...existingCalendar,
        name: "New Name",
      });

      const caller = createCaller();

      // Act
      const result = await caller.update({ id: "cal-1", name: "New Name" });

      // Assert
      expect(result.name).toBe("New Name");
    });

    it("updates calendar color", async () => {
      // Arrange
      const existingCalendar = {
        id: "cal-1",
        color: "#3B82F6",
        userId: "user-1",
      };
      mockDb.calendar.findFirst.mockResolvedValue(existingCalendar);
      mockDb.calendar.update.mockResolvedValue({
        ...existingCalendar,
        color: "#FF0000",
      });

      const caller = createCaller();

      // Act
      const result = await caller.update({ id: "cal-1", color: "#FF0000" });

      // Assert
      expect(result.color).toBe("#FF0000");
    });

    it("unsets other defaults when setting calendar as default", async () => {
      // Arrange
      const existingCalendar = {
        id: "cal-1",
        isDefault: false,
        userId: "user-1",
      };
      mockDb.calendar.findFirst.mockResolvedValue(existingCalendar);
      mockDb.calendar.updateMany.mockResolvedValue({ count: 1 });
      mockDb.calendar.update.mockResolvedValue({
        ...existingCalendar,
        isDefault: true,
      });

      const caller = createCaller();

      // Act
      await caller.update({ id: "cal-1", isDefault: true });

      // Assert
      expect(mockDb.calendar.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isDefault: true, id: { not: "cal-1" } },
        data: { isDefault: false },
      });
    });

    it("throws NOT_FOUND when calendar does not exist", async () => {
      // Arrange
      mockDb.calendar.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.update({ id: "non-existent", name: "New Name" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("updates visibility", async () => {
      // Arrange
      const existingCalendar = {
        id: "cal-1",
        isVisible: true,
        userId: "user-1",
      };
      mockDb.calendar.findFirst.mockResolvedValue(existingCalendar);
      mockDb.calendar.update.mockResolvedValue({
        ...existingCalendar,
        isVisible: false,
      });

      const caller = createCaller();

      // Act
      const result = await caller.update({ id: "cal-1", isVisible: false });

      // Assert
      expect(result.isVisible).toBe(false);
    });
  });

  describe("delete", () => {
    it("deletes non-default calendar", async () => {
      // Arrange
      const existingCalendar = {
        id: "cal-1",
        name: "Personal",
        isDefault: false,
        userId: "user-1",
      };
      mockDb.calendar.findFirst.mockResolvedValue(existingCalendar);
      mockDb.calendar.delete.mockResolvedValue(existingCalendar);

      const caller = createCaller();

      // Act
      const result = await caller.delete({ id: "cal-1" });

      // Assert
      expect(result.id).toBe("cal-1");
      expect(mockDb.calendar.delete).toHaveBeenCalledWith({
        where: { id: "cal-1" },
      });
    });

    it("throws BAD_REQUEST when trying to delete default calendar", async () => {
      // Arrange
      const defaultCalendar = {
        id: "cal-1",
        name: "Work",
        isDefault: true,
        userId: "user-1",
      };
      mockDb.calendar.findFirst.mockResolvedValue(defaultCalendar);

      const caller = createCaller();

      // Act & Assert
      await expect(caller.delete({ id: "cal-1" })).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Cannot delete the default calendar",
      });
    });

    it("throws NOT_FOUND when calendar does not exist", async () => {
      // Arrange
      mockDb.calendar.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.delete({ id: "non-existent" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("toggleVisibility", () => {
    it("toggles visible calendar to hidden", async () => {
      // Arrange
      const existingCalendar = {
        id: "cal-1",
        isVisible: true,
        userId: "user-1",
      };
      mockDb.calendar.findFirst.mockResolvedValue(existingCalendar);
      mockDb.calendar.update.mockResolvedValue({
        ...existingCalendar,
        isVisible: false,
      });

      const caller = createCaller();

      // Act
      const result = await caller.toggleVisibility({ id: "cal-1" });

      // Assert
      expect(result.isVisible).toBe(false);
      expect(mockDb.calendar.update).toHaveBeenCalledWith({
        where: { id: "cal-1" },
        data: { isVisible: false },
      });
    });

    it("toggles hidden calendar to visible", async () => {
      // Arrange
      const existingCalendar = {
        id: "cal-1",
        isVisible: false,
        userId: "user-1",
      };
      mockDb.calendar.findFirst.mockResolvedValue(existingCalendar);
      mockDb.calendar.update.mockResolvedValue({
        ...existingCalendar,
        isVisible: true,
      });

      const caller = createCaller();

      // Act
      const result = await caller.toggleVisibility({ id: "cal-1" });

      // Assert
      expect(result.isVisible).toBe(true);
      expect(mockDb.calendar.update).toHaveBeenCalledWith({
        where: { id: "cal-1" },
        data: { isVisible: true },
      });
    });

    it("throws NOT_FOUND when calendar does not exist", async () => {
      // Arrange
      mockDb.calendar.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.toggleVisibility({ id: "non-existent" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
