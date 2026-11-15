import { describe, expect, it } from "vitest";
import { HUDHUD_APPS, getApp } from "@/lib/registry";

describe("registry", () => {
  it("has exactly seven applications", () => {
    expect(HUDHUD_APPS).toHaveLength(7);
  });

  it("preserves original technical ids unchanged", () => {
    expect(HUDHUD_APPS.map((a) => a.techId)).toEqual([
      "osiris-map",
      "neureed",
      "loki-verify",
      "zexa-auth",
      "nchat",
      "rhex-forum",
      "umami",
    ]);
  });

  it("uses HUDHUD brand names", () => {
    expect(HUDHUD_APPS.map((a) => a.brandName)).toEqual([
      "HUDHUD Maps",
      "HUDHUD News",
      "HUDHUD Verify",
      "HUDHUD Identity",
      "HUDHUD Connect",
      "HUDHUD Community",
      "HUDHUD Analytics",
    ]);
  });

  it("finds app by techId", () => {
    expect(getApp("umami")?.brandName).toBe("HUDHUD Analytics");
    expect(getApp("does-not-exist")).toBeUndefined();
  });
});
