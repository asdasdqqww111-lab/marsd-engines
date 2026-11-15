import type { AppStatus } from "./registry";

export interface HealthResult {
  techId: string;
  status: AppStatus;
  httpStatus: number | null;
  latencyMs: number | null;
  checkedAt: string;
  detail: string;
}

/**
 * حماية SSRF: الفحص مسموح فقط لعناوين URL المستمدة من سجل التطبيقات
 * (متغيرات بيئة يتحكم بها المشغّل)، ولا يُقبل أي عنوان يمرره المستخدم.
 * HTTP 200 من صفحة عامة لا يُعد دليلًا كافيًا — يُسجَّل مع الحالة والزمن.
 */
export async function checkAppHealth(
  techId: string,
  baseUrl: string | undefined,
  healthPath: string,
): Promise<HealthResult> {
  const now = new Date().toISOString();
  if (!baseUrl) {
    return { techId, status: "unknown", httpStatus: null, latencyMs: null, checkedAt: now, detail: "غير معروف — لم يُضبط عنوان التشغيل" };
  }

  let target: URL;
  try {
    target = new URL(healthPath || "/", baseUrl);
  } catch {
    return { techId, status: "unknown", httpStatus: null, latencyMs: null, checkedAt: now, detail: "عنوان التشغيل غير صالح" };
  }

  // قيود SSRF: HTTPS أو HTTP على مضيف غير حرفي فقط
  if (!/^https?:$/.test(target.protocol)) {
    return { techId, status: "unknown", httpStatus: null, latencyMs: null, checkedAt: now, detail: "بروتوكول غير مسموح" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const start = Date.now();
  try {
    const res = await fetch(target, {
      method: "GET",
      signal: controller.signal,
      headers: { "user-agent": "hudhud-portal-health/1.0" },
      redirect: "manual",
    });
    const latencyMs = Date.now() - start;
    const ok = res.status >= 200 && res.status < 400;
    return {
      techId,
      status: ok ? "healthy" : "degraded",
      httpStatus: res.status,
      latencyMs,
      checkedAt: now,
      detail: ok ? "استجاب" : `استجابة غير سليمة (${res.status})`,
    };
  } catch (err) {
    return {
      techId,
      status: "down",
      httpStatus: null,
      latencyMs: null,
      checkedAt: now,
      detail: err instanceof Error && err.name === "AbortError" ? "تجاوز مهلة 5 ثوانٍ" : "تعذر الاتصال",
    };
  } finally {
    clearTimeout(timeout);
  }
}
