import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAdmin: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

/**
 * Privileged client intended to BYPASS Row Level Security. Use ONLY for trusted,
 * non-user-scoped work: the NextAuth adapter, cron jobs, webhooks, system tasks.
 *
 * Phase A (default): same connection as `db`. The app connects as `postgres`,
 * which has BYPASSRLS on Supabase, so this is equivalent today.
 * Phase B (RLS enforced on the Prisma path): set the runtime DATABASE_URL to the
 * NOBYPASSRLS `app_user` role and set ADMIN_DATABASE_URL to the owner/`postgres`
 * connection so this client keeps its bypass. See README "RLS rollout".
 */
export const dbAdmin =
  globalForPrisma.prismaAdmin ??
  (process.env.ADMIN_DATABASE_URL
    ? new PrismaClient({
        datasourceUrl: process.env.ADMIN_DATABASE_URL,
        log: ["error"],
      })
    : db);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaAdmin = dbAdmin;
}
