import { describe, it, expect } from "vitest";
import {
  mapTickTickPriority,
  tickTickTaskToData,
  type TickTickTask,
} from "@/lib/integrations/ticktick";

describe("mapTickTickPriority", () => {
  it("maps TickTick priority 5 to URGENT", () => {
    expect(mapTickTickPriority(5)).toBe("URGENT");
  });

  it("maps TickTick priority 3 to HIGH", () => {
    expect(mapTickTickPriority(3)).toBe("HIGH");
  });

  it("maps TickTick priority 1 to MEDIUM", () => {
    expect(mapTickTickPriority(1)).toBe("MEDIUM");
  });

  it("maps TickTick priority 0 to LOW", () => {
    expect(mapTickTickPriority(0)).toBe("LOW");
  });

  it("falls back to LOW for undefined / unexpected values", () => {
    expect(mapTickTickPriority(undefined)).toBe("LOW");
    expect(mapTickTickPriority(2)).toBe("LOW");
    expect(mapTickTickPriority(99)).toBe("LOW");
  });
});

describe("tickTickTaskToData", () => {
  const base: TickTickTask = {
    id: "tt-1",
    title: "Write report",
    content: "Quarterly numbers",
    priority: 5,
    tags: ["work", "urgent"],
    dueDate: "2026-07-01T00:00:00.000+0000",
  };

  it("maps title, description, priority, tags and status", () => {
    const data = tickTickTaskToData(base, "user-1");
    expect(data).toMatchObject({
      userId: "user-1",
      title: "Write report",
      description: "Quarterly numbers",
      priority: "URGENT",
      tags: ["work", "urgent"],
      status: "TODO",
    });
  });

  it("parses the due date into a Date", () => {
    const data = tickTickTaskToData(base, "user-1");
    expect(data.dueAt).toBeInstanceOf(Date);
  });

  it("uses null for a missing due date", () => {
    const data = tickTickTaskToData({ ...base, dueDate: undefined }, "user-1");
    expect(data.dueAt).toBeNull();
  });

  it("uses null for empty content", () => {
    const data = tickTickTaskToData({ ...base, content: "" }, "user-1");
    expect(data.description).toBeNull();
  });

  it("defaults tags to an empty array when absent", () => {
    const data = tickTickTaskToData(
      { id: "tt-2", title: "No tags", priority: 0 },
      "user-1"
    );
    expect(data.tags).toEqual([]);
    expect(data.priority).toBe("LOW");
  });
});
