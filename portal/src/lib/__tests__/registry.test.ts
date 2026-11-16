import { describe, expect, it } from "vitest";
import { HUDHUD_APPS, PROVIDER_REQUIREMENTS, getApp } from "@/lib/registry";

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

  it("every app declares a health path source (verified or liveness)", () => {
    for (const app of HUDHUD_APPS) {
      expect(["verified-source", "root-liveness"]).toContain(app.healthPathSource);
    }
  });

  it("apps with verified health paths match actual app source", () => {
    // Verified against real repository source on 2026-11-16:
    // osiris-map/src/app/api/health/route.ts
    // neureed/app/api/health/route.ts
    // nchat/frontend/src/app/api/health/route.ts
    // umami/docker-compose.yml (healthcheck uses /api/heartbeat)
    const verified = HUDHUD_APPS.filter((a) => a.healthPathSource === "verified-source");
    expect(verified.map((a) => [a.techId, a.healthPath])).toEqual([
      ["osiris-map", "/api/health"],
      ["neureed", "/api/health"],
      ["nchat", "/api/health"],
      ["umami", "/api/heartbeat"],
    ]);
  });

  it("finds app by techId", () => {
    expect(getApp("umami")?.brandName).toBe("HUDHUD Analytics");
    expect(getApp("does-not-exist")).toBeUndefined();
  });
});

describe("provider requirements", () => {
  it("every provider references an existing app techId", () => {
    for (const p of PROVIDER_REQUIREMENTS) {
      expect(getApp(p.techId)).toBeDefined();
    }
  });

  it("every provider has at least one env var", () => {
    for (const p of PROVIDER_REQUIREMENTS) {
      expect(p.envVars.length).toBeGreaterThan(0);
    }
  });

  it("provider keys are unique", () => {
    const keys = PROVIDER_REQUIREMENTS.map((p) => p.providerKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
