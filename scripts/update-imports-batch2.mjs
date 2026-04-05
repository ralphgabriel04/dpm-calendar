// Batch 2: move components/ui, components/layout|command|theme|language,
// hooks, and lib/utils into src/shared/.
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "glob";

const replacements = [
  [/from "@\/components\/ui\//g, 'from "@/shared/components/ui/'],
  [/from "@\/components\/layout"/g, 'from "@/shared/components/layout"'],
  [/from "@\/components\/layout\//g, 'from "@/shared/components/layout/'],
  [/from "@\/components\/command"/g, 'from "@/shared/components/command"'],
  [/from "@\/components\/command\//g, 'from "@/shared/components/command/'],
  [/from "@\/components\/theme"/g, 'from "@/shared/components/theme"'],
  [/from "@\/components\/theme\//g, 'from "@/shared/components/theme/'],
  [/from "@\/components\/language"/g, 'from "@/shared/components/language"'],
  [/from "@\/components\/language\//g, 'from "@/shared/components/language/'],
  [/from "@\/hooks"/g, 'from "@/shared/hooks"'],
  [/from "@\/hooks\//g, 'from "@/shared/hooks/'],
  [/from "@\/lib\/utils"/g, 'from "@/shared/lib/utils"'],
];

const files = globSync("src/**/*.{ts,tsx}", { cwd: process.cwd() });
let changed = 0;
for (const file of files) {
  let content = readFileSync(file, "utf8");
  const original = content;
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  if (content !== original) {
    writeFileSync(file, content);
    console.log(`  updated: ${file}`);
    changed++;
  }
}
console.log(`\nDone. ${changed} file(s) updated.`);
