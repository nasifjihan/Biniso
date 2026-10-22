import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/lib/rateLimit";

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows the limit, refuses the next call, then refills after the window", () => {
    vi.useFakeTimers();
    const key = "checkout:203.0.113.7";

    expect(rateLimit(key, { limit: 2, windowMs: 1000 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 2, windowMs: 1000 }).ok).toBe(true);

    const blocked = rateLimit(key, { limit: 2, windowMs: 1000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);

    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, { limit: 2, windowMs: 1000 }).ok).toBe(true);
  });

  it("counts each key separately, so one visitor cannot block another", () => {
    expect(rateLimit("track:1.1.1.1", { limit: 1, windowMs: 1000 }).ok).toBe(true);
    expect(rateLimit("track:1.1.1.1", { limit: 1, windowMs: 1000 }).ok).toBe(false);
    expect(rateLimit("track:2.2.2.2", { limit: 1, windowMs: 1000 }).ok).toBe(true);
  });

  it("defaults to ten requests a minute", () => {
    const key = "coupon:9.9.9.9";

    for (let i = 0; i < 10; i += 1) {
      expect(rateLimit(key).ok).toBe(true);
    }
    expect(rateLimit(key).ok).toBe(false);
  });
});
