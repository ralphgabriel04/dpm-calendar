import type { Provider } from "@prisma/client";

export interface ProviderInfo {
  provider: Provider;
  label: string;
  requiresOAuth: boolean;
  configured: boolean;
}

/**
 * Whether a provider has the configuration needed to be offered to users.
 * - ICS: always available (no credentials needed).
 * - CALDAV: always available (user supplies Apple ID + app password at connect time).
 * - NOTION / TODOIST / TICKTICK: require OAuth client credentials in env.
 * - GOOGLE / MICROSOFT / LOCAL: handled elsewhere, not configurable here.
 */
export function isProviderConfigured(provider: Provider): boolean {
  switch (provider) {
    case "ICS":
      return true;
    case "CALDAV":
      return true;
    case "NOTION":
      return !!(process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET);
    case "TODOIST":
      return !!(process.env.TODOIST_CLIENT_ID && process.env.TODOIST_CLIENT_SECRET);
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
}[] = [
  { provider: "ICS", label: "Fichier / URL ICS", requiresOAuth: false },
  { provider: "CALDAV", label: "Apple Calendar (CalDAV)", requiresOAuth: false },
  { provider: "NOTION", label: "Notion", requiresOAuth: true },
  { provider: "TODOIST", label: "Todoist", requiresOAuth: true },
  { provider: "TICKTICK", label: "TickTick", requiresOAuth: true },
];

export function getProviderRegistry(): ProviderInfo[] {
  return INTEGRATION_PROVIDERS.map((entry) => ({
    ...entry,
    configured: isProviderConfigured(entry.provider),
  }));
}
