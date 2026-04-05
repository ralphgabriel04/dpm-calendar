import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma client before importing the service under test.
vi.mock("@/infrastructure/db/client", () => {
  return {
    db: {
      task: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      event: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      timeBlock: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      userPreferences: {
        findUnique: vi.fn(),
      },
      energyLog: {
        findMany: vi.fn(),
      },
    },
  };
});

import { getCalibratedEstimate } from "@/features/intelligence/server/aiScheduler.service";
import { db } from "@/infrastructure/db/client";

const mockedDb = db as unknown as {
  task: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

describe("aiScheduler.getCalibratedEstimate", () => {
  beforeEach(() => {
    mockedDb.task.findFirst.mockReset();
    mockedDb.task.findMany.mockReset();
  });

  it("returns defaults with 30% buffer when sample size < 3", async () => {
    mockedDb.task.findFirst.mockResolvedValue({
      id: "t1",
      plannedDuration: 60,
      tags: [],
    });
    mockedDb.task.findMany.mockResolvedValue([
      { plannedDuration: 60, actualDuration: 70 },
    ]);

    const est = await getCalibratedEstimate("user-1", "t1");
    expect(est.sampleSize).toBe(1);
    expect(est.plannedDuration).toBe(60);
    expect(est.p50).toBe(60);
    expect(est.p80).toBe(Math.round(60 * 1.3)); // 78
    expect(est.suggested).toBe(Math.round(60 * 1.15)); // 69
    expect(est.calibrationFactor).toBe(1.0);
  });

  it("computes P50 and P80 from historical actual/planned ratios", async () => {
    mockedDb.task.findFirst.mockResolvedValue({
      id: "t1",
      plannedDuration: 100,
      tags: ["code"],
    });
    // 10 completed tasks; ratios: 1.0, 1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 2.0, 2.0
    const completed = [
      ...Array.from({ length: 5 }, () => ({
        plannedDuration: 10,
        actualDuration: 10,
      })),
      ...Array.from({ length: 5 }, () => ({
        plannedDuration: 10,
        actualDuration: 20,
      })),
    ];
    mockedDb.task.findMany.mockResolvedValue(completed);

    const est = await getCalibratedEstimate("user-1", "t1");
    expect(est.sampleSize).toBe(10);
    // sorted ratios: [1,1,1,1,1,2,2,2,2,2]
    // P50 index = floor(10 * 0.5) = 5 -> ratios[5] = 2
    // P80 index = floor(10 * 0.8) = 8 -> ratios[8] = 2
    expect(est.p50).toBe(200);
    expect(est.p80).toBe(200);
    expect(est.calibrationFactor).toBe(2);
  });

  it("P80 >= P50 for mixed ratios, suggested between them", async () => {
    mockedDb.task.findFirst.mockResolvedValue({
      id: "t1",
      plannedDuration: 60,
      tags: ["writing"],
    });
    const completed = [
      { plannedDuration: 60, actualDuration: 30 }, // 0.5
      { plannedDuration: 60, actualDuration: 45 }, // 0.75
      { plannedDuration: 60, actualDuration: 60 }, // 1.0
      { plannedDuration: 60, actualDuration: 75 }, // 1.25
      { plannedDuration: 60, actualDuration: 90 }, // 1.5
      { plannedDuration: 60, actualDuration: 120 }, // 2.0
    ];
    mockedDb.task.findMany.mockResolvedValue(completed);

    const est = await getCalibratedEstimate("user-1", "t1");
    expect(est.p80).toBeGreaterThanOrEqual(est.p50);
    expect(est.suggested).toBeGreaterThanOrEqual(est.p50);
    expect(est.suggested).toBeLessThanOrEqual(est.p80);
    expect(est.sampleSize).toBe(6);
  });

  it("throws when task does not exist", async () => {
    mockedDb.task.findFirst.mockResolvedValue(null);
    await expect(
      getCalibratedEstimate("user-1", "nonexistent")
    ).rejects.toThrow(/not found/i);
  });

  it("uses default plannedDuration of 30 when task has none", async () => {
    mockedDb.task.findFirst.mockResolvedValue({
      id: "t1",
      plannedDuration: null,
      tags: [],
    });
    mockedDb.task.findMany.mockResolvedValue([]);

    const est = await getCalibratedEstimate("user-1", "t1");
    expect(est.plannedDuration).toBe(30);
    expect(est.p50).toBe(30);
    expect(est.p80).toBe(39); // 30 * 1.3
    expect(est.sampleSize).toBe(0);
  });
});
