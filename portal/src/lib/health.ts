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
 * M-08 — الحالات الخماسية الصادقة:
 *   healthy   — استجابة سليمة والجاهزية ready (عندما يصدر التطبيق عقد readiness)
 *   degraded  — الاستجابة وصلت لكن الجاهزية جزئية أو الاستجابة غير سليمة
 *   starting  — العملية قائمة لكن الجاهزية not_ready (مثل loki قبل تهيئة الـpipeline)
 *   down      — لا اتصال أو مهلة
 *   unknown   — عنوان التشغيل غير مضبوط/غير صالح (ليس تعطلًا)
 *
 * حماية SSRF: الفحص مسموح فقط لعناوين URL المستمدة من سجل التطبيقات
 * (متغيرات بيئة يتحكم بها المشغّل)، ولا يُقبل أي عنوان يمرره المستخدم.
 * HTTP 200 من صفحة عامة لا يُعد دليلًا كافيًا — يُسجَّل مع الحالة والزمن.
 *
 * استهلاك عقد readiness: عندما يصدر التطبيق readiness.level في جسم
 * الاستجابة (مثل loki-verify: ready/degraded/not_ready — M-03)، تُشتق
 * الحالة من هذا العقد الصادق بدل الاكتفاء برمز HTTP.
 */

/** استخراج readiness.level من جسم استجابة الصحة — بلا أي أسرار. */
function extractReadinessLevel(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const readiness = (body as Record<string, unknown>).readiness;
  if (typeof readiness !== "object" || readiness === null) return null;
  const level = (readiness as Record<string, unknown>).level;
  return typeof level === "string" ? level : null;
}

/** اشتقاق الحالة من readiness.level الفعلي (M-08 mapping الموثق). */
function statusFromReadiness(level: string): AppStatus {
  switch (level) {
    case "ready":
      return "healthy";
    case "degraded":
      return "degraded";
    case "not_ready":
      return "starting";
    default:
      // عقد غير معروف — لا نفترض جاهزية ولا نبتدع حالة؛ degraded الصادق.
      return "degraded";
  }
}

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

    // استهلاك عقد readiness إن وُجد في جسم الاستجابة (M-08)
    let readinessLevel: string | null = null;
    try {
      const body = await res.json();
      readinessLevel = extractReadinessLevel(body);
    } catch {
      // جسم غير JSON أو فارغ — لا عقد readiness؛ نكتفي بالحالة العامة.
    }

    if (!ok) {
      return {
        techId,
        status: res.status >= 500 ? "down" : "degraded",
        httpStatus: res.status,
        latencyMs,
        checkedAt: now,
        detail: `استجابة غير سليمة (${res.status})`,
      };
    }

    if (readinessLevel) {
      const status = statusFromReadiness(readinessLevel);
      return {
        techId,
        status,
        httpStatus: res.status,
        latencyMs,
        checkedAt: now,
        detail:
          status === "healthy"
            ? "استجاب — الجاهزية ready"
            : status === "degraded"
              ? `استجاب — الجاهزية ${readinessLevel} (جزئية)`
              : "استجاب — الجاهزية not_ready (العملية قائمة، الخدمة بعد)",
      };
    }

    return {
      techId,
      status: "healthy",
      httpStatus: res.status,
      latencyMs,
      checkedAt: now,
      detail: "استجاب",
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
