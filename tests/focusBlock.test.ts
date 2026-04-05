import { describe, it, expect } from "vitest";

/**
 * Focus block immovability — pure-logic tests.
 *
 * In aiScheduler.service, blocks whose task carries the "focus" tag are
 * immovable. Scheduling / rescheduling must reject any proposal whose
 * [start, end) overlaps a protected focus block. Energy-overlap rules
 * also apply: two blocks with the same energy tag should not be stacked.
 */

const FOCUS_TAG = "focus";

interface Block {
  id: string;
  startAt: Date;
  endAt: Date;
  tags: string[];
  energy?: "HIGH" | "MEDIUM" | "LOW";
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function isFocusBlock(b: Block): boolean {
  return b.tags.includes(FOCUS_TAG);
}

function canSchedule(
  proposal: { start: Date; end: Date },
  existing: Block[]
): { ok: boolean; reason?: string; conflictWith?: string } {
  for (const b of existing) {
    if (overlaps(proposal.start, proposal.end, b.startAt, b.endAt)) {
      if (isFocusBlock(b)) {
        return {
          ok: false,
          reason: "Conflicts with protected focus block",
          conflictWith: b.id,
        };
      }
    }
  }
  return { ok: true };
}

function hasEnergyOverlap(a: Block, b: Block): boolean {
  if (!a.energy || !b.energy) return false;
  if (a.energy !== b.energy) return false;
  return overlaps(a.startAt, a.endAt, b.startAt, b.endAt);
}

function d(h: number, m = 0): Date {
  return new Date(2024, 0, 1, h, m, 0, 0);
}

describe("focus block immovability", () => {
  it("protected focus block rejects a conflicting proposal", () => {
    const focus: Block = {
      id: "focus-1",
      startAt: d(9),
      endAt: d(11),
      tags: [FOCUS_TAG],
    };
    const proposal = { start: d(10), end: d(10, 30) };
    const res = canSchedule(proposal, [focus]);
    expect(res.ok).toBe(false);
    expect(res.conflictWith).toBe("focus-1");
  });

  it("non-focus block does NOT block scheduling (movable)", () => {
    const regular: Block = {
      id: "reg-1",
      startAt: d(9),
      endAt: d(11),
      tags: ["work"],
    };
    const proposal = { start: d(10), end: d(10, 30) };
    const res = canSchedule(proposal, [regular]);
    expect(res.ok).toBe(true);
  });

  it("adjacent (non-overlapping, end=start) proposals are allowed", () => {
    const focus: Block = {
      id: "focus-1",
      startAt: d(9),
      endAt: d(10),
      tags: [FOCUS_TAG],
    };
    const back = { start: d(10), end: d(11) };
    const front = { start: d(8), end: d(9) };
    expect(canSchedule(back, [focus]).ok).toBe(true);
    expect(canSchedule(front, [focus]).ok).toBe(true);
  });

  it("proposal completely enveloped by focus block is rejected", () => {
    const focus: Block = {
      id: "focus-1",
      startAt: d(9),
      endAt: d(17),
      tags: [FOCUS_TAG],
    };
    const proposal = { start: d(10), end: d(10, 30) };
    expect(canSchedule(proposal, [focus]).ok).toBe(false);
  });

  it("energy overlap detection: same energy + time overlap = true", () => {
    const a: Block = {
      id: "a",
      startAt: d(9),
      endAt: d(10),
      tags: [],
      energy: "HIGH",
    };
    const b: Block = {
      id: "b",
      startAt: d(9, 30),
      endAt: d(10, 30),
      tags: [],
      energy: "HIGH",
    };
    const c: Block = {
      id: "c",
      startAt: d(9, 30),
      endAt: d(10, 30),
      tags: [],
      energy: "LOW",
    };
    expect(hasEnergyOverlap(a, b)).toBe(true);
    expect(hasEnergyOverlap(a, c)).toBe(false); // different energies
    // No time overlap
    const far: Block = {
      id: "far",
      startAt: d(14),
      endAt: d(15),
      tags: [],
      energy: "HIGH",
    };
    expect(hasEnergyOverlap(a, far)).toBe(false);
  });
});
