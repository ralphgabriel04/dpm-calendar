import type { Provider } from "@prisma/client";

export type ConnectVia = "ics" | "token" | "oauth" | "caldav";

export interface ProviderInfo {
  provider: Provider;
  label: string;
  requiresOAuth: boolean;
  connectVia: ConnectVia;
  configured: boolean;
}

/**
 * Whether a provider has the configuration needed to be offered to users.
 * - ICS: always available (no credentials needed).
 * - CALDAV: always available (user supplies Apple ID + app password at connect time).
 * - TODOIST: always available (user pastes a personal API token at connect time).
 * - NOTION / TICKTICK: require OAuth client credentials in env.
 * - GOOGLE / MICROSOFT / LOCAL: handled elsewhere, not configurable here.
 */
export function isProviderConfigured(provider: Provider): boolean {
  switch (provider) {
    case "ICS":
      return true;
    case "CALDAV":
      return true;
    case "TODOIST":
      // Token-based: the user supplies their personal API token, no env needed.
      return true;
    case "NOTION":
      return !!(process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET);
    case "TICKTICK":
      return !!(process.env.TICKTICK_CLIENT_ID && process.env.TICKTICK_CLIENT_SECRET);
    default:
      return false;
  }
}

export const INTEGRATION_PROVIDERS: {
  provider: Provider;
  label: string;
  requiresOAuth: boolean;
  connectVia: ConnectVia;
}[] = [
  { provider: "ICS", label: "Fichier / URL ICS", requiresOAuth: false, connectVia: "ics" },
  { provider: "CALDAV", label: "Apple Calendar (CalDAV)", requiresOAuth: false, connectVia: "caldav" },
  { provider: "NOTION", label: "Notion", requiresOAuth: true, connectVia: "oauth" },
  { provider: "TODOIST", label: "Todoist", requiresOAuth: false, connectVia: "token" },
  { provider: "TICKTICK", label: "TickTick", requiresOAuth: true, connectVia: "oauth" },
];

export function getProviderRegistry(): ProviderInfo[] {
  return INTEGRATION_PROVIDERS.map((entry) => ({
    ...entry,
    configured: isProviderConfigured(entry.provider),
  }));
}
