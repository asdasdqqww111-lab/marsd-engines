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

  it("every app declares a readiness contract level (M-08)", () => {
    for (const app of HUDHUD_APPS) {
      expect(["none", "readiness-level"]).toContain(app.readinessContract);
    }
  });

  it("all seven apps have verified health paths matching actual app source", () => {
    // Verified against real repository source on 2026-11-16:
    // osiris-map/src/app/api/health/route.ts
    // neureed/app/api/health/route.ts
    // nchat/frontend/src/app/api/health/route.ts
    // umami/docker-compose.yml (healthcheck uses /api/heartbeat)
    // loki-verify/health.py (readiness.level ready/degraded/not_ready — M-03)
    // zexa-auth/src/app/api/health/route.ts
    // rhex-forum/src/app/api/health/route.ts
    // (loki/zexa/rhex contracts were added with HUDHUD PRs #5 and #8.)
    expect(HUDHUD_APPS.map((a) => [a.techId, a.healthPath])).toEqual([
      ["osiris-map", "/api/health"],
      ["neureed", "/api/health"],
      ["loki-verify", "/api/health"],
      ["zexa-auth", "/api/health"],
      ["nchat", "/api/health"],
      ["rhex-forum", "/api/health"],
      ["umami", "/api/heartbeat"],
    ]);
  });

  it("only apps with a real readiness contract declare readiness-level", () => {
    // M-03 (loki-verify health.py) is currently the only app emitting
    // readiness.level. The registry must not claim a contract that does not
    // exist in the app source — verified 2026-11-16.
    const readinessApps = HUDHUD_APPS.filter(
      (a) => a.readinessContract === "readiness-level",
    );
    expect(readinessApps.map((a) => a.techId)).toEqual(["loki-verify"]);
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
