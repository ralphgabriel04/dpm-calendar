import { initTRPC } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/infrastructure/db/client";
import { auth } from "@/infrastructure/auth/config";

/**
 * Context creation for tRPC
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const session = await auth();

  return {
    db,
    session,
    ...opts,
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
