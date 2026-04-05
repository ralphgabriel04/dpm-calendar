import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  getRateLimitStatus,
  resetRateLimit,
  clearAllRateLimits,
  RATE_LIMITS,
} from "@/lib/rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  it("allows requests under the limit and decrements remaining", () => {
    const r1 = checkRateLimit("user-1", "mutation");
    expect(r1.success).toBe(true);
    expect(r1.limit).toBe(RATE_LIMITS.mutation.limit);
    expect(r1.remaining).toBe(RATE_LIMITS.mutation.limit - 1);

    const r2 = checkRateLimit("user-1", "mutation");
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(RATE_LIMITS.mutation.limit - 2);
  });

  it("returns success=false once the limit is exceeded (login: 5/15min)", () => {
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit("attacker", "login");
      expect(res.success).toBe(true);
    }
    const sixth = checkRateLimit("attacker", "login");
    expect(sixth.success).toBe(false);
    expect(sixth.remaining).toBe(0);
  });

  it("maintains independent buckets per user/identifier", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("alice", "login");
    const aliceBlocked = checkRateLimit("alice", "login");
    expect(aliceBlocked.success).toBe(false);

    // Bob should still be unaffected
    const bobFirst = checkRateLimit("bob", "login");
    expect(bobFirst.success).toBe(true);
    expect(bobFirst.remaining).toBe(RATE_LIMITS.login.limit - 1);
  });

  it("window math: resetAt is within [now+windowMs - slack, now+windowMs + slack]", () => {
    const before = Date.now();
    const res = checkRateLimit("u", "query");
    const after = Date.now();
    const resetAt = res.resetAt.getTime();
    const slack = 50; // ms
    expect(resetAt).toBeGreaterThanOrEqual(
      before + RATE_LIMITS.query.windowMs - slack
    );
    expect(resetAt).toBeLessThanOrEqual(
      after + RATE_LIMITS.query.windowMs + slack
    );
  });

  it("getRateLimitStatus does not consume quota; resetRateLimit restores it", () => {
    checkRateLimit("alice", "sync");
    checkRateLimit("alice", "sync");
    const status1 = getRateLimitStatus("alice", "sync");
    expect(status1.remaining).toBe(RATE_LIMITS.sync.limit - 2);
    // call again, still same
    const status2 = getRateLimitStatus("alice", "sync");
    expect(status2.remaining).toBe(RATE_LIMITS.sync.limit - 2);

    resetRateLimit("alice", "sync");
    const afterReset = getRateLimitStatus("alice", "sync");
    expect(afterReset.remaining).toBe(RATE_LIMITS.sync.limit);
    expect(afterReset.success).toBe(true);
  });
});
