import * as chrono from "chrono-node";

// Custom French parser configuration
const customFrenchChrono = chrono.fr.casual.clone();

// Add common French task keywords
const frenchTaskPatterns = [
  /^faire\s+/i,
  /^finir\s+/i,
  /^terminer\s+/i,
  /^envoyer\s+/i,
  /^appeler\s+/i,
  /^réunion\s+/i,
  /^meeting\s+/i,
  /^rdv\s+/i,
  /^rendez-vous\s+/i,
];

// Add common English task keywords
const englishTaskPatterns = [
  /^do\s+/i,
  /^finish\s+/i,
  /^complete\s+/i,
  /^send\s+/i,
  /^call\s+/i,
  /^meet\s+/i,
  /^meeting\s+/i,
];

export interface ParsedQuickCapture {
  /** The cleaned task title without date/time info */
  title: string;
  /** The original input text */
  originalText: string;
  /** Parsed date/time if detected */
  parsedDate: Date | null;
  /** Human-readable date string */
  dateText: string | null;
  /** Whether the input contains actionable content */
  isActionable: boolean;
  /** Detected language */
  language: "en" | "fr";
  /** Confidence score 0-1 */
  confidence: number;
}

/**
 * Parse natural language input for quick task capture
 * Supports both French and English inputs
 */
export function parseQuickCapture(input: string): ParsedQuickCapture {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return {
      title: "",
      originalText: input,
      parsedDate: null,
      dateText: null,
      isActionable: false,
      language: "fr",
      confidence: 0,
    };
  }

  // Detect language based on input
  const language = detectLanguage(trimmedInput);

  // Parse with appropriate chrono instance
  const parsed = language === "fr"
    ? customFrenchChrono.parse(trimmedInput, new Date(), { forwardDate: true })
    : chrono.en.parse(trimmedInput, new Date(), { forwardDate: true });

  let parsedDate: Date | null = null;
  let dateText: string | null = null;
  let title = trimmedInput;

  if (parsed.length > 0) {
    const result = parsed[0];
    parsedDate = result.start.date();
    dateText = result.text;

    // Remove the date portion from the title
    title = trimmedInput
      .replace(result.text, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Clean up common prepositions left behind
    title = cleanTitle(title, language);
  }

  // Check if it looks like an actionable task
  const patterns = language === "fr" ? frenchTaskPatterns : englishTaskPatterns;
  const hasTaskKeyword = patterns.some((p) => p.test(trimmedInput));
  const hasMinLength = title.length >= 3;
  const isActionable = hasMinLength && (hasTaskKeyword || parsedDate !== null || title.length > 5);

  // Calculate confidence
  let confidence = 0;
  if (parsedDate) confidence += 0.4;
  if (hasTaskKeyword) confidence += 0.3;
  if (hasMinLength) confidence += 0.2;
  if (title.length > 10) confidence += 0.1;

  return {
    title: title || trimmedInput,
    originalText: input,
    parsedDate,
    dateText,
    isActionable,
    language,
    confidence: Math.min(confidence, 1),
  };
}

/**
 * Detect language from input text
 */
function detectLanguage(text: string): "en" | "fr" {
  const frenchIndicators = [
    /\b(demain|aujourd'hui|hier|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i,
    /\b(faire|finir|terminer|envoyer|appeler|réunion|rdv)\b/i,
    /\b(à|au|aux|dans|pour|avec|chez)\b/i,
    /\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i,
    /\b(prochain|prochaine|semaine|mois)\b/i,
  ];

  const englishIndicators = [
    /\b(tomorrow|today|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(do|finish|complete|send|call|meeting|at)\b/i,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
    /\b(next|this|week|month)\b/i,
  ];

  const frenchScore = frenchIndicators.filter((r) => r.test(text)).length;
  const englishScore = englishIndicators.filter((r) => r.test(text)).length;

  return frenchScore >= englishScore ? "fr" : "en";
}

/**
 * Clean up title after removing date portion
 */
function cleanTitle(title: string, language: "en" | "fr"): string {
  const frenchPrepositions = /^(à|au|pour|dans|de|du|en|le|la|les)\s+/i;
  const englishPrepositions = /^(at|on|in|for|to|the|by)\s+/i;

  const preposition = language === "fr" ? frenchPrepositions : englishPrepositions;

  // Remove leading prepositions
  let cleaned = title.replace(preposition, "");

  // Remove trailing prepositions
  const trailingFr = /\s+(à|au|pour|dans|de|du|en|le|la|les)$/i;
  const trailingEn = /\s+(at|on|in|for|to|the|by)$/i;
  cleaned = cleaned.replace(language === "fr" ? trailingFr : trailingEn, "");

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned.trim();
}

/**
 * Format a date for display
 */
export function formatParsedDate(date: Date, language: "en" | "fr"): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = isSameDay(date, now);
  const isTomorrow = isSameDay(date, tomorrow);

  const timeStr = date.toLocaleTimeString(language === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: language === "en",
  });

  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;

  if (isToday) {
    return hasTime
      ? language === "fr" ? `Aujourd'hui à ${timeStr}` : `Today at ${timeStr}`
      : language === "fr" ? "Aujourd'hui" : "Today";
  }

  if (isTomorrow) {
    return hasTime
      ? language === "fr" ? `Demain à ${timeStr}` : `Tomorrow at ${timeStr}`
      : language === "fr" ? "Demain" : "Tomorrow";
  }

  const dateStr = date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return hasTime ? `${dateStr}, ${timeStr}` : dateStr;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
