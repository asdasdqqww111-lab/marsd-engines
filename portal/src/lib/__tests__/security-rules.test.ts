import { describe, expect, it } from "vitest";

/**
 * F-01 — تحقق منطقي من قواعد أداة الفحص الأمني (تُشغَّل الأداة نفسها
 * محليًا عبر npm run security:audit؛ هنا نفحص أن الأنماط الجديدة تطابق
 * النوايا المكتشفة فعليًا في الجرد).
 */

const AI_KEY_BROWSER_RE = /NEXT_PUBLIC_(OPENAI|ANTHROPIC)_API_KEY/g;
const WINDOW_GUARD_RE =
  /typeof\s+window\s*!==?\s*"undefined"[\s\S]{0,120}(API_KEY)/g;
const SSRF_RE =
  /fetch\s*\(\s*(req(?:uest)?\.(?:json|url|searchParams|query)|body\.url|body\.target)/gi;
const EMBEDDED_URL_RE =
  /https?:\/\/(?!localhost|127\.0\.0\.1)[a-z0-9-]+(\.[a-z0-9-]+)+/gi;

describe("security-audit Phase F rules (F-01)", () => {
  it("detects AI keys in browser-facing env vars (E-02 policy)", () => {
    expect(
      AI_KEY_BROWSER_RE.test("process.env.NEXT_PUBLIC_OPENAI_API_KEY"),
    ).toBe(true);
    expect(
      AI_KEY_BROWSER_RE.test("process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY"),
    ).toBe(true);
    // المفتاح الخادمي الصحيح لا يُعلَّم
    expect(AI_KEY_BROWSER_RE.test("process.env.OPENAI_API_KEY")).toBe(false);
  });

  it("detects the legacy window-guard-then-key pattern from nchat", () => {
    const legacy = `if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    }`;
    expect(WINDOW_GUARD_RE.test(legacy)).toBe(true);
    // النمط الخادمي الآمن لا يُعلَّم
    const safe = `if (typeof window !== "undefined") {
      return undefined;
    }
    return process.env.OPENAI_API_KEY;`;
    expect(WINDOW_GUARD_RE.test(safe)).toBe(false);
  });

  it("flags server fetch with request-derived URLs (SSRF indicator)", () => {
    expect(SSRF_RE.test("fetch(req.url)")).toBe(true);
    expect(SSRF_RE.test("fetch(body.url)")).toBe(true);
    // العناوين من سجل/بيئة لا تُعلَّم
    expect(SSRF_RE.test("fetch(new URL(healthPath, baseUrl))")).toBe(false);
  });

  it("flags non-localhost embedded URLs but allows localhost", () => {
    expect(EMBEDDED_URL_RE.test('fetch("https://api.example.com/v1")')).toBe(
      true,
    );
    expect(EMBEDDED_URL_RE.test('fetch("http://localhost:3000")')).toBe(false);
    expect(EMBEDDED_URL_RE.test('fetch("http://127.0.0.1:5432")')).toBe(false);
  });
});
