import { describe, expect, it } from "vitest";
import {
  canUseCloudProvider,
  FORBIDDEN_BROWSER_AI_VARS,
  getServerAiKey,
} from "../key-policy";

/**
 * HUDHUD E-02 — سياسة المفاتيح: المفتاح لا يمر للمتصفح أبدًا.
 * بيئة vitest تعمل في Node (window غير معرفة) — أي أن هذه الاختبارات
 * تفحص السلوك الخادمي؛ السلوك العميلي مضمون بالنوع (typeof window check)
 * وموثق في الوحدة نفسها.
 */

describe("AI key policy (E-02)", () => {
  it("server context: returns env value only when actually set", () => {
    // في بيئة الاختبار لا مفاتيح مضبوطة — النتيجة الصادقة undefined.
    expect(getServerAiKey("OPENAI_API_KEY")).toBeUndefined();
    expect(getServerAiKey("ANTHROPIC_API_KEY")).toBeUndefined();
  });

  it("cloud provider unusable without a server key — honest false", () => {
    expect(canUseCloudProvider()).toBe(false);
  });

  it("forbidden browser vars list covers the known leak paths", () => {
    expect(FORBIDDEN_BROWSER_AI_VARS).toContain(
      "NEXT_PUBLIC_OPENAI_API_KEY",
    );
    expect(FORBIDDEN_BROWSER_AI_VARS).toContain(
      "NEXT_PUBLIC_ANTHROPIC_API_KEY",
    );
  });

  it("no forbidden var is ever a valid server key name", () => {
    // النوع يضمن أن getServerAiKey لا يقبل أسماء NEXT_PUBLIC —
    // وهذا الاختبار يوثق القصد للمراجعين.
    const serverKeys = [
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "LOCAL_API_URL",
      "LOCAL_API_KEY",
      "SERPER_API_KEY",
    ] as const;
    for (const k of serverKeys) {
      expect(FORBIDDEN_BROWSER_AI_VARS).not.toContain(k);
    }
  });
});
