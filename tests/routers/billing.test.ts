import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from "vitest";
import { createMockDb, createTestContext } from "../helpers/trpc-test-utils";

const mockDb = createMockDb();

// These models are not part of the shared mock harness; add them here.
Object.assign(mockDb, {
  billingCustomer: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
});

// Typed view of the augmented mock for use in tests.
const db = mockDb as typeof mockDb & {
  billingCustomer: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  subscription: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

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

let billingRouter: Awaited<
  typeof import("@/features/billing/server/billing.router")
>["billingRouter"];
let getUserPlan: Awaited<
  typeof import("@/features/billing/server/gating")
>["getUserPlan"];
let requirePlan: Awaited<
  typeof import("@/features/billing/server/gating")
>["requirePlan"];

beforeAll(async () => {
  billingRouter = (await import("@/features/billing/server/billing.router"))
    .billingRouter;
  const gating = await import("@/features/billing/server/gating");
  getUserPlan = gating.getUserPlan;
  requirePlan = gating.requirePlan;
});

const createCaller = (userId: string | null = "user-1") =>
  billingRouter.createCaller(createTestContext(mockDb, userId) as never);

const ORIGINAL_ENV = { ...process.env };

describe("billingRouter / gating", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe("getUserPlan", () => {
    it("returns FREE when the user has no billing customer", async () => {
      db.billingCustomer.findUnique.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plan = await getUserPlan(db as any, "user-1");
      expect(plan).toBe("FREE");
    });

    it("returns FREE when the customer has no active subscriptions", async () => {
      db.billingCustomer.findUnique.mockResolvedValue({
        id: "bc-1",
        userId: "user-1",
        subscriptions: [],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plan = await getUserPlan(db as any, "user-1");
      expect(plan).toBe("FREE");
    });

    it("returns PRO when an ACTIVE PRO subscription exists", async () => {
      db.billingCustomer.findUnique.mockResolvedValue({
        id: "bc-1",
        userId: "user-1",
        subscriptions: [{ plan: "PRO", status: "ACTIVE" }],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plan = await getUserPlan(db as any, "user-1");
      expect(plan).toBe("PRO");
    });

    it("returns the highest-ranked plan among subscriptions", async () => {
      db.billingCustomer.findUnique.mockResolvedValue({
        id: "bc-1",
        userId: "user-1",
        subscriptions: [
          { plan: "PRO", status: "ACTIVE" },
          { plan: "TEAM", status: "TRIALING" },
        ],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plan = await getUserPlan(db as any, "user-1");
      expect(plan).toBe("TEAM");
    });
  });

  describe("requirePlan", () => {
    it("throws FORBIDDEN/UPGRADE_REQUIRED for a FREE user asking for PRO", async () => {
      db.billingCustomer.findUnique.mockResolvedValue(null);
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        requirePlan(db as any, "user-1", "PRO")
      ).rejects.toMatchObject({ code: "FORBIDDEN", message: "UPGRADE_REQUIRED" });
    });

    it("passes for a PRO user requiring PRO and returns the plan", async () => {
      db.billingCustomer.findUnique.mockResolvedValue({
        id: "bc-1",
        userId: "user-1",
        subscriptions: [{ plan: "PRO", status: "ACTIVE" }],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plan = await requirePlan(db as any, "user-1", "PRO");
      expect(plan).toBe("PRO");
    });
  });

  describe("getStatus", () => {
    it("configured is false when STRIPE_SECRET_KEY is unset", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      db.billingCustomer.findUnique.mockResolvedValue(null);
      const result = await createCaller().getStatus();
      expect(result.configured).toBe(false);
      expect(result.plan).toBe("FREE");
      expect(result.subscription).toBeNull();
    });

    it("configured is true when STRIPE_SECRET_KEY is set", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_123";
      db.billingCustomer.findUnique.mockResolvedValue({
        id: "bc-1",
        userId: "user-1",
        subscriptions: [
          {
            plan: "PRO",
            status: "ACTIVE",
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        ],
      });
      const result = await createCaller().getStatus();
      expect(result.configured).toBe(true);
      expect(result.plan).toBe("PRO");
      expect(result.subscription).toMatchObject({
        plan: "PRO",
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
      });
    });
  });

  describe("getPlans", () => {
    it("returns 3 plans with priceId null when STRIPE_PRICE_* are unset", async () => {
      delete process.env.STRIPE_PRICE_PRO;
      delete process.env.STRIPE_PRICE_TEAM;
      const result = await createCaller().getPlans();
      expect(result.plans).toHaveLength(3);
      const byPlan = Object.fromEntries(
        result.plans.map((p) => [p.plan, p])
      );
      expect(byPlan.FREE.priceId).toBeNull();
      expect(byPlan.PRO.priceId).toBeNull();
      expect(byPlan.TEAM.priceId).toBeNull();
    });

    it("uses the configured Stripe price IDs when present", async () => {
      process.env.STRIPE_PRICE_PRO = "price_pro";
      process.env.STRIPE_PRICE_TEAM = "price_team";
      const result = await createCaller().getPlans();
      const byPlan = Object.fromEntries(
        result.plans.map((p) => [p.plan, p])
      );
      expect(byPlan.PRO.priceId).toBe("price_pro");
      expect(byPlan.TEAM.priceId).toBe("price_team");
    });
  });
});
