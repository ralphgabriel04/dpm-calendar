import { describe, it, expect } from "vitest";
import en from "../messages/en.json";
import fr from "../messages/fr.json";

/**
 * Guards FR/EN message parity: every translation key must exist in BOTH locales.
 * Missing keys only surface at runtime in next-intl, so this catches drift in CI.
 */
function keyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? keyPaths(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );
}

describe("i18n message parity", () => {
  it("fr and en have identical key structures", () => {
    const frKeys = new Set(keyPaths(fr as Record<string, unknown>));
    const enKeys = new Set(keyPaths(en as Record<string, unknown>));
    const frOnly = Array.from(frKeys)
      .filter((k) => !enKeys.has(k))
      .sort();
    const enOnly = Array.from(enKeys)
      .filter((k) => !frKeys.has(k))
      .sort();
    expect({ frOnly, enOnly }).toEqual({ frOnly: [], enOnly: [] });
  });
});
