"use client";

import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "@/infrastructure/api/root";

export const trpc = createTRPCReact<AppRouter>();
