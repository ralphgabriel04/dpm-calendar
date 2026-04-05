// One-shot script: update imports for Batch 1 infra migration.
// Safe to re-run — string replacements are idempotent.

import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "glob";

const replacements = [
  // db client
  [/from "@\/server\/db\/client"/g, 'from "@/infrastructure/db/client"'],
  // auth config
  [/from "@\/server\/auth\/config"/g, 'from "@/infrastructure/auth/config"'],
  // trpc client
  [/from "@\/lib\/trpc"/g, 'from "@/infrastructure/trpc/client"'],
  // trpc server — createTRPCContext consumer
  [/from "@\/server\/api\/trpc"/g, 'from "@/infrastructure/trpc/context"'],
];

// Router-specific: split procedures import (routers use relative "../trpc")
const routerReplacements = [
  // Full trio
  [
    /import \{ createTRPCRouter, protectedProcedure, publicProcedure \} from "\.\.\/trpc";/g,
    `import { createTRPCRouter } from "@/infrastructure/trpc/context";\nimport { protectedProcedure, publicProcedure } from "@/infrastructure/trpc/procedures";`,
  ],
  // Router + protected
  [
    /import \{ createTRPCRouter, protectedProcedure \} from "\.\.\/trpc";/g,
    `import { createTRPCRouter } from "@/infrastructure/trpc/context";\nimport { protectedProcedure } from "@/infrastructure/trpc/procedures";`,
  ],
  // Router + public only (just in case)
  [
    /import \{ createTRPCRouter, publicProcedure \} from "\.\.\/trpc";/g,
    `import { createTRPCRouter } from "@/infrastructure/trpc/context";\nimport { publicProcedure } from "@/infrastructure/trpc/procedures";`,
  ],
];

const files = globSync("src/**/*.{ts,tsx}", { cwd: process.cwd() });
let changed = 0;

for (const file of files) {
  // Skip the new infrastructure files and the old server files (will be deleted)
  if (file.startsWith("src/infrastructure/")) continue;
  if (file === "src/server/api/trpc.ts") continue;
  if (file === "src/server/db/client.ts") continue;
  if (file === "src/server/auth/config.ts") continue;
  if (file === "src/server/api/root.ts") continue;
  if (file === "src/lib/trpc.ts") continue;

  let content = readFileSync(file, "utf8");
  const original = content;

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of routerReplacements) {
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    writeFileSync(file, content);
    console.log(`  updated: ${file}`);
    changed++;
  }
}

console.log(`\nDone. ${changed} file(s) updated.`);
