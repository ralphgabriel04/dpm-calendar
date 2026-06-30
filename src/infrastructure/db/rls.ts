import { Prisma } from "@prisma/client";
import { db } from "./client";

/**
 * Run `fn` with Postgres Row Level Security scoped to a single user.
 *
 * It opens one interactive transaction, sets the request-scoped GUC
 * `app.current_user_id` (read by the RLS policies created in
 * prisma/migrations/20260630000000_add_rls_policies), and runs the callback on
 * that transaction client — so every query inside is owner-checked at the DB
 * layer, independent of the tRPC `userId` filtering.
 *
 * `SET LOCAL` / `set_config(..., true)` is transaction-scoped, which is the only
 * pooler-safe way to carry per-user identity over a shared connection.
 *
 * This is the "Phase B" enforcement seam. It only changes behavior once the
 * runtime DATABASE_URL connects as the NOBYPASSRLS `app_user` role; while the
 * app connects as `postgres` (BYPASSRLS) it is a transparent wrapper.
 * See README "RLS rollout".
 */
export function withRls<T>(
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(async (tx) => {
    // Parameterized to prevent injection; userId is the authenticated user id.
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return fn(tx);
  });
}
