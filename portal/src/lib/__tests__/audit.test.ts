import { describe, expect, it } from "vitest";
import { sanitizeMetadata } from "@/lib/audit";

describe("audit metadata sanitization", () => {
  it("strips secret-like keys", () => {
    const out = sanitizeMetadata({
      password: "x",
      ACCESS_TOKEN: "y",
      Authorization: "z",
      count: 3,
    });
    expect(out).toEqual({ count: 3 });
  });

  it("removes nested url and cookie keys", () => {
    const out = sanitizeMetadata({
      callbackUrl: "https://internal",
      sessionIdCookie: "abc",
      keep: "yes",
    });
    expect(out).toEqual({ keep: "yes" });
  });

  it("returns null for undefined", () => {
    expect(sanitizeMetadata(undefined)).toBeNull();
  });

  it("keeps plain counters used by health snapshots", () => {
    const out = sanitizeMetadata({
      healthy: 2,
      degraded: 1,
      down: 0,
      unknown: 4,
    });
    expect(out).toEqual({ healthy: 2, degraded: 1, down: 0, unknown: 4 });
  });
});
