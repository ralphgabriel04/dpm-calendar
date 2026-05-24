import { initTRPC } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Session } from "next-auth";
import { db } from "@/infrastructure/db/client";
import { auth } from "@/infrastructure/auth/config";

/**
 * Base context type for tRPC
 */
interface CreateContextOptions {
  db: typeof db;
  session: Session | null;
  req: Request;
  resHeaders: Headers;
}

/**
 * Context creation for tRPC API routes (via fetch adapter)
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const session = await auth();

  return {
    db,
    session,
    req: opts.req,
    resHeaders: opts.resHeaders,
  };
};

/**
 * Context creation for server-side tRPC calls (RSC)
 */
export const createServerContext = async (opts: {
  req: Request;
  resHeaders: Headers;
}): Promise<CreateContextOptions> => {
  const currentSession = await auth();

  return {
    db,
    session: currentSession,
    req: opts.req,
    resHeaders: opts.resHeaders,
  };
};

/**
 * tRPC initialization
 */
export const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create router and caller helpers
 */
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
