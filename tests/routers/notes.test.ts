import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import {
  createMockDb,
  createTestContext,
} from "../helpers/trpc-test-utils";

const mockDb = createMockDb();

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

let notesRouter: Awaited<
  typeof import("@/features/notes/server/notes.router")
>["notesRouter"];

beforeAll(async () => {
  notesRouter = (await import("@/features/notes/server/notes.router"))
    .notesRouter;
});

const createCaller = (userId: string | null = "user-1") =>
  notesRouter.createCaller(createTestContext(mockDb, userId) as never);

describe("notesRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("list", () => {
    it("scopes notes to the authenticated user, pinned first", async () => {
      mockDb.note.findMany.mockResolvedValue([{ id: "n1", title: "A" }]);
      const result = await createCaller().list({});
      expect(result).toHaveLength(1);
      expect(mockDb.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "user-1" }),
          orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        })
      );
    });

    it("filters by search across title and content", async () => {
      mockDb.note.findMany.mockResolvedValue([]);
      await createCaller().list({ search: "idea" });
      expect(mockDb.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: "idea", mode: "insensitive" } },
              { content: { contains: "idea", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("filters by tags and taskId", async () => {
      mockDb.note.findMany.mockResolvedValue([]);
      await createCaller().list({ tags: ["work"], taskId: "task-1" });
      expect(mockDb.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasSome: ["work"] },
            taskId: "task-1",
          }),
        })
      );
    });
  });

  describe("get", () => {
    it("returns a note owned by the user", async () => {
      mockDb.note.findFirst.mockResolvedValue({ id: "n1", userId: "user-1" });
      expect((await createCaller().get({ id: "n1" })).id).toBe("n1");
    });

    it("throws NOT_FOUND for another user's note", async () => {
      mockDb.note.findFirst.mockResolvedValue(null);
      await expect(createCaller().get({ id: "n2" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("create", () => {
    it("creates a note owned by the caller", async () => {
      mockDb.note.create.mockResolvedValue({ id: "n1", title: "Hi" });
      await createCaller().create({ title: "Hi", content: "body" });
      expect(mockDb.note.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: "Hi", userId: "user-1" }),
        })
      );
    });

    it("rejects linking to a task the user does not own", async () => {
      mockDb.task.findFirst.mockResolvedValue(null);
      await expect(
        createCaller().create({ content: "x", taskId: "foreign-task" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(mockDb.note.create).not.toHaveBeenCalled();
    });

    it("allows linking to the user's own task", async () => {
      mockDb.task.findFirst.mockResolvedValue({ id: "task-1" });
      mockDb.note.create.mockResolvedValue({ id: "n1", taskId: "task-1" });
      await createCaller().create({ content: "x", taskId: "task-1" });
      expect(mockDb.note.create).toHaveBeenCalled();
    });
  });

  describe("update / togglePin / delete", () => {
    it("updates an owned note", async () => {
      mockDb.note.findFirst.mockResolvedValue({ id: "n1" });
      mockDb.note.update.mockResolvedValue({ id: "n1", title: "New" });
      const r = await createCaller().update({ id: "n1", title: "New" });
      expect(r.title).toBe("New");
    });

    it("update throws NOT_FOUND when the note is not the caller's", async () => {
      mockDb.note.findFirst.mockResolvedValue(null);
      await expect(
        createCaller().update({ id: "nope", title: "x" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(mockDb.note.update).not.toHaveBeenCalled();
    });

    it("togglePin flips the pinned flag", async () => {
      mockDb.note.findFirst.mockResolvedValue({ id: "n1", isPinned: false });
      mockDb.note.update.mockResolvedValue({ id: "n1", isPinned: true });
      await createCaller().togglePin({ id: "n1" });
      expect(mockDb.note.update).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: { isPinned: true },
      });
    });

    it("delete removes an owned note", async () => {
      mockDb.note.findFirst.mockResolvedValue({ id: "n1" });
      mockDb.note.delete.mockResolvedValue({ id: "n1" });
      expect((await createCaller().delete({ id: "n1" })).id).toBe("n1");
    });

    it("delete throws NOT_FOUND for a missing note", async () => {
      mockDb.note.findFirst.mockResolvedValue(null);
      await expect(
        createCaller().delete({ id: "nope" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
