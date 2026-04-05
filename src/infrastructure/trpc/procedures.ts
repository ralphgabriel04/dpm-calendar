import { TRPCError } from "@trpc/server";
import { t } from "./context";
import { checkRateLimit, type RateLimitType } from "@/lib/rateLimit";

/**
 * Get client identifier for rate limiting.
 * Uses userId if authenticated, otherwise falls back to IP address.
 * SECURITY: IP fallback ensures unauthenticated requests are also rate limited.
 */
function getClientIdentifier(ctx: { session?: { user?: { id?: string } } | null; req: Request }): string {
  // Prefer userId for authenticated requests (more accurate)
  if (ctx.session?.user?.id) {
    return `user:${ctx.session.user.id}`;
  }

  // Fall back to IP for unauthenticated requests
  const forwarded = ctx.req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}

/**
 * Rate limiting middleware factory.
 * SECURITY: Prevents abuse by limiting request frequency.
 */
function createRateLimitMiddleware(type: RateLimitType) {
  return t.middleware(({ ctx, next }) => {
    const identifier = getClientIdentifier(ctx);
    const result = checkRateLimit(identifier, type);

    if (!result.success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again after ${result.resetAt.toISOString()}`,
      });
    }

    return next();
  });
}

// Pre-built rate limit middlewares
const queryRateLimit = createRateLimitMiddleware("query");
const mutationRateLimit = createRateLimitMiddleware("mutation");
const syncRateLimit = createRateLimitMiddleware("sync");
const loginRateLimit = createRateLimitMiddleware("login");

/**
 * Public procedure (no auth required)
 * Rate limited: 300 requests/min per IP
 */
export const publicProcedure = t.procedure.use(queryRateLimit);

/**
 * Public procedure with login rate limit (stricter)
 * Rate limited: 5 requests/15min per IP
 * SECURITY: Prevents brute force attacks on login
 */
export const loginProcedure = t.procedure.use(loginRateLimit);

/**
 * Auth check middleware - reusable for protected procedures
 */
const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user || !ctx.session.user.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: {
        ...ctx.session,
        user: {
          ...ctx.session.user,
          id: ctx.session.user.id,
        },
      },
    },
  });
});

/**
 * Protected procedure (auth required)
 * Rate limited: 300 queries/min per user
 */
export const protectedProcedure = t.procedure
  .use(authMiddleware)
  .use(queryRateLimit);

/**
 * Protected mutation procedure (auth required, stricter rate limit)
 * Rate limited: 100 mutations/min per user
 * SECURITY: Write operations have stricter limits to prevent spam
 */
export const protectedMutationProcedure = t.procedure
  .use(authMiddleware)
  .use(mutationRateLimit);

/**
 * Protected sync procedure (auth required, sync-specific rate limit)
 * Rate limited: 10 syncs/5min per user
 * SECURITY: Sync operations are expensive and hit external APIs
 */
export const protectedSyncProcedure = t.procedure
  .use(authMiddleware)
  .use(syncRateLimit);
