import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseQuickCapture,
  formatParsedDate,
} from "@/shared/lib/nlp-parser";

describe("NLP Parser", () => {
  describe("parseQuickCapture", () => {
    // Use a fixed date for consistent testing
    let realDate: typeof Date;

    beforeEach(() => {
      realDate = global.Date;
      const mockDate = new Date(2024, 5, 15, 10, 0, 0); // June 15, 2024, 10:00 AM
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
    });

    afterEach(() => {
      vi.useRealTimers();
      global.Date = realDate;
    });

    describe("Empty input", () => {
      it("returns empty result for empty string", () => {
        const result = parseQuickCapture("");

        expect(result.title).toBe("");
        expect(result.parsedDate).toBeNull();
        expect(result.isActionable).toBe(false);
        expect(result.confidence).toBe(0);
      });

      it("returns empty result for whitespace only", () => {
        const result = parseQuickCapture("   ");

        expect(result.title).toBe("");
        expect(result.isActionable).toBe(false);
      });
    });

    describe("French language detection", () => {
      it("detects French from day names", () => {
        const result = parseQuickCapture("Réunion demain");
        expect(result.language).toBe("fr");
      });

      it("detects French from keywords", () => {
        const result = parseQuickCapture("Faire les courses");
        expect(result.language).toBe("fr");
      });

      it("detects French from month names", () => {
        const result = parseQuickCapture("Anniversaire en janvier");
        expect(result.language).toBe("fr");
      });
    });

    describe("English language detection", () => {
      it("detects English from day names", () => {
        const result = parseQuickCapture("Meeting tomorrow");
        expect(result.language).toBe("en");
      });

      it("detects English from keywords", () => {
        const result = parseQuickCapture("Call John at 3pm");
        expect(result.language).toBe("en");
      });

      it("detects English from month names", () => {
        const result = parseQuickCapture("Birthday in January");
        expect(result.language).toBe("en");
      });
    });

    describe("Date parsing - French", () => {
      it("parses 'demain' as tomorrow", () => {
        const result = parseQuickCapture("Réunion demain");

        expect(result.parsedDate).not.toBeNull();
        expect(result.parsedDate?.getDate()).toBe(16); // Tomorrow is June 16
        expect(result.title).toBe("Réunion");
      });

      it("parses 'aujourd'hui' as today", () => {
        const result = parseQuickCapture("Faire aujourd'hui");

        expect(result.parsedDate).not.toBeNull();
        expect(result.parsedDate?.getDate()).toBe(15);
      });

      it("parses time with 'à'", () => {
        const result = parseQuickCapture("Réunion demain à 14h");

        expect(result.parsedDate).not.toBeNull();
        expect(result.parsedDate?.getHours()).toBe(14);
      });
    });

    describe("Date parsing - English", () => {
      it("parses 'tomorrow' correctly", () => {
        const result = parseQuickCapture("Meeting tomorrow");

        expect(result.parsedDate).not.toBeNull();
        expect(result.parsedDate?.getDate()).toBe(16);
        expect(result.title).toBe("Meeting");
      });

      it("parses 'today' correctly", () => {
        const result = parseQuickCapture("Call today");

        expect(result.parsedDate).not.toBeNull();
        expect(result.parsedDate?.getDate()).toBe(15);
      });

      it("parses time with 'at'", () => {
        const result = parseQuickCapture("Meeting tomorrow at 3pm");

        expect(result.parsedDate).not.toBeNull();
        expect(result.parsedDate?.getHours()).toBe(15);
      });

      it("parses time with 'at' in 24h format", () => {
        const result = parseQuickCapture("Meeting tomorrow at 14:30");

        expect(result.parsedDate).not.toBeNull();
        expect(result.parsedDate?.getHours()).toBe(14);
        expect(result.parsedDate?.getMinutes()).toBe(30);
      });
    });

    describe("Title extraction", () => {
      it("extracts title without date portion", () => {
        const result = parseQuickCapture("Buy groceries tomorrow");

        expect(result.title).toBe("Buy groceries");
        expect(result.dateText).toBe("tomorrow");
      });

      it("cleans up trailing prepositions", () => {
        const result = parseQuickCapture("Meeting with team at tomorrow");

        expect(result.title).not.toContain("at");
      });

      it("capitalizes first letter", () => {
        const result = parseQuickCapture("buy milk tomorrow");

        expect(result.title.charAt(0)).toBe("B");
      });
    });

    describe("Actionability detection", () => {
      it("marks task with date as actionable", () => {
        const result = parseQuickCapture("Buy groceries tomorrow");

        expect(result.isActionable).toBe(true);
      });

      it("marks task with action keyword as actionable", () => {
        const result = parseQuickCapture("Finish the report");

        expect(result.isActionable).toBe(true);
      });

      it("marks longer titles as actionable", () => {
        const result = parseQuickCapture("Review pull request for feature");

        expect(result.isActionable).toBe(true);
      });

      it("marks very short titles without keywords as not actionable", () => {
        const result = parseQuickCapture("ab");

        expect(result.isActionable).toBe(false);
      });
    });

    describe("Confidence scoring", () => {
      it("increases confidence with parsed date", () => {
        const withDate = parseQuickCapture("Meeting tomorrow");
        const withoutDate = parseQuickCapture("Meeting");

        expect(withDate.confidence).toBeGreaterThan(withoutDate.confidence);
      });

      it("increases confidence with task keyword", () => {
        const withKeyword = parseQuickCapture("Finish the report");
        const withoutKeyword = parseQuickCapture("Report");

        expect(withKeyword.confidence).toBeGreaterThan(withoutKeyword.confidence);
      });

      it("increases confidence with longer title", () => {
        const longer = parseQuickCapture("Complete the quarterly report");
        const shorter = parseQuickCapture("Report");

        expect(longer.confidence).toBeGreaterThan(shorter.confidence);
      });

      it("caps confidence at 1.0", () => {
        const result = parseQuickCapture("Finish complete the important report tomorrow at 3pm");

        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });

    describe("Original text preservation", () => {
      it("preserves original text", () => {
        const input = "  Meeting tomorrow at 3pm  ";
        const result = parseQuickCapture(input);

        expect(result.originalText).toBe(input);
      });
    });
  });

  describe("formatParsedDate", () => {
    let realDate: typeof Date;

    beforeEach(() => {
      realDate = global.Date;
      const mockDate = new Date(2024, 5, 15, 10, 0, 0); // June 15, 2024
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
    });

    afterEach(() => {
      vi.useRealTimers();
      global.Date = realDate;
    });

    describe("Today formatting", () => {
      it("formats today without time in French", () => {
        const today = new Date(2024, 5, 15, 0, 0, 0);
        const result = formatParsedDate(today, "fr");

        expect(result).toBe("Aujourd'hui");
      });

      it("formats today without time in English", () => {
        const today = new Date(2024, 5, 15, 0, 0, 0);
        const result = formatParsedDate(today, "en");

        expect(result).toBe("Today");
      });

      it("formats today with time in French", () => {
        const today = new Date(2024, 5, 15, 14, 30, 0);
        const result = formatParsedDate(today, "fr");

        expect(result).toContain("Aujourd'hui");
        expect(result).toContain("14");
        expect(result).toContain("30");
      });

      it("formats today with time in English", () => {
        const today = new Date(2024, 5, 15, 14, 30, 0);
        const result = formatParsedDate(today, "en");

        expect(result).toContain("Today");
        expect(result).toContain("at");
      });
    });

    describe("Tomorrow formatting", () => {
      it("formats tomorrow without time in French", () => {
        const tomorrow = new Date(2024, 5, 16, 0, 0, 0);
        const result = formatParsedDate(tomorrow, "fr");

        expect(result).toBe("Demain");
      });

      it("formats tomorrow without time in English", () => {
        const tomorrow = new Date(2024, 5, 16, 0, 0, 0);
        const result = formatParsedDate(tomorrow, "en");

        expect(result).toBe("Tomorrow");
      });

      it("formats tomorrow with time in French", () => {
        const tomorrow = new Date(2024, 5, 16, 9, 0, 0);
        const result = formatParsedDate(tomorrow, "fr");

        expect(result).toContain("Demain");
        expect(result).toContain("09");
      });
    });

    describe("Other dates formatting", () => {
      it("formats other dates with weekday in French", () => {
        const futureDate = new Date(2024, 5, 20, 0, 0, 0); // June 20
        const result = formatParsedDate(futureDate, "fr");

        expect(result).toContain("juin");
        expect(result).toContain("20");
      });

      it("formats other dates with weekday in English", () => {
        const futureDate = new Date(2024, 5, 20, 0, 0, 0); // June 20
        const result = formatParsedDate(futureDate, "en");

        expect(result).toContain("Jun");
        expect(result).toContain("20");
      });

      it("includes time for other dates when present", () => {
        const futureDate = new Date(2024, 5, 20, 15, 45, 0);
        const result = formatParsedDate(futureDate, "en");

        expect(result).toContain("Jun");
        expect(result).toContain("20");
      });
    });
  });
});
