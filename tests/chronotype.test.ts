import { describe, it, expect } from "vitest";
import { Chronotype } from "@prisma/client";
import {
  computeChronotype,
  getEnergyCurveForChronotype,
  LARK_CURVE,
  OWL_CURVE,
  FLAT_CURVE,
} from "@/features/wellness/lib/chronotype";

describe("chronotype engine", () => {
  describe("computeChronotype", () => {
    it("returns LARK for strong morningness answers", () => {
      // First 6 = 5 (strongly agree morning), last 6 = 1 (strongly disagree evening)
      const answers = [5, 5, 5, 5, 5, 5, 1, 1, 1, 1, 1, 1];
      expect(computeChronotype(answers)).toBe(Chronotype.LARK);
    });

    it("returns OWL for strong eveningness answers", () => {
      // First 6 = 1, last 6 = 5
      const answers = [1, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5];
      expect(computeChronotype(answers)).toBe(Chronotype.OWL);
    });

    it("returns THIRD_BIRD for neutral answers", () => {
      const answers = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
      expect(computeChronotype(answers)).toBe(Chronotype.THIRD_BIRD);
    });

    it("returns THIRD_BIRD for moderately mixed answers", () => {
      const answers = [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4];
      expect(computeChronotype(answers)).toBe(Chronotype.THIRD_BIRD);
    });

    it("returns UNKNOWN for malformed length", () => {
      expect(computeChronotype([1, 2, 3])).toBe(Chronotype.UNKNOWN);
    });

    it("returns UNKNOWN for out-of-range values", () => {
      const answers = [0, 5, 5, 5, 5, 5, 1, 1, 1, 1, 1, 1];
      expect(computeChronotype(answers)).toBe(Chronotype.UNKNOWN);
    });
  });

  describe("getEnergyCurveForChronotype", () => {
    it("returns LARK_CURVE for LARK", () => {
      expect(getEnergyCurveForChronotype(Chronotype.LARK)).toBe(LARK_CURVE);
    });

    it("returns OWL_CURVE for OWL", () => {
      expect(getEnergyCurveForChronotype(Chronotype.OWL)).toBe(OWL_CURVE);
    });

    it("returns FLAT_CURVE for UNKNOWN (backward compatible)", () => {
      const curve = getEnergyCurveForChronotype(Chronotype.UNKNOWN);
      for (let h = 0; h < 24; h++) {
        expect(curve[h]).toBe(1.0);
      }
    });

    it("LARK peaks in the morning (7-10h) > afternoon (16-20h)", () => {
      const morning = (LARK_CURVE[7] + LARK_CURVE[8] + LARK_CURVE[9] + LARK_CURVE[10]) / 4;
      const evening = (LARK_CURVE[17] + LARK_CURVE[18] + LARK_CURVE[19] + LARK_CURVE[20]) / 4;
      expect(morning).toBeGreaterThan(evening);
    });

    it("OWL peaks in the evening (18-21h) > morning (7-10h)", () => {
      const morning = (OWL_CURVE[7] + OWL_CURVE[8] + OWL_CURVE[9] + OWL_CURVE[10]) / 4;
      const evening = (OWL_CURVE[18] + OWL_CURVE[19] + OWL_CURVE[20] + OWL_CURVE[21]) / 4;
      expect(evening).toBeGreaterThan(morning);
    });

    it("all multipliers are within 0.0 – 1.5", () => {
      for (const curve of [LARK_CURVE, OWL_CURVE, FLAT_CURVE]) {
        for (let h = 0; h < 24; h++) {
          expect(curve[h]).toBeGreaterThanOrEqual(0.0);
          expect(curve[h]).toBeLessThanOrEqual(1.5);
        }
      }
    });
  });

  describe("energy-aware scheduling integration (#93)", () => {
    /**
     * Simulates the scheduler's score calculation: energyScore * chronoMultiplier.
     * Proves that for identical tasks/slots, LARK prefers morning and OWL prefers evening.
     */
    function computeScoreAtHour(
      curve: Record<number, number>,
      hour: number
    ): number {
      const baseEnergyScore = 30; // "optimal" match baseline
      return baseEnergyScore * (curve[hour] ?? 1.0);
    }

    it("LARK user scores 8 AM higher than 7 PM", () => {
      const morning = computeScoreAtHour(LARK_CURVE, 8);
      const evening = computeScoreAtHour(LARK_CURVE, 19);
      expect(morning).toBeGreaterThan(evening);
    });

    it("OWL user scores 7 PM higher than 8 AM", () => {
      const morning = computeScoreAtHour(OWL_CURVE, 8);
      const evening = computeScoreAtHour(OWL_CURVE, 19);
      expect(evening).toBeGreaterThan(morning);
    });

    it("UNKNOWN chronotype yields identical scores across hours (no effect)", () => {
      const morning = computeScoreAtHour(FLAT_CURVE, 8);
      const evening = computeScoreAtHour(FLAT_CURVE, 19);
      expect(morning).toBe(evening);
      expect(morning).toBe(30);
    });
  });
});
