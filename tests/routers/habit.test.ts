import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createMockDb,
  createTestTRPC,
  createTestContext,
} from "../helpers/trpc-test-utils";

// Create fresh mock instances
const mockDb = createMockDb();

// Add habit-specific mock methods
Object.assign(mockDb, {
  habit: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  habitLog: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    upsert: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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
let habitRouter: Awaited<
  typeof import("@/features/habits/server/habit.router")
>["habitRouter"];

beforeAll(async () => {
  const module = await import("@/features/habits/server/habit.router");
  habitRouter = module.habitRouter;
});

// Helper to create caller
const createCaller = (userId: string | null = "user-1") => {
  const ctx = createTestContext(mockDb, userId);
  return habitRouter.createCaller(ctx as never);
};

describe("habitRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns habits for authenticated user", async () => {
      // Arrange
      const mockHabits = [
        {
          id: "habit-1",
          name: "Exercise",
          isActive: true,
          userId: "user-1",
          goal: null,
          logs: [],
        },
        {
          id: "habit-2",
          name: "Read",
          isActive: true,
          userId: "user-1",
          goal: null,
          logs: [],
        },
      ];
      mockDb.habit.findMany.mockResolvedValue(mockHabits);

      const caller = createCaller();

      // Act
      const result = await caller.list({});

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Exercise");
    });

    it("filters habits by isActive status", async () => {
      // Arrange
      mockDb.habit.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      await caller.list({ isActive: true });

      // Assert
      expect(mockDb.habit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it("filters habits by goalId", async () => {
      // Arrange
      mockDb.habit.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      await caller.list({ goalId: "goal-1" });

      // Assert
      expect(mockDb.habit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            goalId: "goal-1",
          }),
        })
      );
    });

    it("includes recent logs in response", async () => {
      // Arrange
      const mockHabit = {
        id: "habit-1",
        name: "Exercise",
        logs: [
          { id: "log-1", date: new Date(), completed: true },
          { id: "log-2", date: new Date(), completed: false },
        ],
      };
      mockDb.habit.findMany.mockResolvedValue([mockHabit]);

      const caller = createCaller();

      // Act
      const result = await caller.list({});

      // Assert
      expect(result[0].logs).toHaveLength(2);
    });
  });

  describe("get", () => {
    it("returns habit with logs when found", async () => {
      // Arrange
      const mockHabit = {
        id: "habit-1",
        name: "Exercise",
        userId: "user-1",
        goal: { id: "goal-1", title: "Get Fit" },
        logs: [
          { id: "log-1", completed: true, date: new Date() },
        ],
      };
      mockDb.habit.findFirst.mockResolvedValue(mockHabit);

      const caller = createCaller();

      // Act
      const result = await caller.get({ id: "habit-1" });

      // Assert
      expect(result.id).toBe("habit-1");
      expect(result.name).toBe("Exercise");
      expect(result.logs).toHaveLength(1);
    });

    it("throws NOT_FOUND when habit does not exist", async () => {
      // Arrange
      mockDb.habit.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(caller.get({ id: "non-existent" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("throws NOT_FOUND when habit belongs to another user", async () => {
      // Arrange
      mockDb.habit.findFirst.mockResolvedValue(null); // Auth filter returns null

      const caller = createCaller("user-1");

      // Act & Assert
      await expect(caller.get({ id: "other-user-habit" })).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe("create", () => {
    it("creates habit with default values", async () => {
      // Arrange
      mockDb.habit.create.mockResolvedValue({
        id: "new-habit",
        name: "Meditate",
        habitType: "FLEXIBLE",
        frequency: "DAILY",
        targetCount: 1,
        isActive: true,
        userId: "user-1",
      });

      const caller = createCaller();

      // Act
      const result = await caller.create({ name: "Meditate" });

      // Assert
      expect(result.name).toBe("Meditate");
      expect(mockDb.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Meditate",
          userId: "user-1",
          habitType: "FLEXIBLE",
          frequency: "DAILY",
          targetCount: 1,
        }),
      });
    });

    it("creates habit with custom frequency and type", async () => {
      // Arrange
      mockDb.habit.create.mockResolvedValue({
        id: "new-habit",
        name: "Weekly Review",
        habitType: "FIXED",
        frequency: "WEEKLY",
        targetCount: 1,
      });

      const caller = createCaller();

      // Act
      await caller.create({
        name: "Weekly Review",
        habitType: "FIXED",
        frequency: "WEEKLY",
      });

      // Assert
      expect(mockDb.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          habitType: "FIXED",
          frequency: "WEEKLY",
        }),
      });
    });

    it("creates habit with preferred days", async () => {
      // Arrange
      mockDb.habit.create.mockResolvedValue({
        id: "new-habit",
        name: "Gym",
        preferredDays: [1, 3, 5], // Mon, Wed, Fri
      });

      const caller = createCaller();

      // Act
      await caller.create({
        name: "Gym",
        preferredDays: [1, 3, 5],
      });

      // Assert
      expect(mockDb.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          preferredDays: [1, 3, 5],
        }),
      });
    });

    it("creates habit linked to goal", async () => {
      // Arrange
      mockDb.habit.create.mockResolvedValue({
        id: "new-habit",
        name: "Exercise",
        goalId: "goal-1",
      });

      const caller = createCaller();

      // Act
      await caller.create({
        name: "Exercise",
        goalId: "goal-1",
      });

      // Assert
      expect(mockDb.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          goalId: "goal-1",
        }),
      });
    });
  });

  describe("update", () => {
    it("updates habit name", async () => {
      // Arrange
      const existingHabit = { id: "habit-1", name: "Old Name", userId: "user-1" };
      mockDb.habit.findFirst.mockResolvedValue(existingHabit);
      mockDb.habit.update.mockResolvedValue({
        ...existingHabit,
        name: "New Name",
      });

      const caller = createCaller();

      // Act
      const result = await caller.update({ id: "habit-1", name: "New Name" });

      // Assert
      expect(result.name).toBe("New Name");
    });

    it("deactivates habit", async () => {
      // Arrange
      const existingHabit = { id: "habit-1", isActive: true, userId: "user-1" };
      mockDb.habit.findFirst.mockResolvedValue(existingHabit);
      mockDb.habit.update.mockResolvedValue({
        ...existingHabit,
        isActive: false,
      });

      const caller = createCaller();

      // Act
      const result = await caller.update({ id: "habit-1", isActive: false });

      // Assert
      expect(result.isActive).toBe(false);
    });

    it("throws NOT_FOUND when habit does not exist", async () => {
      // Arrange
      mockDb.habit.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.update({ id: "non-existent", name: "New" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("unlinks habit from goal", async () => {
      // Arrange
      const existingHabit = { id: "habit-1", goalId: "goal-1", userId: "user-1" };
      mockDb.habit.findFirst.mockResolvedValue(existingHabit);
      mockDb.habit.update.mockResolvedValue({
        ...existingHabit,
        goalId: null,
      });

      const caller = createCaller();

      // Act
      await caller.update({ id: "habit-1", goalId: null });

      // Assert
      expect(mockDb.habit.update).toHaveBeenCalledWith({
        where: { id: "habit-1" },
        data: { goalId: null },
      });
    });
  });

  describe("delete", () => {
    it("deletes habit when found", async () => {
      // Arrange
      const existingHabit = { id: "habit-1", name: "Habit", userId: "user-1" };
      mockDb.habit.findFirst.mockResolvedValue(existingHabit);
      mockDb.habit.delete.mockResolvedValue(existingHabit);

      const caller = createCaller();

      // Act
      const result = await caller.delete({ id: "habit-1" });

      // Assert
      expect(result.id).toBe("habit-1");
      expect(mockDb.habit.delete).toHaveBeenCalledWith({
        where: { id: "habit-1" },
      });
    });

    it("throws NOT_FOUND when habit does not exist", async () => {
      // Arrange
      mockDb.habit.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.delete({ id: "non-existent" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("log", () => {
    it("logs habit completion for a date", async () => {
      // Arrange
      const today = new Date();
      mockDb.habit.findFirst.mockResolvedValue({
        id: "habit-1",
        userId: "user-1",
      });
      mockDb.habitLog.upsert.mockResolvedValue({
        id: "log-1",
        habitId: "habit-1",
        date: today,
        completed: true,
        count: 1,
      });
      mockDb.habitLog.findMany.mockResolvedValue([]);
      mockDb.habit.findUnique.mockResolvedValue({ longestStreak: 0 });
      mockDb.habit.update.mockResolvedValue({});

      const caller = createCaller();

      // Act
      const result = await caller.log({
        habitId: "habit-1",
        date: today,
        completed: true,
      });

      // Assert
      expect(result.completed).toBe(true);
      expect(mockDb.habitLog.upsert).toHaveBeenCalled();
    });

    it("logs habit with custom count", async () => {
      // Arrange
      mockDb.habit.findFirst.mockResolvedValue({
        id: "habit-1",
        userId: "user-1",
      });
      mockDb.habitLog.upsert.mockResolvedValue({
        id: "log-1",
        count: 5,
        completed: true,
      });
      mockDb.habitLog.findMany.mockResolvedValue([]);
      mockDb.habit.findUnique.mockResolvedValue({ longestStreak: 0 });
      mockDb.habit.update.mockResolvedValue({});

      const caller = createCaller();

      // Act
      const result = await caller.log({
        habitId: "habit-1",
        date: new Date(),
        completed: true,
        count: 5,
      });

      // Assert
      expect(result.count).toBe(5);
    });

    it("logs habit with mood and notes", async () => {
      // Arrange
      mockDb.habit.findFirst.mockResolvedValue({
        id: "habit-1",
        userId: "user-1",
      });
      mockDb.habitLog.upsert.mockResolvedValue({
        id: "log-1",
        mood: 4,
        notes: "Felt great!",
        completed: true,
      });
      mockDb.habitLog.findMany.mockResolvedValue([]);
      mockDb.habit.findUnique.mockResolvedValue({ longestStreak: 0 });
      mockDb.habit.update.mockResolvedValue({});

      const caller = createCaller();

      // Act
      await caller.log({
        habitId: "habit-1",
        date: new Date(),
        completed: true,
        mood: 4,
        notes: "Felt great!",
      });

      // Assert
      expect(mockDb.habitLog.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            mood: 4,
            notes: "Felt great!",
          }),
        })
      );
    });

    it("throws NOT_FOUND when habit does not exist", async () => {
      // Arrange
      mockDb.habit.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.log({
          habitId: "non-existent",
          date: new Date(),
          completed: true,
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("updates streak after logging", async () => {
      // Arrange
      mockDb.habit.findFirst.mockResolvedValue({
        id: "habit-1",
        userId: "user-1",
      });
      mockDb.habitLog.upsert.mockResolvedValue({
        id: "log-1",
        completed: true,
      });
      mockDb.habitLog.findMany.mockResolvedValue([
        { date: new Date(), completed: true },
      ]);
      mockDb.habit.findUnique.mockResolvedValue({
        id: "habit-1",
        longestStreak: 0,
      });
      mockDb.habit.update.mockResolvedValue({});

      const caller = createCaller();

      // Act
      await caller.log({
        habitId: "habit-1",
        date: new Date(),
        completed: true,
      });

      // Assert - streak should be updated
      expect(mockDb.habit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "habit-1" },
          data: expect.objectContaining({
            currentStreak: expect.any(Number),
          }),
        })
      );
    });
  });

  describe("getTodayStatus", () => {
    it("returns today status for active habits", async () => {
      // Arrange
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      mockDb.habit.findMany.mockResolvedValue([
        {
          id: "habit-1",
          name: "Exercise",
          isActive: true,
          logs: [{ completed: true, count: 1 }],
        },
        {
          id: "habit-2",
          name: "Read",
          isActive: true,
          logs: [],
        },
      ]);

      const caller = createCaller();

      // Act
      const result = await caller.getTodayStatus();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].completedToday).toBe(true);
      expect(result[0].todayCount).toBe(1);
      expect(result[1].completedToday).toBe(false);
      expect(result[1].todayCount).toBe(0);
    });

    it("only returns active habits", async () => {
      // Arrange
      mockDb.habit.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      await caller.getTodayStatus();

      // Assert
      expect(mockDb.habit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });
  });

  describe("getHeatmap", () => {
    it("returns heatmap data for date range", async () => {
      // Arrange - use local dates to avoid timezone issues
      const startDate = new Date(2024, 0, 1); // Jan 1, 2024 local time
      const endDate = new Date(2024, 0, 3); // Jan 3, 2024 local time

      mockDb.habitLog.findMany.mockResolvedValue([
        { date: new Date(2024, 0, 1), completed: true, count: 1 },
        { date: new Date(2024, 0, 2), completed: false, count: 0 },
      ]);

      const caller = createCaller();

      // Act
      const result = await caller.getHeatmap({
        habitId: "habit-1",
        startDate,
        endDate,
      });

      // Assert
      expect(result).toHaveLength(3); // 3 days in range
      expect(result[0].date).toBe("2024-01-01");
      expect(result[0].completed).toBe(true);
      expect(result[2].date).toBe("2024-01-03");
      expect(result[2].completed).toBe(false); // No log for this day
    });

    it("fills in missing days with defaults", async () => {
      // Arrange
      mockDb.habitLog.findMany.mockResolvedValue([]); // No logs

      const caller = createCaller();

      // Act - use local dates to avoid timezone issues
      const result = await caller.getHeatmap({
        habitId: "habit-1",
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 0, 5),
      });

      // Assert
      expect(result).toHaveLength(5);
      result.forEach((day) => {
        expect(day.completed).toBe(false);
        expect(day.count).toBe(0);
      });
    });
  });
});
