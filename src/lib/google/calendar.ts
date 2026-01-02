import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google-calendar/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiryDate: number | null;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  return {
    accessToken: tokens.access_token || "",
    refreshToken: tokens.refresh_token || null,
    expiryDate: tokens.expiry_date || null,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiryDate: number | null;
}> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token || "",
    expiryDate: credentials.expiry_date || null,
  };
}

export function getCalendarClient(accessToken: string): calendar_v3.Calendar {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string | null;
  backgroundColor?: string | null;
  foregroundColor?: string | null;
  primary?: boolean | null;
  accessRole?: string | null;
}

export async function listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  const calendar = getCalendarClient(accessToken);

  const response = await calendar.calendarList.list();
  const items = response.data.items || [];

  return items.map((item) => ({
    id: item.id || "",
    summary: item.summary || "",
    description: item.description,
    backgroundColor: item.backgroundColor,
    foregroundColor: item.foregroundColor,
    primary: item.primary,
    accessRole: item.accessRole,
  }));
}

export interface GoogleEvent {
  id: string;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  start: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string | null;
  };
  end: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string | null;
  };
  recurrence?: string[] | null;
  status?: string | null;
  etag?: string | null;
  htmlLink?: string | null;
}

export async function listEvents(
  accessToken: string,
  calendarId: string,
  options: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
    syncToken?: string;
  } = {}
): Promise<{
  events: GoogleEvent[];
  nextSyncToken?: string;
}> {
  const calendar = getCalendarClient(accessToken);

  const params: calendar_v3.Params$Resource$Events$List = {
    calendarId,
    singleEvents: true,
    orderBy: "startTime",
  };

  if (options.syncToken) {
    params.syncToken = options.syncToken;
  } else {
    if (options.timeMin) {
      params.timeMin = options.timeMin.toISOString();
    }
    if (options.timeMax) {
      params.timeMax = options.timeMax.toISOString();
    }
  }

  if (options.maxResults) {
    params.maxResults = options.maxResults;
  }

  try {
    const response = await calendar.events.list(params);
    const items = response.data.items || [];

    const events: GoogleEvent[] = items.map((item) => ({
      id: item.id || "",
      summary: item.summary,
      description: item.description,
      location: item.location,
      start: {
        dateTime: item.start?.dateTime,
        date: item.start?.date,
        timeZone: item.start?.timeZone,
      },
      end: {
        dateTime: item.end?.dateTime,
        date: item.end?.date,
        timeZone: item.end?.timeZone,
      },
      recurrence: item.recurrence,
      status: item.status,
      etag: item.etag,
      htmlLink: item.htmlLink,
    }));

    return {
      events,
      nextSyncToken: response.data.nextSyncToken ?? undefined,
    };
  } catch (error: unknown) {
    // If sync token is invalid, do a full sync
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 410
    ) {
      // Token expired, need full sync
      return listEvents(accessToken, calendarId, {
        ...options,
        syncToken: undefined,
      });
    }
    throw error;
  }
}

export async function createEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
    isAllDay?: boolean;
    recurrence?: string[];
  }
): Promise<GoogleEvent> {
  const calendar = getCalendarClient(accessToken);

  const requestBody: calendar_v3.Schema$Event = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: event.isAllDay
      ? { date: event.start.toISOString().split("T")[0] }
      : { dateTime: event.start.toISOString() },
    end: event.isAllDay
      ? { date: event.end.toISOString().split("T")[0] }
      : { dateTime: event.end.toISOString() },
  };

  if (event.recurrence) {
    requestBody.recurrence = event.recurrence;
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody,
  });

  return {
    id: response.data.id || "",
    summary: response.data.summary,
    description: response.data.description,
    location: response.data.location,
    start: {
      dateTime: response.data.start?.dateTime,
      date: response.data.start?.date,
      timeZone: response.data.start?.timeZone,
    },
    end: {
      dateTime: response.data.end?.dateTime,
      date: response.data.end?.date,
      timeZone: response.data.end?.timeZone,
    },
    status: response.data.status,
    etag: response.data.etag,
    htmlLink: response.data.htmlLink,
  };
}

export async function updateEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    location?: string;
    start?: Date;
    end?: Date;
    isAllDay?: boolean;
    recurrence?: string[];
  }
): Promise<GoogleEvent> {
  const calendar = getCalendarClient(accessToken);

  const requestBody: calendar_v3.Schema$Event = {};

  if (event.summary !== undefined) {
    requestBody.summary = event.summary;
  }
  if (event.description !== undefined) {
    requestBody.description = event.description;
  }
  if (event.location !== undefined) {
    requestBody.location = event.location;
  }
  if (event.start && event.end) {
    requestBody.start = event.isAllDay
      ? { date: event.start.toISOString().split("T")[0] }
      : { dateTime: event.start.toISOString() };
    requestBody.end = event.isAllDay
      ? { date: event.end.toISOString().split("T")[0] }
      : { dateTime: event.end.toISOString() };
  }
  if (event.recurrence) {
    requestBody.recurrence = event.recurrence;
  }

  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody,
  });

  return {
    id: response.data.id || "",
    summary: response.data.summary,
    description: response.data.description,
    location: response.data.location,
    start: {
      dateTime: response.data.start?.dateTime,
      date: response.data.start?.date,
      timeZone: response.data.start?.timeZone,
    },
    end: {
      dateTime: response.data.end?.dateTime,
      date: response.data.end?.date,
      timeZone: response.data.end?.timeZone,
    },
    status: response.data.status,
    etag: response.data.etag,
    htmlLink: response.data.htmlLink,
  };
}

export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken);

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}
