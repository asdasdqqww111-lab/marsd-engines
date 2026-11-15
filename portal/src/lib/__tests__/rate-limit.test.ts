import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests up to the limit", () => {
    for (let i = 0; i < 5; i++) {
      expect(rateLimit("k1", 5, 60_000).allowed).toBe(true);
    }
  });

  it("blocks the sixth request within the window", () => {
    for (let i = 0; i < 5; i++) rateLimit("k2", 5, 60_000);
    const r = rateLimit("k2", 5, 60_000);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    for (let i = 0; i < 5; i++) rateLimit("k3", 5, 60_000);
    expect(rateLimit("k4", 5, 60_000).allowed).toBe(true);
  });

  it("resets after the window expires", async () => {
    for (let i = 0; i < 5; i++) rateLimit("k5", 5, 10);
    expect(rateLimit("k5", 5, 10).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 30));
    expect(rateLimit("k5", 5, 10).allowed).toBe(true);
  });
});
