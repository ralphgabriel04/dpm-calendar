import { Chronotype } from "@prisma/client";

/**
 * Chronotype engine.
 *
 * Computes a chronotype from a 12-item Likert (1-5) quiz:
 *  - Items 0-5 measure morningness (higher = lark)
 *  - Items 6-11 measure eveningness (higher = owl)
 *
 * Exposes per-hour energy multipliers (0.0 – 1.5) used by the AI
 * Scheduler to bias focus blocks toward a user's peak circadian window.
 */

export const QUIZ_LENGTH = 12;

/** Score interpretation thresholds (on a -24..+24 balanced scale). */
const LARK_THRESHOLD = 6;
const OWL_THRESHOLD = -6;

/**
 * Compute the chronotype from 12 Likert answers (1-5).
 * Returns UNKNOWN if the input is malformed.
 */
export function computeChronotype(answers: number[]): Chronotype {
  if (!Array.isArray(answers) || answers.length !== QUIZ_LENGTH) {
    return Chronotype.UNKNOWN;
  }
  for (const a of answers) {
    if (!Number.isFinite(a) || a < 1 || a > 5) {
      return Chronotype.UNKNOWN;
    }
  }

  // Morningness: items 0-5, center each Likert value at 0 (range -2..+2)
  const morningness = answers
    .slice(0, 6)
    .reduce((sum, v) => sum + (v - 3), 0);
  // Eveningness: items 6-11
  const eveningness = answers
    .slice(6, 12)
    .reduce((sum, v) => sum + (v - 3), 0);

  // Balanced score: positive = lark, negative = owl
  const score = morningness - eveningness;

  if (score >= LARK_THRESHOLD) return Chronotype.LARK;
  if (score <= OWL_THRESHOLD) return Chronotype.OWL;
  return Chronotype.THIRD_BIRD;
}

/**
 * Returns a Record<hour, multiplier> for all 24 hours.
 * Multipliers range from 0.0 to 1.5 — they are applied on top of
 * an existing energy score to bias slot selection.
 *
 * UNKNOWN returns a flat 1.0 curve (no effect — backward compatible).
 */
export function getEnergyCurveForChronotype(
  chronotype: Chronotype
): Record<number, number> {
  switch (chronotype) {
    case Chronotype.LARK:
      return LARK_CURVE;
    case Chronotype.OWL:
      return OWL_CURVE;
    case Chronotype.THIRD_BIRD:
      return THIRD_BIRD_CURVE;
    case Chronotype.UNKNOWN:
    default:
      return FLAT_CURVE;
  }
}

function buildCurve(values: Partial<Record<number, number>>): Record<number, number> {
  const curve: Record<number, number> = {};
  for (let h = 0; h < 24; h++) {
    curve[h] = values[h] ?? 1.0;
  }
  return curve;
}

/**
 * LARK — peaks early (7-10h), declines sharply after 16h.
 */
export const LARK_CURVE: Record<number, number> = buildCurve({
  0: 0.3, 1: 0.3, 2: 0.3, 3: 0.3, 4: 0.4, 5: 0.6,
  6: 0.9, 7: 1.3, 8: 1.5, 9: 1.5, 10: 1.4, 11: 1.2,
  12: 1.0, 13: 0.9, 14: 1.0, 15: 0.95, 16: 0.8, 17: 0.7,
  18: 0.6, 19: 0.5, 20: 0.4, 21: 0.4, 22: 0.3, 23: 0.3,
});

/**
 * OWL — slow start, peaks late (18-22h).
 */
export const OWL_CURVE: Record<number, number> = buildCurve({
  0: 0.6, 1: 0.5, 2: 0.4, 3: 0.3, 4: 0.3, 5: 0.3,
  6: 0.4, 7: 0.5, 8: 0.6, 9: 0.7, 10: 0.8, 11: 0.9,
  12: 1.0, 13: 1.0, 14: 1.1, 15: 1.2, 16: 1.3, 17: 1.4,
  18: 1.5, 19: 1.5, 20: 1.4, 21: 1.3, 22: 1.1, 23: 0.9,
});

/**
 * THIRD_BIRD — broad midday peak (10-15h), the population majority.
 */
export const THIRD_BIRD_CURVE: Record<number, number> = buildCurve({
  0: 0.3, 1: 0.3, 2: 0.3, 3: 0.3, 4: 0.3, 5: 0.4,
  6: 0.6, 7: 0.8, 8: 1.0, 9: 1.2, 10: 1.4, 11: 1.4,
  12: 1.2, 13: 1.1, 14: 1.3, 15: 1.3, 16: 1.2, 17: 1.0,
  18: 0.8, 19: 0.7, 20: 0.6, 21: 0.5, 22: 0.4, 23: 0.3,
});

/**
 * UNKNOWN — flat 1.0 curve so the scheduler is unaffected.
 */
export const FLAT_CURVE: Record<number, number> = buildCurve({});
