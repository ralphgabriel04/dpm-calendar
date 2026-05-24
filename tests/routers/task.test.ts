import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createMockDb,
  createTestTRPC,
  createTestContext,
} from "../helpers/trpc-test-utils";

// Create fresh mock instances
const mockDb = createMockDb();

// Add task-specific mock methods
Object.assign(mockDb, {
  task: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    aggregate: vi.fn(),
  },
  checklistItem: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    aggregate: vi.fn(),
  },
  timeBlock: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockDb)),
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
let taskRouter: Awaited<
  typeof import("@/features/tasks/server/task.router")
>["taskRouter"];

beforeAll(async () => {
  const module = await import("@/features/tasks/server/task.router");
  taskRouter = module.taskRouter;
});

// Helper to create caller
const createCaller = (userId: string | null = "user-1") => {
  const ctx = createTestContext(mockDb, userId);
  return taskRouter.createCaller(ctx as never);
};

describe("taskRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns tasks for authenticated user", async () => {
      // Arrange
      const mockTasks = [
        {
          id: "task-1",
          title: "Task 1",
          status: "TODO",
          priority: "HIGH",
          userId: "user-1",
          subtasks: [],
          linkedEvent: null,
          checklistItems: [],
        },
        {
          id: "task-2",
          title: "Task 2",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
          userId: "user-1",
          subtasks: [],
          linkedEvent: null,
          checklistItems: [],
        },
      ];
      mockDb.task.findMany.mockResolvedValue(mockTasks);

      const caller = createCaller();

      // Act
      const result = await caller.list({});

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Task 1");
    });

    it("filters tasks by status", async () => {
      // Arrange
      mockDb.task.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      await caller.list({ status: ["TODO", "IN_PROGRESS"] });

      // Assert
      expect(mockDb.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ["TODO", "IN_PROGRESS"] },
          }),
        })
      );
    });

    it("filters tasks by priority", async () => {
      // Arrange
      mockDb.task.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      await caller.list({ priority: ["HIGH", "URGENT"] });

      // Assert
      expect(mockDb.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: { in: ["HIGH", "URGENT"] },
          }),
        })
      );
    });

    it("excludes completed tasks by default", async () => {
      // Arrange
      mockDb.task.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      await caller.list({});

      // Assert
      expect(mockDb.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: "DONE" },
          }),
        })
      );
    });

    it("includes completed tasks when specified", async () => {
      // Arrange
      mockDb.task.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      await caller.list({ includeCompleted: true });

      // Assert
      expect(mockDb.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            status: { not: "DONE" },
          }),
        })
      );
    });

    it("filters tasks by search term", async () => {
      // Arrange
      mockDb.task.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      await caller.list({ search: "meeting" });

      // Assert
      expect(mockDb.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: "meeting", mode: "insensitive" } },
              { description: { contains: "meeting", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("filters tasks by tags", async () => {
      // Arrange
      mockDb.task.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      await caller.list({ tags: ["work", "urgent"] });

      // Assert
      expect(mockDb.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasSome: ["work", "urgent"] },
          }),
        })
      );
    });
  });

  describe("get", () => {
    it("returns task with subtasks when found", async () => {
      // Arrange
      const mockTask = {
        id: "task-1",
        title: "Main Task",
        userId: "user-1",
        subtasks: [
          { id: "sub-1", title: "Subtask 1" },
          { id: "sub-2", title: "Subtask 2" },
        ],
        linkedEvent: null,
        parentTask: null,
      };
      mockDb.task.findFirst.mockResolvedValue(mockTask);

      const caller = createCaller();

      // Act
      const result = await caller.get({ id: "task-1" });

      // Assert
      expect(result.id).toBe("task-1");
      expect(result.subtasks).toHaveLength(2);
    });

    it("throws NOT_FOUND when task does not exist", async () => {
      // Arrange
      mockDb.task.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(caller.get({ id: "non-existent" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("throws NOT_FOUND when task belongs to another user", async () => {
      // Arrange
      mockDb.task.findFirst.mockResolvedValue(null); // Auth filter returns null

      const caller = createCaller("user-1");

      // Act & Assert
      await expect(caller.get({ id: "other-user-task" })).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe("create", () => {
    it("creates task with default values", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue({ dailyPriorityCap: 3 });
      mockDb.task.findMany.mockResolvedValue([]); // No existing priority tasks
      mockDb.task.aggregate.mockResolvedValue({ _max: { position: 0 } });
      mockDb.task.create.mockResolvedValue({
        id: "new-task",
        title: "New Task",
        priority: "MEDIUM",
        status: "TODO",
        position: 1,
      });

      const caller = createCaller();

      // Act
      const result = await caller.create({ title: "New Task" });

      // Assert
      expect(result.title).toBe("New Task");
      expect(mockDb.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "New Task",
            userId: "user-1",
            position: 1,
          }),
        })
      );
    });

    it("creates task with custom priority", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue({ dailyPriorityCap: 3 });
      mockDb.task.findMany.mockResolvedValue([]);
      mockDb.task.aggregate.mockResolvedValue({ _max: { position: 5 } });
      mockDb.task.create.mockResolvedValue({
        id: "new-task",
        title: "Urgent Task",
        priority: "URGENT",
        position: 6,
      });

      const caller = createCaller();

      // Act
      await caller.create({ title: "Urgent Task", priority: "URGENT" });

      // Assert
      expect(mockDb.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: "URGENT",
            position: 6,
          }),
        })
      );
    });

    it("enforces daily priority cap for high priority tasks due today", async () => {
      // Arrange
      const today = new Date();
      mockDb.user.findUnique.mockResolvedValue({ dailyPriorityCap: 2 });
      mockDb.task.findMany.mockResolvedValue([
        { id: "t1", priority: "HIGH" },
        { id: "t2", priority: "URGENT" },
      ]); // Already at cap

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.create({
          title: "New Urgent",
          priority: "URGENT",
          dueAt: today,
        })
      ).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
        message: expect.stringContaining("priority cap"),
      });
    });

    it("creates subtask under parent task", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue({ dailyPriorityCap: 3 });
      mockDb.task.findMany.mockResolvedValue([]);
      mockDb.task.aggregate.mockResolvedValue({ _max: { position: 2 } });
      mockDb.task.create.mockResolvedValue({
        id: "subtask-1",
        title: "Subtask",
        parentTaskId: "parent-task",
        position: 3,
      });

      const caller = createCaller();

      // Act
      await caller.create({
        title: "Subtask",
        parentTaskId: "parent-task",
      });

      // Assert
      expect(mockDb.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentTaskId: "parent-task",
          }),
        })
      );
    });
  });

  describe("update", () => {
    it("updates task title", async () => {
      // Arrange
      const existingTask = {
        id: "task-1",
        title: "Old Title",
        priority: "MEDIUM",
        dueAt: null,
        plannedStartAt: null,
      };
      mockDb.task.findFirst.mockResolvedValue(existingTask);
      mockDb.task.update.mockResolvedValue({
        ...existingTask,
        title: "New Title",
      });

      const caller = createCaller();

      // Act
      const result = await caller.update({ id: "task-1", title: "New Title" });

      // Assert
      expect(result.title).toBe("New Title");
    });

    it("sets completedAt when status changes to DONE", async () => {
      // Arrange
      const existingTask = {
        id: "task-1",
        title: "Task",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        dueAt: null,
        plannedStartAt: null,
      };
      mockDb.task.findFirst.mockResolvedValue(existingTask);
      mockDb.task.update.mockResolvedValue({
        ...existingTask,
        status: "DONE",
        completedAt: new Date(),
      });

      const caller = createCaller();

      // Act
      await caller.update({ id: "task-1", status: "DONE" });

      // Assert
      expect(mockDb.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "DONE",
            completedAt: expect.any(Date),
          }),
        })
      );
    });

    it("clears completedAt when status changes from DONE", async () => {
      // Arrange
      const existingTask = {
        id: "task-1",
        title: "Task",
        status: "DONE",
        completedAt: new Date(),
        priority: "MEDIUM",
        dueAt: null,
        plannedStartAt: null,
      };
      mockDb.task.findFirst.mockResolvedValue(existingTask);
      mockDb.task.update.mockResolvedValue({
        ...existingTask,
        status: "TODO",
        completedAt: null,
      });

      const caller = createCaller();

      // Act
      await caller.update({ id: "task-1", status: "TODO" });

      // Assert
      expect(mockDb.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            completedAt: null,
          }),
        })
      );
    });

    it("throws NOT_FOUND when task does not exist", async () => {
      // Arrange
      mockDb.task.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.update({ id: "non-existent", title: "New" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("enforces priority cap when upgrading task priority", async () => {
      // Arrange
      const today = new Date();
      const existingTask = {
        id: "task-1",
        title: "Task",
        priority: "LOW",
        dueAt: today,
        plannedStartAt: null,
      };
      mockDb.task.findFirst.mockResolvedValue(existingTask);
      mockDb.user.findUnique.mockResolvedValue({ dailyPriorityCap: 2 });
      mockDb.task.findMany.mockResolvedValue([
        { id: "t1", priority: "HIGH" },
        { id: "t2", priority: "URGENT" },
      ]); // Already at cap

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.update({ id: "task-1", priority: "HIGH" })
      ).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
      });
    });
  });

  describe("delete", () => {
    it("deletes task when found", async () => {
      // Arrange
      const existingTask = { id: "task-1", title: "Task", userId: "user-1" };
      mockDb.task.findFirst.mockResolvedValue(existingTask);
      mockDb.task.delete.mockResolvedValue(existingTask);

      const caller = createCaller();

      // Act
      const result = await caller.delete({ id: "task-1" });

      // Assert
      expect(result.id).toBe("task-1");
      expect(mockDb.task.delete).toHaveBeenCalledWith({
        where: { id: "task-1" },
      });
    });

    it("throws NOT_FOUND when task does not exist", async () => {
      // Arrange
      mockDb.task.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(caller.delete({ id: "non-existent" })).rejects.toMatchObject(
        { code: "NOT_FOUND" }
      );
    });
  });

  describe("toggle", () => {
    it("marks TODO task as DONE", async () => {
      // Arrange
      const existingTask = { id: "task-1", status: "TODO", userId: "user-1" };
      mockDb.task.findFirst.mockResolvedValue(existingTask);
      mockDb.task.update.mockResolvedValue({
        ...existingTask,
        status: "DONE",
        completedAt: new Date(),
      });

      const caller = createCaller();

      // Act
      const result = await caller.toggle({ id: "task-1" });

      // Assert
      expect(result.status).toBe("DONE");
      expect(mockDb.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: {
          status: "DONE",
          completedAt: expect.any(Date),
        },
      });
    });

    it("marks DONE task as TODO", async () => {
      // Arrange
      const existingTask = {
        id: "task-1",
        status: "DONE",
        completedAt: new Date(),
        userId: "user-1",
      };
      mockDb.task.findFirst.mockResolvedValue(existingTask);
      mockDb.task.update.mockResolvedValue({
        ...existingTask,
        status: "TODO",
        completedAt: null,
      });

      const caller = createCaller();

      // Act
      const result = await caller.toggle({ id: "task-1" });

      // Assert
      expect(result.status).toBe("TODO");
      expect(mockDb.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: {
          status: "TODO",
          completedAt: null,
        },
      });
    });

    it("throws NOT_FOUND when task does not exist", async () => {
      // Arrange
      mockDb.task.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(caller.toggle({ id: "non-existent" })).rejects.toMatchObject(
        { code: "NOT_FOUND" }
      );
    });
  });

  describe("getTodayPriorities", () => {
    it("returns today priority tasks with cap info", async () => {
      // Arrange
      const today = new Date();
      mockDb.user.findUnique.mockResolvedValue({ dailyPriorityCap: 3 });
      mockDb.task.findMany.mockResolvedValue([
        { id: "t1", title: "Task 1", priority: "URGENT", dueAt: today },
        { id: "t2", title: "Task 2", priority: "HIGH", plannedStartAt: today },
      ]);

      const caller = createCaller();

      // Act
      const result = await caller.getTodayPriorities();

      // Assert
      expect(result.cap).toBe(3);
      expect(result.tasks).toHaveLength(2);
    });

    it("uses default cap of 3 when user has no preference", async () => {
      // Arrange
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.task.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      const result = await caller.getTodayPriorities();

      // Assert
      expect(result.cap).toBe(3);
    });
  });

  describe("deferTask", () => {
    it("bumps due date by 1 day and lowers priority", async () => {
      // Arrange
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingTask = {
        id: "task-1",
        title: "Urgent Task",
        priority: "URGENT",
        dueAt: today,
        plannedStartAt: today,
        userId: "user-1",
      };
      mockDb.task.findFirst.mockResolvedValue(existingTask);
      mockDb.task.update.mockResolvedValue({
        ...existingTask,
        dueAt: tomorrow,
        plannedStartAt: tomorrow,
        priority: "HIGH",
      });

      const caller = createCaller();

      // Act
      const result = await caller.deferTask({ id: "task-1" });

      // Assert
      expect(result.priority).toBe("HIGH");
      expect(mockDb.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: "HIGH",
          }),
        })
      );
    });

    it("throws NOT_FOUND when task does not exist", async () => {
      // Arrange
      mockDb.task.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.deferTask({ id: "non-existent" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("updateActualDuration", () => {
    it("adds time to actual duration", async () => {
      // Arrange
      const existingTask = {
        id: "task-1",
        title: "Task",
        actualDuration: 30,
        userId: "user-1",
      };
      mockDb.task.findFirst.mockResolvedValue(existingTask);
      mockDb.task.update.mockResolvedValue({
        ...existingTask,
        actualDuration: 55,
      });

      const caller = createCaller();

      // Act
      const result = await caller.updateActualDuration({
        taskId: "task-1",
        additionalMinutes: 25,
      });

      // Assert
      expect(result.actualDuration).toBe(55);
      expect(mockDb.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { actualDuration: 55 },
      });
    });

    it("initializes duration from zero", async () => {
      // Arrange
      const existingTask = {
        id: "task-1",
        title: "Task",
        actualDuration: null,
        userId: "user-1",
      };
      mockDb.task.findFirst.mockResolvedValue(existingTask);
      mockDb.task.update.mockResolvedValue({
        ...existingTask,
        actualDuration: 25,
      });

      const caller = createCaller();

      // Act
      await caller.updateActualDuration({
        taskId: "task-1",
        additionalMinutes: 25,
      });

      // Assert
      expect(mockDb.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { actualDuration: 25 },
      });
    });
  });

  describe("getTags", () => {
    it("returns unique sorted tags", async () => {
      // Arrange
      mockDb.task.findMany.mockResolvedValue([
        { tags: ["work", "urgent"] },
        { tags: ["work", "personal"] },
        { tags: ["meeting"] },
      ]);

      const caller = createCaller();

      // Act
      const result = await caller.getTags();

      // Assert
      expect(result).toEqual(["meeting", "personal", "urgent", "work"]);
    });

    it("returns empty array when no tasks", async () => {
      // Arrange
      mockDb.task.findMany.mockResolvedValue([]);

      const caller = createCaller();

      // Act
      const result = await caller.getTags();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("addChecklistItem", () => {
    it("adds checklist item to task", async () => {
      // Arrange
      mockDb.task.findFirst.mockResolvedValue({ id: "task-1", userId: "user-1" });
      mockDb.checklistItem.aggregate.mockResolvedValue({ _max: { position: 2 } });
      mockDb.checklistItem.create.mockResolvedValue({
        id: "item-1",
        taskId: "task-1",
        title: "New Item",
        position: 3,
        isCompleted: false,
      });

      const caller = createCaller();

      // Act
      const result = await caller.addChecklistItem({
        taskId: "task-1",
        title: "New Item",
      });

      // Assert
      expect(result.title).toBe("New Item");
      expect(result.position).toBe(3);
    });

    it("throws NOT_FOUND when task does not exist", async () => {
      // Arrange
      mockDb.task.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      // Act & Assert
      await expect(
        caller.addChecklistItem({ taskId: "non-existent", title: "Item" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("toggleChecklistItem", () => {
    it("toggles checklist item completion", async () => {
      // Arrange
      mockDb.checklistItem.findFirst.mockResolvedValue({
        id: "item-1",
        isCompleted: false,
        task: { userId: "user-1" },
      });
      mockDb.checklistItem.update.mockResolvedValue({
        id: "item-1",
        isCompleted: true,
      });

      const caller = createCaller();

      // Act
      const result = await caller.toggleChecklistItem({ id: "item-1" });

      // Assert
      expect(result.isCompleted).toBe(true);
    });

    it("throws NOT_FOUND when item belongs to another user", async () => {
      // Arrange
      mockDb.checklistItem.findFirst.mockResolvedValue({
        id: "item-1",
        task: { userId: "other-user" },
      });

      const caller = createCaller("user-1");

      // Act & Assert
      await expect(
        caller.toggleChecklistItem({ id: "item-1" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
