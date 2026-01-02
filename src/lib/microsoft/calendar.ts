import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

const SCOPES = [
  "Calendars.ReadWrite",
  "offline_access",
  "User.Read",
];

function getMsalConfig() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = "common"; // Support both personal and work accounts

  if (!clientId || !clientSecret) {
    throw new Error("Missing Microsoft OAuth credentials");
  }

  return {
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  };
}

function getRedirectUri() {
  return `${process.env.NEXTAUTH_URL}/api/auth/microsoft-calendar/callback`;
}

export function getAuthUrl(): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing Microsoft client ID");
  }

  const redirectUri = getRedirectUri();
  const scopes = SCOPES.join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes,
    response_mode: "query",
    prompt: "consent",
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiryDate: number | null;
}> {
  const msalConfig = getMsalConfig();
  const cca = new ConfidentialClientApplication(msalConfig);

  const result = await cca.acquireTokenByCode({
    code,
    scopes: SCOPES,
    redirectUri: getRedirectUri(),
  });

  return {
    accessToken: result?.accessToken || "",
    refreshToken: null, // MSAL handles refresh internally
    expiryDate: result?.expiresOn ? result.expiresOn.getTime() : null,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiryDate: number | null;
}> {
  // For Microsoft, we use the refresh token directly with the token endpoint
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Microsoft OAuth credentials");
  }

  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: SCOPES.join(" "),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || "Failed to refresh token");
  }

  return {
    accessToken: data.access_token,
    expiryDate: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
  };
}

function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

export interface MicrosoftCalendar {
  id: string;
  name: string;
  color?: string | null;
  isDefaultCalendar?: boolean | null;
  canEdit?: boolean | null;
  owner?: {
    name?: string | null;
    address?: string | null;
  } | null;
}

export async function listCalendars(accessToken: string): Promise<MicrosoftCalendar[]> {
  const client = getGraphClient(accessToken);

  const response = await client.api("/me/calendars").get();
  const calendars = response.value || [];

  return calendars.map((cal: Record<string, unknown>) => ({
    id: cal.id as string,
    name: (cal.name as string) || "",
    color: cal.color as string | null,
    isDefaultCalendar: cal.isDefaultCalendar as boolean,
    canEdit: cal.canEdit as boolean,
    owner: cal.owner as { name?: string | null; address?: string | null } | null,
  }));
}

export async function getUserEmail(accessToken: string): Promise<string> {
  const client = getGraphClient(accessToken);
  const user = await client.api("/me").select("mail,userPrincipalName").get();
  return user.mail || user.userPrincipalName || "unknown@outlook.com";
}

export interface MicrosoftEvent {
  id: string;
  subject?: string | null;
  body?: {
    content?: string | null;
    contentType?: string | null;
  } | null;
  bodyPreview?: string | null;
  location?: {
    displayName?: string | null;
  } | null;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay?: boolean | null;
  isCancelled?: boolean | null;
  recurrence?: Record<string, unknown> | null;
  lastModifiedDateTime?: string | null;
  changeKey?: string | null;
  webLink?: string | null;
}

export async function listEvents(
  accessToken: string,
  calendarId: string,
  options: {
    startDateTime?: Date;
    endDateTime?: Date;
    maxResults?: number;
    deltaToken?: string;
  } = {}
): Promise<{
  events: MicrosoftEvent[];
  deltaLink?: string;
}> {
  const client = getGraphClient(accessToken);

  // Build the request
  let request = client.api(`/me/calendars/${calendarId}/events`);

  if (options.deltaToken) {
    // Use delta query for incremental sync
    request = client.api(`/me/calendars/${calendarId}/events/delta`)
      .query({ $deltatoken: options.deltaToken });
  } else {
    // Full sync with date filters
    const filters = [];
    if (options.startDateTime) {
      filters.push(`start/dateTime ge '${options.startDateTime.toISOString()}'`);
    }
    if (options.endDateTime) {
      filters.push(`end/dateTime le '${options.endDateTime.toISOString()}'`);
    }
    if (filters.length > 0) {
      request = request.filter(filters.join(" and "));
    }
  }

  if (options.maxResults) {
    request = request.top(options.maxResults);
  }

  request = request.select(
    "id,subject,body,bodyPreview,location,start,end,isAllDay,isCancelled,recurrence,lastModifiedDateTime,changeKey,webLink"
  );

  const response = await request.get();
  const events = (response.value || []).map((event: Record<string, unknown>) => ({
    id: event.id as string,
    subject: event.subject as string | null,
    body: event.body as { content?: string | null; contentType?: string | null } | null,
    bodyPreview: event.bodyPreview as string | null,
    location: event.location as { displayName?: string | null } | null,
    start: event.start as { dateTime: string; timeZone: string },
    end: event.end as { dateTime: string; timeZone: string },
    isAllDay: event.isAllDay as boolean | null,
    isCancelled: event.isCancelled as boolean | null,
    recurrence: event.recurrence as Record<string, unknown> | null,
    lastModifiedDateTime: event.lastModifiedDateTime as string | null,
    changeKey: event.changeKey as string | null,
    webLink: event.webLink as string | null,
  }));

  // Extract delta link for next sync
  let deltaLink: string | undefined;
  if (response["@odata.deltaLink"]) {
    const url = new URL(response["@odata.deltaLink"]);
    deltaLink = url.searchParams.get("$deltatoken") || undefined;
  }

  return { events, deltaLink };
}

export async function createEvent(
  accessToken: string,
  calendarId: string,
  event: {
    subject: string;
    body?: string;
    location?: string;
    start: Date;
    end: Date;
    isAllDay?: boolean;
    timeZone?: string;
  }
): Promise<MicrosoftEvent> {
  const client = getGraphClient(accessToken);
  const timeZone = event.timeZone || "UTC";

  const eventData: Record<string, unknown> = {
    subject: event.subject,
    start: {
      dateTime: event.start.toISOString(),
      timeZone,
    },
    end: {
      dateTime: event.end.toISOString(),
      timeZone,
    },
    isAllDay: event.isAllDay || false,
  };

  if (event.body) {
    eventData.body = {
      contentType: "text",
      content: event.body,
    };
  }

  if (event.location) {
    eventData.location = {
      displayName: event.location,
    };
  }

  const response = await client.api(`/me/calendars/${calendarId}/events`).post(eventData);

  return {
    id: response.id,
    subject: response.subject,
    body: response.body,
    location: response.location,
    start: response.start,
    end: response.end,
    isAllDay: response.isAllDay,
    lastModifiedDateTime: response.lastModifiedDateTime,
    webLink: response.webLink,
  };
}

export async function updateEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: {
    subject?: string;
    body?: string;
    location?: string;
    start?: Date;
    end?: Date;
    isAllDay?: boolean;
    timeZone?: string;
  }
): Promise<MicrosoftEvent> {
  const client = getGraphClient(accessToken);
  const timeZone = event.timeZone || "UTC";

  const eventData: Record<string, unknown> = {};

  if (event.subject !== undefined) {
    eventData.subject = event.subject;
  }
  if (event.body !== undefined) {
    eventData.body = {
      contentType: "text",
      content: event.body,
    };
  }
  if (event.location !== undefined) {
    eventData.location = {
      displayName: event.location,
    };
  }
  if (event.start && event.end) {
    eventData.start = {
      dateTime: event.start.toISOString(),
      timeZone,
    };
    eventData.end = {
      dateTime: event.end.toISOString(),
      timeZone,
    };
  }
  if (event.isAllDay !== undefined) {
    eventData.isAllDay = event.isAllDay;
  }

  const response = await client.api(`/me/calendars/${calendarId}/events/${eventId}`).patch(eventData);

  return {
    id: response.id,
    subject: response.subject,
    body: response.body,
    location: response.location,
    start: response.start,
    end: response.end,
    isAllDay: response.isAllDay,
    lastModifiedDateTime: response.lastModifiedDateTime,
    webLink: response.webLink,
  };
}

export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const client = getGraphClient(accessToken);
  await client.api(`/me/calendars/${calendarId}/events/${eventId}`).delete();
}
