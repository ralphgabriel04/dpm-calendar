/**
 * Test utilities for tRPC router testing.
 * This file provides mock infrastructure for testing tRPC routers in isolation.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { vi } from "vitest";

// Create mock database with all required methods
export function createMockDb() {
  return {
    calendar: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    event: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    checklistItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
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
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    userPreferences: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    calendarSection: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    note: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

export type MockDb = ReturnType<typeof createMockDb>;

// Create tRPC test instance
export function createTestTRPC<TDb extends MockDb>() {
  type Context = {
    session: { user: { id: string } } | null;
    db: TDb;
  };

  const t = initTRPC.context<Context>().create({
    transformer: superjson,
  });

  const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
      },
    });
  });

  return {
    t,
    createTRPCRouter: t.router,
    protectedProcedure,
    publicProcedure: t.procedure,
  };
}

// Create a test context
export function createTestContext(mockDb: MockDb, userId: string | null = "user-1") {
  return {
    session: userId ? { user: { id: userId } } : null,
    db: mockDb,
  };
}

// Export pre-created instances for convenience
export const mockDb = createMockDb();
export const testTRPC = createTestTRPC();
