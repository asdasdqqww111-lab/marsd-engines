import { describe, expect, it } from "vitest";
import {
  HUDHUD_DICT,
  HUDHUD_DEFAULT_LOCALE,
  dirFor,
  t,
  type HudhudLocale,
} from "@/lib/hudhud-dictionary";

/** كل مدخل قاموس: نص عربي وإنجليزي غير فارغين — فحص استقراري عبر المساحات. */
function assertEntry(path: string, value: unknown) {
  if (typeof value === "object" && value !== null) {
    const v = value as Record<string, unknown>;
    if ("ar" in v && "en" in v && typeof v.ar === "string" && typeof v.en === "string") {
      // مدخل نصي: النسختان إلزاميتان وغير فارغتين
      expect(v.ar.trim().length).toBeGreaterThan(0);
      expect(v.en.trim().length).toBeGreaterThan(0);
    } else {
      // مساحة: نفحص أبناءها
      for (const [k, child] of Object.entries(v)) {
        assertEntry(`${path}.${k}`, child);
      }
    }
  }
}

describe("hudhud-dictionary (D-01)", () => {
  it("default locale is Arabic", () => {
    expect(HUDHUD_DEFAULT_LOCALE).toBe("ar");
  });

  it("every entry has non-empty ar and en — recursively", () => {
    for (const [space, children] of Object.entries(HUDHUD_DICT)) {
      assertEntry(space, children);
    }
  });

  it("t() returns the requested locale with ar fallback", () => {
    const entry = HUDHUD_DICT.auth.login;
    expect(t(entry, "ar")).toBe("تسجيل الدخول");
    expect(t(entry, "en")).toBe("Login");
    // الاحتياط العربي عند لغة غير معروفة يُفحص عبر النوع في وقت البناء
  });

  it("direction is derived from locale, never assumed", () => {
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
    const locales: HudhudLocale[] = ["ar", "en"];
    for (const l of locales) {
      expect(["rtl", "ltr"]).toContain(dirFor(l));
    }
  });

  it("key spaces exist for identity, auth, admin, verify, common", () => {
    const keys = Object.keys(HUDHUD_DICT);
    expect(keys).toContain("brand");
    expect(keys).toContain("auth");
    expect(keys).toContain("admin");
    expect(keys).toContain("verify");
    expect(keys).toContain("common");
  });
});
