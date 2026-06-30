import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * CSP violation report sink. The policy is sent Report-Only (see next.config.mjs)
 * with `report-uri /api/csp-report`, so browsers POST violations here instead of
 * blocking. Observe these in production logs for 1-2 weeks; once quiet, the policy
 * can be flipped to the enforcing `Content-Security-Policy` header with confidence.
 *
 * Browsers send `application/csp-report` ({ "csp-report": {...} }) for report-uri
 * and `application/reports+json` (an array) for report-to. We accept both.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { "csp-report"?: unknown }
      | unknown[]
      | null;
    const report = Array.isArray(body) ? body : body?.["csp-report"] ?? body;
    if (report) {
      console.warn("[csp-report]", JSON.stringify(report).slice(0, 4000));
    }
  } catch {
    // Never fail a report; just swallow malformed payloads.
  }
  return new NextResponse(null, { status: 204 });
}
