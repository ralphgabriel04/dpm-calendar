import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { createCallerFactory, createServerContext } from "./context";
import { appRouter } from "@/infrastructure/api/root";

/**
 * Create a server-side tRPC caller for use in Server Components.
 * Uses React's cache() to deduplicate calls within a single render.
 */
const createCaller = createCallerFactory(appRouter);

export const api = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  const ctx = await createServerContext({
    req: { headers: heads } as Request,
    resHeaders: new Headers(),
  });

  return createCaller(ctx);
});
