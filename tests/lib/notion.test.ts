import { describe, it, expect } from "vitest";
import {
  notionPageToData,
  type NotionPage,
} from "@/lib/integrations/notion";

describe("notionPageToData", () => {
  const base: NotionPage = {
    id: "page-1",
    title: "Project kickoff",
    url: "https://notion.so/page-1",
    dueDate: "2026-07-01",
  };

  it("maps title, url, status", () => {
    const data = notionPageToData(base, "user-1");
    expect(data).toMatchObject({
      userId: "user-1",
      title: "Project kickoff",
      url: "https://notion.so/page-1",
      status: "TODO",
    });
  });

  it("parses the due date into a Date", () => {
    const data = notionPageToData(base, "user-1");
    expect(data.dueAt).toBeInstanceOf(Date);
    expect((data.dueAt as Date).toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("uses null for a missing due date", () => {
    const data = notionPageToData({ ...base, dueDate: null }, "user-1");
    expect(data.dueAt).toBeNull();
  });

  it("falls back to a placeholder title when empty", () => {
    const data = notionPageToData({ ...base, title: "" }, "user-1");
    expect(data.title).toBe("(sans titre)");
  });

  it("uses null for a missing url", () => {
    const data = notionPageToData(
      { id: "page-2", title: "No url" },
      "user-1"
    );
    expect(data.url).toBeNull();
  });
});
