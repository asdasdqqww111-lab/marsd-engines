import { describe, expect, it } from "vitest";
import {
  AI_PROVIDER_REQUIREMENTS,
  BLOCKED_AI_PROVIDERS,
  aiProviderStatuses,
  isProviderAllowed,
} from "@/lib/ai-providers";

describe("AI provider registry (E-01)", () => {
  it("covers both AI-consuming apps with real requirements", () => {
    const apps = new Set(AI_PROVIDER_REQUIREMENTS.map((p) => p.techId));
    expect(apps.has("loki-verify")).toBe(true);
    expect(apps.has("nchat")).toBe(true);
  });

  it("every provider is in the allowed set — never Meta", () => {
    for (const p of AI_PROVIDER_REQUIREMENTS) {
      expect(["openai", "anthropic", "local", "none"]).toContain(p.provider);
    }
  });

  it("every env var is server-side — no NEXT_PUBLIC AI keys", () => {
    for (const p of AI_PROVIDER_REQUIREMENTS) {
      for (const v of p.envVars) {
        expect(v.startsWith("NEXT_PUBLIC_")).toBe(false);
      }
    }
  });

  it("documents honest fallback for every provider when unset", () => {
    for (const p of AI_PROVIDER_REQUIREMENTS) {
      expect(p.fallbackWhenUnset.trim().length).toBeGreaterThan(0);
    }
  });

  it("Meta providers are blocked — policy enforced", () => {
    for (const b of ["meta", "meta-ai", "llama-api", "meta-llama", "llama"]) {
      expect(BLOCKED_AI_PROVIDERS).toContain(b);
      expect(isProviderAllowed(b)).toBe(false);
    }
    expect(isProviderAllowed("openai")).toBe(true);
    expect(isProviderAllowed("anthropic")).toBe(true);
  });

  it("statuses are presence-only — no values ever returned", () => {
    const s = aiProviderStatuses();
    for (const p of s) {
      expect(typeof p.configured).toBe("boolean");
      // لا حقل قيمة في البنية إطلاقًا
      expect(Object.keys(p)).not.toContain("value");
      expect(Object.keys(p)).not.toContain("apiKey");
    }
  });

  it("honest unconfigured state in test env (no env vars set)", () => {
    for (const p of aiProviderStatuses()) {
      for (const v of p.envVarNames) {
        if (!process.env[v]) {
          // مزود يظهر غير مضبوط فقط إذا فشل كل متغيراته فعليًا
          const row = AI_PROVIDER_REQUIREMENTS.find(
            (r) => r.providerKey === p.providerKey,
          );
          if (row && !row.envVars.some((ev) => process.env[ev])) {
            expect(p.configured).toBe(false);
          }
        }
      }
    }
  });
});
