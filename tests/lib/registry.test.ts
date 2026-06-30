import { describe, it, expect, afterEach } from "vitest";
import {
  isProviderConfigured,
  getProviderRegistry,
  INTEGRATION_PROVIDERS,
} from "@/features/integrations/lib/registry";

const OAUTH_ENV_KEYS = [
  "NOTION_CLIENT_ID",
  "NOTION_CLIENT_SECRET",
  "TODOIST_CLIENT_ID",
  "TODOIST_CLIENT_SECRET",
  "TICKTICK_CLIENT_ID",
  "TICKTICK_CLIENT_SECRET",
] as const;

function clearOAuthEnv(): void {
  for (const key of OAUTH_ENV_KEYS) {
    delete process.env[key];
  }
}

describe("registry", () => {
  const original: Record<string, string | undefined> = {};

  for (const key of OAUTH_ENV_KEYS) {
    original[key] = process.env[key];
  }

  afterEach(() => {
    for (const key of OAUTH_ENV_KEYS) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  });

  describe("isProviderConfigured", () => {
    it("returns true for ICS regardless of env", () => {
      clearOAuthEnv();
      expect(isProviderConfigured("ICS")).toBe(true);
    });

    it("returns true for CALDAV regardless of env", () => {
      clearOAuthEnv();
      expect(isProviderConfigured("CALDAV")).toBe(true);
    });

    it("returns false for OAuth providers when env is unset", () => {
      clearOAuthEnv();
      expect(isProviderConfigured("NOTION")).toBe(false);
      expect(isProviderConfigured("TODOIST")).toBe(false);
      expect(isProviderConfigured("TICKTICK")).toBe(false);
    });

    it("returns true for NOTION when both credentials are set", () => {
      clearOAuthEnv();
      process.env.NOTION_CLIENT_ID = "id";
      process.env.NOTION_CLIENT_SECRET = "secret";
      expect(isProviderConfigured("NOTION")).toBe(true);
    });

    it("returns true for TODOIST when both credentials are set", () => {
      clearOAuthEnv();
      process.env.TODOIST_CLIENT_ID = "id";
      process.env.TODOIST_CLIENT_SECRET = "secret";
      expect(isProviderConfigured("TODOIST")).toBe(true);
    });

    it("returns true for TICKTICK when both credentials are set", () => {
      clearOAuthEnv();
      process.env.TICKTICK_CLIENT_ID = "id";
      process.env.TICKTICK_CLIENT_SECRET = "secret";
      expect(isProviderConfigured("TICKTICK")).toBe(true);
    });

    it("returns false when only one credential of a pair is set", () => {
      clearOAuthEnv();
      process.env.NOTION_CLIENT_ID = "id";
      expect(isProviderConfigured("NOTION")).toBe(false);
    });

    it("returns false for providers handled elsewhere (GOOGLE/MICROSOFT/LOCAL)", () => {
      expect(isProviderConfigured("GOOGLE")).toBe(false);
      expect(isProviderConfigured("MICROSOFT")).toBe(false);
      expect(isProviderConfigured("LOCAL")).toBe(false);
    });
  });

  describe("getProviderRegistry", () => {
    it("returns one entry per integration provider with a configured flag", () => {
      clearOAuthEnv();
      const registry = getProviderRegistry();
      expect(registry).toHaveLength(INTEGRATION_PROVIDERS.length);

      for (const entry of registry) {
        expect(entry).toHaveProperty("provider");
        expect(entry).toHaveProperty("label");
        expect(entry).toHaveProperty("requiresOAuth");
        expect(entry).toHaveProperty("configured");
        expect(typeof entry.configured).toBe("boolean");
      }
    });

    it("reflects env presence in the configured flag", () => {
      clearOAuthEnv();
      process.env.NOTION_CLIENT_ID = "id";
      process.env.NOTION_CLIENT_SECRET = "secret";

      const registry = getProviderRegistry();
      const notion = registry.find((e) => e.provider === "NOTION");
      const todoist = registry.find((e) => e.provider === "TODOIST");

      expect(notion?.configured).toBe(true);
      expect(todoist?.configured).toBe(false);
    });

    it("always marks ICS and CALDAV as configured", () => {
      clearOAuthEnv();
      const registry = getProviderRegistry();
      expect(registry.find((e) => e.provider === "ICS")?.configured).toBe(true);
      expect(registry.find((e) => e.provider === "CALDAV")?.configured).toBe(true);
    });
  });
});
