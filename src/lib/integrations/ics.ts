/**
 * Dependency-free iCalendar (.ics) parser (RFC 5545, best effort).
 *
 * Limitations:
 * - TZID parameters are NOT converted to UTC. The wall-clock time is parsed as-is
 *   (treated as local time when no "Z" suffix is present). Consumers needing exact
 *   timezone conversion should resolve the TZID themselves.
 * - RRULE is captured as a raw string and never expanded.
 * - Only a small subset of properties is read.
 */

export interface ParsedIcsEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  rrule?: string;
}

interface ParsedDate {
  date: Date;
  isAllDay: boolean;
}

/**
 * Unfold folded lines per RFC 5545: a CRLF (or LF) immediately followed by a
 * space or tab is a continuation of the previous line.
 */
function unfold(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = normalized.split("\n");
  const lines: string[] = [];

  for (const raw of rawLines) {
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += raw.slice(1);
    } else {
      lines.push(raw);
    }
  }

  return lines;
}

/**
 * Split a property line into its name (with params) and its value, on the first colon.
 * Returns { name, params, value } where name is uppercased and params is the raw
 * parameter string (lowercased keys are not normalized here).
 */
function splitLine(line: string): { name: string; params: string; value: string } | null {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) {
    return null;
  }

  const namePart = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);

  const semiIdx = namePart.indexOf(";");
  if (semiIdx === -1) {
    return { name: namePart.toUpperCase(), params: "", value };
  }

  return {
    name: namePart.slice(0, semiIdx).toUpperCase(),
    params: namePart.slice(semiIdx + 1),
    value,
  };
}

/**
 * Unescape text values per RFC 5545.
 */
function unescapeText(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === "\\" && i + 1 < value.length) {
      const next = value[i + 1];
      if (next === "n" || next === "N") {
        out += "\n";
        i++;
      } else if (next === ",") {
        out += ",";
        i++;
      } else if (next === ";") {
        out += ";";
        i++;
      } else if (next === "\\") {
        out += "\\";
        i++;
      } else {
        out += ch;
      }
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Parse an iCalendar date/date-time value.
 * - `YYYYMMDD` (8 chars) => all-day, local midnight.
 * - `YYYYMMDDTHHMMSSZ` => UTC.
 * - `YYYYMMDDTHHMMSS` (no Z) => local wall-clock time.
 * Returns null on malformed input.
 */
function parseIcsDate(value: string): ParsedDate | null {
  const v = value.trim();

  // All-day: YYYYMMDD
  if (/^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const m = Number(v.slice(4, 6));
    const d = Number(v.slice(6, 8));
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) {
      return null;
    }
    return { date, isAllDay: true };
  }

  // Date-time: YYYYMMDDTHHMMSS optionally with trailing Z
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(v);
  if (!match) {
    return null;
  }

  const y = Number(match[1]);
  const mo = Number(match[2]);
  const d = Number(match[3]);
  const h = Number(match[4]);
  const mi = Number(match[5]);
  const s = Number(match[6]);
  const isUtc = match[7] === "Z";

  const date = isUtc
    ? new Date(Date.UTC(y, mo - 1, d, h, mi, s))
    : new Date(y, mo - 1, d, h, mi, s);

  if (isNaN(date.getTime())) {
    return null;
  }

  return { date, isAllDay: false };
}

/**
 * Parse a simple ISO 8601 duration (e.g. PT1H, PT30M, P1D, P1DT2H) into milliseconds.
 * Best effort: supports weeks, days, hours, minutes, seconds. Returns null on failure.
 */
function parseDuration(value: string): number | null {
  const v = value.trim();
  const match = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v);
  if (!match) {
    return null;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const weeks = Number(match[2] ?? 0);
  const days = Number(match[3] ?? 0);
  const hours = Number(match[4] ?? 0);
  const minutes = Number(match[5] ?? 0);
  const seconds = Number(match[6] ?? 0);

  if (!match[2] && !match[3] && !match[4] && !match[5] && !match[6]) {
    return null;
  }

  const ms =
    weeks * 7 * 24 * 60 * 60 * 1000 +
    days * 24 * 60 * 60 * 1000 +
    hours * 60 * 60 * 1000 +
    minutes * 60 * 1000 +
    seconds * 1000;

  return sign * ms;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/**
 * Parse iCalendar text into a list of events. Never throws on malformed input:
 * bad events are skipped and parsing continues.
 */
export function parseIcs(text: string): ParsedIcsEvent[] {
  const events: ParsedIcsEvent[] = [];
  if (!text) {
    return events;
  }

  const lines = unfold(text);
  let inEvent = false;
  let current: Record<string, { params: string; value: string }> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }

    if (trimmed === "END:VEVENT") {
      inEvent = false;
      const event = buildEvent(current);
      if (event) {
        events.push(event);
      }
      current = {};
      continue;
    }

    if (!inEvent) {
      continue;
    }

    const parsed = splitLine(line);
    if (!parsed) {
      continue;
    }

    // Keep the first occurrence of each property (simple, deterministic).
    if (!(parsed.name in current)) {
      current[parsed.name] = { params: parsed.params, value: parsed.value };
    }
  }

  return events;
}

function buildEvent(
  props: Record<string, { params: string; value: string }>,
): ParsedIcsEvent | null {
  const dtstart = props.DTSTART;
  if (!dtstart) {
    return null;
  }

  const start = parseIcsDate(dtstart.value);
  if (!start) {
    return null;
  }

  let endDate: Date;
  if (props.DTEND) {
    const end = parseIcsDate(props.DTEND.value);
    endDate = end ? end.date : defaultEnd(start);
  } else if (props.DURATION) {
    const ms = parseDuration(props.DURATION.value);
    endDate = ms !== null ? new Date(start.date.getTime() + ms) : defaultEnd(start);
  } else {
    endDate = defaultEnd(start);
  }

  const event: ParsedIcsEvent = {
    uid: props.UID ? props.UID.value.trim() : "",
    title: props.SUMMARY ? unescapeText(props.SUMMARY.value) : "",
    startAt: start.date,
    endAt: endDate,
    isAllDay: start.isAllDay,
  };

  if (props.DESCRIPTION) {
    event.description = unescapeText(props.DESCRIPTION.value);
  }
  if (props.LOCATION) {
    event.location = unescapeText(props.LOCATION.value);
  }
  if (props.RRULE) {
    event.rrule = props.RRULE.value.trim();
  }

  return event;
}

function defaultEnd(start: ParsedDate): Date {
  const delta = start.isAllDay ? DAY_MS : HOUR_MS;
  return new Date(start.date.getTime() + delta);
}
