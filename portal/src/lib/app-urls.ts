import { HUDHUD_APPS } from "./registry";

/**
 * HUDHUD H-01 — نظام عناوين التشغيل المركزي (dev/staging/prod).
 *
 * المشكلة الأصلية: HUDHUD_APP_*_URL غير مضبوطة في معظم البيئات فتعرض
 * البوابة "غير معروف" ولا تفتح التطبيقات — بلا مرجع موحد يخبر المشغّل
 * ماذا يضبط ولكيّة بيئة.
 *
 * الحل — مبدأان صارمان:
 * 1. لا افتراض عام: القيم تأتي من البيئة حصرًا (مصدر واحد: HUDHUD_APP_*_URL).
 *    المتصفح لا يحصل على العنوان أبدًا إلا عبر مسار الخادم في portal.
 * 2. قوالب موثقة لا قيم: لكل تطبيق نمط معروف للنطاقات عبر البيئات الثلاث،
 *    يُعرض للمشغّل في شاشة الإعدادات (من السجل فقط — لا يُقرأ من الشبكة).
 */

/** نطاق البيئة للتشغيل — يُشتق من متغير واحد مركزي أو يبقى غير محدد. */
export type HudhudEnvironment = "dev" | "staging" | "production" | "unspecified";

/**
 * HUDHUD_ENV يحدد البيئة الفعلية للبوابة. عند غيابه لا نبتدع بيئة —
 * "unspecified" الصادقة، وتظهر القوالب كلها للمشغّل للمرجعية.
 */
export function currentEnvironment(): HudhudEnvironment {
  const raw = (process.env.HUDHUD_ENV ?? "").toLowerCase().trim();
  if (raw === "dev" || raw === "development") return "dev";
  if (raw === "staging") return "staging";
  if (raw === "production" || raw === "prod") return "production";
  return "unspecified";
}

/**
 * أنماط النطاقات الموثقة لكل تطبيق عبر البيئات — نص وصفي يُعرض
 * للمشغّل، لا يُستخدم للاتصال أبدًا. الاتصال يحدث فقط عبر قيم
 * HUDHUD_APP_*_URL الفعلية من البيئة.
 */
export const URL_TEMPLATES: Record<
  string,
  Record<Exclude<HudhudEnvironment, "unspecified">, string>
> = {
  "osiris-map": {
    dev: "http://localhost:<port>",
    staging: "https://maps.staging.<domain>",
    production: "https://maps.<domain>",
  },
  neureed: {
    dev: "http://localhost:<port>",
    staging: "https://news.staging.<domain>",
    production: "https://news.<domain>",
  },
  "loki-verify": {
    dev: "http://localhost:<port>",
    staging: "https://verify.staging.<domain>",
    production: "https://verify.<domain>",
  },
  "zexa-auth": {
    dev: "http://localhost:<port>",
    staging: "https://identity.staging.<domain>",
    production: "https://identity.<domain>",
  },
  nchat: {
    dev: "http://localhost:<port>",
    staging: "https://connect.staging.<domain>",
    production: "https://connect.<domain>",
  },
  "rhex-forum": {
    dev: "http://localhost:<port>",
    staging: "https://community.staging.<domain>",
    production: "https://community.<domain>",
  },
  umami: {
    dev: "http://localhost:<port>",
    staging: "https://analytics.staging.<domain>",
    production: "https://analytics.<domain>",
  },
};

export interface AppUrlStatus {
  techId: string;
  brandName: string;
  /** هل عنوان التشغيل مضبوط فعليًا في هذه البيئة؟ (حضور فقط — لا قيمة) */
  configured: boolean;
  /** متغير البيئة المطلوب — يُعرض للمشغّل ليعرف ماذا يضبط */
  baseUrlEnv: string;
  /** النمط الموثق لهذا التطبيق في البيئة الحالية — نص وصفي فقط */
  templateHint: string | null;
  /** عقد readiness المعلن لهذا التطبيق (M-08) */
  readinessContract: "none" | "readiness-level";
}

/**
 * الحالة الفعلية لعناوين كل التطبيقات — مصدر واحد تستدعيه:
 * - شاشة الإعدادات (عرض المشغّل)
 * - لوحة القيادة (فحص الصحة)
 * لا تُعاد أي قيم عناوين من هذه الوحدة إلى العميل مطلقًا.
 */
export function appUrlStatuses(): AppUrlStatus[] {
  const env = currentEnvironment();
  return HUDHUD_APPS.map((app) => {
    const configured = Boolean(process.env[app.baseUrlEnv]);
    let templateHint: string | null = null;
    if (env !== "unspecified") {
      templateHint = URL_TEMPLATES[app.techId]?.[env] ?? null;
    }
    return {
      techId: app.techId,
      brandName: app.brandName,
      configured,
      baseUrlEnv: app.baseUrlEnv,
      templateHint,
      readinessContract: app.readinessContract,
    };
  });
}
