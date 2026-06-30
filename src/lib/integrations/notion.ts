/**
 * Notion API client (OAuth bearer token).
 *
 * The access token is obtained by a parallel OAuth flow and stored encrypted on
 * the ExternalIntegration. Here we use it as a Bearer credential against the
 * Notion search endpoint (POST /v1/search) to list pages the integration can
 * see, then project each page into a lightweight DPM task.
 *
 * Title extraction is best-effort: Notion pages carry their title in a
 * "title"-type property whose name varies ("Name", "Title", ...). We find the
 * first title-type property and join its rich_text plain_text segments.
 *
 * Due-date extraction is best-effort: the first "date"-type property's start is
 * used if present.
 *
 * Limitations:
 * - Pagination is not followed; only the first page of search results is read.
 * - Database rows vs. standalone pages are treated uniformly.
 */

export interface NotionPage {
  id: string;
  title: string;
  url?: string;
  dueDate?: string | null;
}

interface NotionRichText {
  plain_text?: string;
}

interface NotionProperty {
  type?: string;
  title?: NotionRichText[];
  date?: { start?: string | null } | null;
}

interface NotionResult {
  id: string;
  url?: string;
  properties?: Record<string, NotionProperty>;
}

function extractTitle(properties?: Record<string, NotionProperty>): string {
  if (!properties) return "";
  for (const prop of Object.values(properties)) {
    if (prop?.type === "title" && Array.isArray(prop.title)) {
      const text = prop.title
        .map((seg) => seg.plain_text ?? "")
        .join("")
        .trim();
      if (text) return text;
    }
  }
  return "";
}

function extractDueDate(
  properties?: Record<string, NotionProperty>
): string | null {
  if (!properties) return null;
  for (const prop of Object.values(properties)) {
    if (prop?.type === "date" && prop.date?.start) {
      return prop.date.start;
    }
  }
  return null;
}

/**
 * Fetch the pages the Notion integration can access. The token doubles as
 * validation: an invalid token yields a non-2xx which we surface as a
 * NOTION_<status> error.
 */
export async function fetchNotionPages(token: string): Promise<NotionPage[]> {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: { property: "object", value: "page" },
    }),
  });
  if (!res.ok) throw new Error(`NOTION_${res.status}`);

  const body: { results?: NotionResult[] } = await res.json();
  const results = body.results ?? [];

  return results.map((r) => ({
    id: r.id,
    title: extractTitle(r.properties),
    url: r.url,
    dueDate: extractDueDate(r.properties),
  }));
}

/**
 * Project a Notion page onto the shape of a DPM Task create payload. The Task
 * model has a `url` field, so we carry the Notion page URL through.
 */
export function notionPageToData(p: NotionPage, userId: string) {
  return {
    userId,
    title: p.title || "(sans titre)",
    url: p.url ?? null,
    dueAt: p.dueDate ? new Date(p.dueDate) : null,
    status: "TODO" as const,
  };
}
