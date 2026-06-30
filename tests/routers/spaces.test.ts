import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import {
  createMockDb,
  createTestContext,
} from "../helpers/trpc-test-utils";

const mockDb = createMockDb();

// Spaces use $transaction (create / acceptInvite). Run the callback inline
// against the same mock db (mirrors task.test.ts line 37).
Object.assign(mockDb, {
  $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockDb)),
});

// db AND dbAdmin both resolve to the same mock so acceptInvite (which reads via
// dbAdmin) hits the same spies.
vi.mock("@/infrastructure/db/client", () => ({ db: mockDb, dbAdmin: mockDb }));
vi.mock("@/infrastructure/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 100 })),
}));
vi.mock("@/features/spaces/lib/sendInvite", () => ({
  sendSpaceInvite: vi.fn(async () => ({ sent: true })),
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

let spacesRouter: Awaited<
  typeof import("@/features/spaces/server/space.router")
>["spacesRouter"];

beforeAll(async () => {
  spacesRouter = (await import("@/features/spaces/server/space.router"))
    .spacesRouter;
});

const createCaller = (
  userId: string | null = "user-1",
  email: string | null = null
) =>
  spacesRouter.createCaller(
    createTestContext(mockDb, userId, email) as never
  );

// Convenience: mark the caller as a member with a given role.
const asRole = (role: string) =>
  mockDb.spaceMember.findUnique.mockResolvedValue({ role });

describe("spacesRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("list", () => {
    it("returns spaces the caller is a member of, with role and count", async () => {
      mockDb.spaceMember.findMany.mockResolvedValue([
        {
          role: "ADMIN",
          space: { id: "s1", name: "Team", _count: { members: 3 } },
        },
      ]);
      const result = await createCaller().list();
      expect(result).toEqual([
        { id: "s1", name: "Team", _count: { members: 3 }, role: "ADMIN", memberCount: 3 },
      ]);
      expect(mockDb.spaceMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "user-1" } })
      );
    });
  });

  describe("create", () => {
    it("creates a space and an OWNER membership for the caller", async () => {
      mockDb.space.create.mockResolvedValue({ id: "s1", name: "New" });
      mockDb.spaceMember.create.mockResolvedValue({ id: "m1" });
      const space = await createCaller().create({ name: "New" });
      expect(space.id).toBe("s1");
      expect(mockDb.space.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "New", ownerId: "user-1", isPersonal: false }),
        })
      );
      expect(mockDb.spaceMember.create).toHaveBeenCalledWith({
        data: { spaceId: "s1", userId: "user-1", role: "OWNER" },
      });
    });
  });

  describe("get", () => {
    it("throws FORBIDDEN when the caller is not a member", async () => {
      mockDb.spaceMember.findUnique.mockResolvedValue(null);
      await expect(
        createCaller().get({ spaceId: "s1" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("returns the space with myRole for a member", async () => {
      asRole("MEMBER");
      mockDb.space.findUnique.mockResolvedValue({ id: "s1", members: [] });
      const result = await createCaller().get({ spaceId: "s1" });
      expect(result).toMatchObject({ id: "s1", myRole: "MEMBER" });
    });

    it("throws NOT_FOUND when the space is missing", async () => {
      asRole("MEMBER");
      mockDb.space.findUnique.mockResolvedValue(null);
      await expect(
        createCaller().get({ spaceId: "s1" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("update", () => {
    it("throws FORBIDDEN for a MEMBER (needs ADMIN)", async () => {
      asRole("MEMBER");
      await expect(
        createCaller().update({ spaceId: "s1", name: "x" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(mockDb.space.update).not.toHaveBeenCalled();
    });

    it("renames the space for an ADMIN", async () => {
      asRole("ADMIN");
      mockDb.space.update.mockResolvedValue({ id: "s1", name: "Renamed" });
      const r = await createCaller().update({ spaceId: "s1", name: "Renamed" });
      expect(r.name).toBe("Renamed");
    });
  });

  describe("delete", () => {
    it("throws FORBIDDEN for an ADMIN (needs OWNER)", async () => {
      asRole("ADMIN");
      await expect(
        createCaller().delete({ spaceId: "s1" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(mockDb.space.delete).not.toHaveBeenCalled();
    });
  });

  describe("invite", () => {
    it("throws FORBIDDEN for a non-member", async () => {
      mockDb.spaceMember.findUnique.mockResolvedValue(null);
      await expect(
        createCaller().invite({ spaceId: "s1", email: "a@b.com" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects inviting as OWNER", async () => {
      asRole("ADMIN");
      await expect(
        createCaller().invite({ spaceId: "s1", email: "a@b.com", role: "OWNER" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(mockDb.spaceInvite.create).not.toHaveBeenCalled();
    });

    it("creates a pending invite and returns the invite url", async () => {
      asRole("ADMIN");
      mockDb.spaceInvite.create.mockResolvedValue({ id: "i1", token: "tok123" });
      mockDb.space.findUnique.mockResolvedValue({ name: "Team" });
      const r = await createCaller().invite({ spaceId: "s1", email: "a@b.com" });
      expect(r.invite.id).toBe("i1");
      expect(r.inviteUrl).toContain("/invite/tok123");
      expect(r.emailSent).toBe(true);
      expect(mockDb.spaceInvite.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "PENDING", role: "MEMBER" }),
        })
      );
    });
  });

  describe("updateRole", () => {
    it("throws FORBIDDEN for a MEMBER", async () => {
      asRole("MEMBER");
      await expect(
        createCaller().updateRole({ spaceId: "s1", userId: "u2", role: "ADMIN" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects altering an OWNER target", async () => {
      mockDb.spaceMember.findUnique
        .mockResolvedValueOnce({ role: "ADMIN" }) // caller
        .mockResolvedValueOnce({ role: "OWNER" }); // target
      await expect(
        createCaller().updateRole({ spaceId: "s1", userId: "u2", role: "MEMBER" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(mockDb.spaceMember.update).not.toHaveBeenCalled();
    });
  });

  describe("removeMember", () => {
    it("throws FORBIDDEN for a MEMBER", async () => {
      asRole("MEMBER");
      await expect(
        createCaller().removeMember({ spaceId: "s1", userId: "u2" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects removing the OWNER", async () => {
      mockDb.spaceMember.findUnique
        .mockResolvedValueOnce({ role: "ADMIN" }) // caller
        .mockResolvedValueOnce({ role: "OWNER" }); // target
      await expect(
        createCaller().removeMember({ spaceId: "s1", userId: "u2" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(mockDb.spaceMember.delete).not.toHaveBeenCalled();
    });
  });

  describe("leave", () => {
    it("rejects the OWNER leaving", async () => {
      asRole("OWNER");
      await expect(
        createCaller().leave({ spaceId: "s1" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("acceptInvite", () => {
    const future = new Date(Date.now() + 3600_000);
    const past = new Date(Date.now() - 3600_000);

    it("throws NOT_FOUND for an unknown token", async () => {
      mockDb.spaceInvite.findUnique.mockResolvedValue(null);
      await expect(
        createCaller("user-1", "a@b.com").acceptInvite({ token: "nope" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws BAD_REQUEST for a non-pending invite", async () => {
      mockDb.spaceInvite.findUnique.mockResolvedValue({
        id: "i1",
        spaceId: "s1",
        email: "a@b.com",
        role: "MEMBER",
        status: "ACCEPTED",
        expiresAt: future,
      });
      await expect(
        createCaller("user-1", "a@b.com").acceptInvite({ token: "t" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("throws BAD_REQUEST for an expired invite", async () => {
      mockDb.spaceInvite.findUnique.mockResolvedValue({
        id: "i1",
        spaceId: "s1",
        email: "a@b.com",
        role: "MEMBER",
        status: "PENDING",
        expiresAt: past,
      });
      await expect(
        createCaller("user-1", "a@b.com").acceptInvite({ token: "t" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("throws FORBIDDEN for a different email", async () => {
      mockDb.spaceInvite.findUnique.mockResolvedValue({
        id: "i1",
        spaceId: "s1",
        email: "other@b.com",
        role: "MEMBER",
        status: "PENDING",
        expiresAt: future,
      });
      await expect(
        createCaller("user-1", "a@b.com").acceptInvite({ token: "t" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("accepts a valid invite, creating membership and marking accepted", async () => {
      mockDb.spaceInvite.findUnique.mockResolvedValue({
        id: "i1",
        spaceId: "s1",
        email: "A@B.com",
        role: "MEMBER",
        status: "PENDING",
        expiresAt: future,
      });
      mockDb.spaceMember.findUnique.mockResolvedValue(null);
      mockDb.spaceMember.create.mockResolvedValue({ id: "m1" });
      mockDb.spaceInvite.update.mockResolvedValue({ id: "i1" });

      const r = await createCaller("user-1", "a@b.com").acceptInvite({ token: "t" });
      expect(r).toEqual({ spaceId: "s1" });
      expect(mockDb.spaceMember.create).toHaveBeenCalledWith({
        data: { spaceId: "s1", userId: "user-1", role: "MEMBER" },
      });
      expect(mockDb.spaceInvite.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "i1" },
          data: expect.objectContaining({ status: "ACCEPTED" }),
        })
      );
    });
  });
});
