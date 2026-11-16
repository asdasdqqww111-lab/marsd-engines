import { describe, expect, it } from "vitest";
import {
  appUrlStatuses,
  currentEnvironment,
  URL_TEMPLATES,
} from "@/lib/app-urls";

describe("app-urls (H-01)", () => {
  it("returns a status row for every registered app", () => {
    const statuses = appUrlStatuses();
    expect(statuses).toHaveLength(7);
    const techIds = statuses.map((s) => s.techId).sort();
    expect(techIds).toEqual(
      [
        "osiris-map",
        "neureed",
        "loki-verify",
        "zexa-auth",
        "nchat",
        "rhex-forum",
        "umami",
      ].sort(),
    );
  });

  it("reports configured=false without inventing an address", () => {
    // In the test environment HUDHUD_APP_*_URL are unset — must be honest.
    for (const s of appUrlStatuses()) {
      if (!process.env[s.baseUrlEnv]) {
        expect(s.configured).toBe(false);
      }
    }
  });

  it("exposes the env var name so operators know what to set", () => {
    const byId = new Map(appUrlStatuses().map((s) => [s.techId, s]));
    expect(byId.get("osiris-map")?.baseUrlEnv).toBe("HUDHUD_APP_MAPS_URL");
    expect(byId.get("umami")?.baseUrlEnv).toBe("HUDHUD_APP_ANALYTICS_URL");
  });

  it("documents templates for all three environments per app", () => {
    for (const [techId, templates] of Object.entries(URL_TEMPLATES)) {
      expect(templates.dev).toBeTruthy();
      expect(templates.staging).toBeTruthy();
      expect(templates.production).toBeTruthy();
      // Templates are placeholders, never real addresses.
      expect(templates.production).toContain("<domain>");
    }
  });

  it("environment detection is honest — unknown values stay unspecified", () => {
    expect(currentEnvironment()).toBe("unspecified");
  });

  it("templateHint is null when environment is unspecified", () => {
    // Test env has no HUDHUD_ENV — no invented hints.
    if (currentEnvironment() === "unspecified") {
      for (const s of appUrlStatuses()) {
        expect(s.templateHint).toBeNull();
      }
    }
  });

  it("never returns an actual URL value — presence flags only", () => {
    const serialized = JSON.stringify(appUrlStatuses());
    expect(serialized).not.toMatch(/https?:\/\/(?!localhost:)/);
  });
});
