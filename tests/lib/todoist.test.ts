import { describe, it, expect } from "vitest";
import {
  mapTodoistPriority,
  todoistTaskToData,
  type TodoistTask,
} from "@/lib/integrations/todoist";

describe("mapTodoistPriority", () => {
  it("maps Todoist priority 4 to URGENT", () => {
    expect(mapTodoistPriority(4)).toBe("URGENT");
  });

  it("maps Todoist priority 3 to HIGH", () => {
    expect(mapTodoistPriority(3)).toBe("HIGH");
  });

  it("maps Todoist priority 2 to MEDIUM", () => {
    expect(mapTodoistPriority(2)).toBe("MEDIUM");
  });

  it("maps Todoist priority 1 to LOW", () => {
    expect(mapTodoistPriority(1)).toBe("LOW");
  });

  it("falls back to LOW for unexpected values", () => {
    expect(mapTodoistPriority(0)).toBe("LOW");
    expect(mapTodoistPriority(99)).toBe("LOW");
  });
});

describe("todoistTaskToData", () => {
  const base: TodoistTask = {
    id: "t-1",
    content: "Write report",
    description: "Quarterly numbers",
    priority: 4,
    labels: ["work", "urgent"],
    due: { date: "2026-07-01" },
    project_id: "p-1",
  };

  it("maps title, description, priority, tags and status", () => {
    const data = todoistTaskToData(base, "user-1");
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
    const data = todoistTaskToData(base, "user-1");
    expect(data.dueAt).toBeInstanceOf(Date);
    expect((data.dueAt as Date).toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("uses null for missing due date", () => {
    const data = todoistTaskToData({ ...base, due: null }, "user-1");
    expect(data.dueAt).toBeNull();
  });

  it("uses null for an empty description", () => {
    const data = todoistTaskToData({ ...base, description: "" }, "user-1");
    expect(data.description).toBeNull();
  });

  it("defaults tags to an empty array when labels are absent", () => {
    const data = todoistTaskToData(
      { id: "t-2", content: "No labels", priority: 1 },
      "user-1"
    );
    expect(data.tags).toEqual([]);
    expect(data.priority).toBe("LOW");
  });
});
