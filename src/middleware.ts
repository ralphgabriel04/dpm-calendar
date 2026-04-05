import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight auth guard for (dashboard) routes.
 *
 * Runs in the Edge runtime — cannot query the database, so we only check for
 * the *presence* of a NextAuth session cookie. Full session validation still
 * happens in [app/(dashboard)/layout.tsx]. This middleware just short-circuits
 * the round-trip for obviously unauthenticated visitors.
 */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  // legacy next-auth v4 cookie names, kept for safety
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

const PROTECTED_PREFIXES = [
  "/home",
  "/calendar",
  "/tasks",
  "/habits",
  "/goals",
  "/dashboard",
  "/analytics",
  "/rules",
  "/planner",
  "/matrix",
  "/daily-planning",
  "/settings",
  "/onboarding",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSessionCookie = SESSION_COOKIES.some((name) =>
    Boolean(request.cookies.get(name)?.value),
  );

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Exclude Next internals, API routes, and static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)"],
};
