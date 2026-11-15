import { describe, expect, it } from "vitest";
import { getClientIpFromHeaders } from "@/lib/client-ip";

describe("getClientIpFromHeaders", () => {
  it("prefers edge-set headers over client-controlled ones", () => {
    const h = new Headers();
    h.set("cf-connecting-ip", "1.2.3.4");
    h.set("x-forwarded-for", "9.9.9.9, 8.8.8.8");
    expect(getClientIpFromHeaders(h)).toBe("1.2.3.4");
  });

  it("uses the rightmost xff entry (set by our edge)", () => {
    const h = new Headers();
    h.set("x-forwarded-for", "9.9.9.9, 10.0.0.1");
    expect(getClientIpFromHeaders(h)).toBe("10.0.0.1");
  });

  it("returns unknown for garbage input", () => {
    const h = new Headers();
    h.set("x-forwarded-for", "not-an-ip");
    expect(getClientIpFromHeaders(h)).toBe("unknown");
  });
});
