import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import {
  createMockDb,
  createTestTRPC,
  createTestContext,
} from "../helpers/trpc-test-utils";

// Create fresh mock instances
const mockDb = createMockDb();

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
let userRouter: Awaited<
  typeof import("@/features/auth/server/user.router")
>["userRouter"];

beforeAll(async () => {
  const module = await import("@/features/auth/server/user.router");
  userRouter = module.userRouter;
});

// Helper to create caller
const createCaller = (userId: string | null = "user-1") => {
  const ctx = createTestContext(mockDb, userId);
  return userRouter.createCaller(ctx as never);
};

describe("userRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("me", () => {
    it("returns current user profile with preferences", async () => {
      // Arrange
      const mockUser = {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        preferences: {
          theme: "dark",
          language: "en",
          workingHoursStart: "09:00",
          workingHoursEnd: "17:00",
        },
      };
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const caller = createCaller();

      // Act
      const result = await caller.me();

      // Assert
      expect(result?.id).toBe("user-1");
      expect(result?.name).toBe("John Doe");
      expect(result?.preferences?.theme).toBe("dark");
    });

    it("returns null when user not found", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue(null);

      const caller = createCaller();

      // Act
      const result = await caller.me();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("checkOnboarding", () => {
    it("returns completed true when onboarding is done", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue({ onboardingCompleted: true });

      const caller = createCaller();

      // Act
      const result = await caller.checkOnboarding();

      // Assert
      expect(result.completed).toBe(true);
    });

    it("returns completed false when onboarding not done", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue({ onboardingCompleted: false });

      const caller = createCaller();

      // Act
      const result = await caller.checkOnboarding();

      // Assert
      expect(result.completed).toBe(false);
    });

    it("returns completed false when user not found", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue(null);

      const caller = createCaller();

      // Act
      const result = await caller.checkOnboarding();

      // Assert
      expect(result.completed).toBe(false);
    });
  });

  describe("completeOnboarding", () => {
    it("saves preferences and marks onboarding complete", async () => {
      // Arrange
      mockDb.userPreferences.upsert.mockResolvedValue({
        userId: "user-1",
        workingHoursStart: "09:00",
        workingHoursEnd: "17:00",
        planningTime: "morning",
      });
      mockDb.user.update.mockResolvedValue({ onboardingCompleted: true });
      mockDb.calendar.findFirst.mockResolvedValue(null); // No existing default calendar
      mockDb.calendar.create.mockResolvedValue({
        id: "cal-1",
        name: "Mon calendrier",
        isDefault: true,
      });

      const caller = createCaller();

      // Act
      const result = await caller.completeOnboarding({
        workingHoursStart: "09:00",
        workingHoursEnd: "17:00",
        planningTime: "morning",
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockDb.userPreferences.upsert).toHaveBeenCalled();
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { onboardingCompleted: true },
      });
    });

    it("creates default calendar when none exists", async () => {
      // Arrange
      mockDb.userPreferences.upsert.mockResolvedValue({});
      mockDb.user.update.mockResolvedValue({});
      mockDb.calendar.findFirst.mockResolvedValue(null);
      mockDb.calendar.create.mockResolvedValue({
        id: "cal-1",
        name: "Mon calendrier",
        isDefault: true,
      });

      const caller = createCaller();

      // Act
      await caller.completeOnboarding({});

      // Assert
      expect(mockDb.calendar.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          name: "Mon calendrier",
          color: "#7C3AED",
          isDefault: true,
          provider: "LOCAL",
        }),
      });
    });

    it("does not create calendar when default already exists", async () => {
      // Arrange
      mockDb.userPreferences.upsert.mockResolvedValue({});
      mockDb.user.update.mockResolvedValue({});
      mockDb.calendar.findFirst.mockResolvedValue({
        id: "existing-cal",
        isDefault: true,
      });

      const caller = createCaller();

      // Act
      await caller.completeOnboarding({});

      // Assert
      expect(mockDb.calendar.create).not.toHaveBeenCalled();
    });

    it("saves connected calendars and task managers", async () => {
      // Arrange
      mockDb.userPreferences.upsert.mockResolvedValue({});
      mockDb.user.update.mockResolvedValue({});
      mockDb.calendar.findFirst.mockResolvedValue({ isDefault: true });

      const caller = createCaller();

      // Act
      await caller.completeOnboarding({
        connectedCalendars: ["google", "outlook"],
        connectedTaskManagers: ["todoist"],
      });

      // Assert
      expect(mockDb.userPreferences.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            connectedCalendars: ["google", "outlook"],
            connectedTaskManagers: ["todoist"],
          }),
        })
      );
    });
  });

  describe("updatePreferences", () => {
    it("updates user preferences", async () => {
      // Arrange
      mockDb.userPreferences.upsert.mockResolvedValue({
        userId: "user-1",
        theme: "dark",
        language: "fr",
      });

      const caller = createCaller();

      // Act
      const result = await caller.updatePreferences({
        theme: "dark",
        language: "fr",
      });

      // Assert
      expect(result.theme).toBe("dark");
      expect(result.language).toBe("fr");
    });

    it("updates working hours", async () => {
      // Arrange
      mockDb.userPreferences.upsert.mockResolvedValue({
        workingHoursStart: "08:00",
        workingHoursEnd: "18:00",
      });

      const caller = createCaller();

      // Act
      await caller.updatePreferences({
        workingHoursStart: "08:00",
        workingHoursEnd: "18:00",
      });

      // Assert
      expect(mockDb.userPreferences.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            workingHoursStart: "08:00",
            workingHoursEnd: "18:00",
          }),
        })
      );
    });

    it("updates display preferences", async () => {
      // Arrange
      mockDb.userPreferences.upsert.mockResolvedValue({
        compactMode: true,
        showWeekNumbers: true,
        firstDayOfWeek: 1,
      });

      const caller = createCaller();

      // Act
      await caller.updatePreferences({
        compactMode: true,
        showWeekNumbers: true,
        firstDayOfWeek: 1,
      });

      // Assert
      expect(mockDb.userPreferences.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            compactMode: true,
            showWeekNumbers: true,
            firstDayOfWeek: 1,
          }),
        })
      );
    });
  });

  describe("getPreferences", () => {
    it("returns user preferences", async () => {
      // Arrange
      mockDb.userPreferences.findUnique.mockResolvedValue({
        userId: "user-1",
        theme: "light",
        language: "en",
        dateFormat: "MM/dd/yyyy",
        timeFormat: "12h",
      });

      const caller = createCaller();

      // Act
      const result = await caller.getPreferences();

      // Assert
      expect(result?.theme).toBe("light");
      expect(result?.language).toBe("en");
    });

    it("returns null when no preferences exist", async () => {
      // Arrange
      mockDb.userPreferences.findUnique.mockResolvedValue(null);

      const caller = createCaller();

      // Act
      const result = await caller.getPreferences();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getDailyPriorityCap", () => {
    it("returns user daily priority cap", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue({ dailyPriorityCap: 5 });

      const caller = createCaller();

      // Act
      const result = await caller.getDailyPriorityCap();

      // Assert
      expect(result.dailyPriorityCap).toBe(5);
    });

    it("returns default cap of 3 when user has no setting", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue({ dailyPriorityCap: null });

      const caller = createCaller();

      // Act
      const result = await caller.getDailyPriorityCap();

      // Assert
      expect(result.dailyPriorityCap).toBe(3);
    });

    it("returns default cap of 3 when user not found", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue(null);

      const caller = createCaller();

      // Act
      const result = await caller.getDailyPriorityCap();

      // Assert
      expect(result.dailyPriorityCap).toBe(3);
    });
  });

  describe("updateDailyPriorityCap", () => {
    it("updates daily priority cap", async () => {
      // Arrange
      mockDb.user.update.mockResolvedValue({ dailyPriorityCap: 4 });

      const caller = createCaller();

      // Act
      const result = await caller.updateDailyPriorityCap({
        dailyPriorityCap: 4,
      });

      // Assert
      expect(result.dailyPriorityCap).toBe(4);
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { dailyPriorityCap: 4 },
        select: { dailyPriorityCap: true },
      });
    });

    it("accepts cap value of 1", async () => {
      // Arrange
      mockDb.user.update.mockResolvedValue({ dailyPriorityCap: 1 });

      const caller = createCaller();

      // Act
      const result = await caller.updateDailyPriorityCap({
        dailyPriorityCap: 1,
      });

      // Assert
      expect(result.dailyPriorityCap).toBe(1);
    });

    it("accepts cap value of 5", async () => {
      // Arrange
      mockDb.user.update.mockResolvedValue({ dailyPriorityCap: 5 });

      const caller = createCaller();

      // Act
      const result = await caller.updateDailyPriorityCap({
        dailyPriorityCap: 5,
      });

      // Assert
      expect(result.dailyPriorityCap).toBe(5);
    });
  });
});
