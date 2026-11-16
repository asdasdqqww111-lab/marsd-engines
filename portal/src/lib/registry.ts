export type AppStatus =
  | "unknown"
  | "starting"
  | "healthy"
  | "degraded"
  | "down";

export interface HudhudApp {
  /** الاسم الرسمي بالهوية الموحدة */
  brandName: string;
  /** اسم المجلد التقني — لا يُغيَّر أبدًا */
  techId: string;
  /** وصف مختصر */
  description: string;
  /** عنوان التشغيل (يُضبط عبر البيئة، لا افتراض عام) */
  baseUrlEnv: string;
  /** مسار فحص الصحة الخاص بالتطبيق إن وجد */
  healthPath: string;
  /** يستهلك PostgreSQL؟ (عزل قواعد البيانات) */
  usesPostgres: boolean;
  /**
   * مصدر مسار الصحة — يوثق كيف تحققنا من المسار:
   * - "verified-source": مسار صحة مخصص موجود فعليًا في شيفرة التطبيق.
   * - "root-liveness": لا مسار صحة مخصص؛ الجذر "/" يستخدم كفحص حياة فقط.
   */
  healthPathSource: "verified-source" | "root-liveness";
  /**
   * مستوى عقد readiness الذي يصدره التطبيق (M-08):
   * - "none": العقد liveness فقط — البوابة تعرض الحالة كما هي دون ادعاء جاهزية.
   * - "readiness-level": العقد يصدر readiness.level صادقًا
   *   (loki-verify: ready/degraded/not_ready — M-03) وتستهلكه البوابة.
   */
  readinessContract: "none" | "readiness-level";
}

/**
 * سجل التطبيقات الرسمي — مصدر واحد للحقيقة للبوابة.
 * الأسماء التقنية والمجلدات كما هي في المستودع دون تغيير.
 *
 * مسارات الصحة مُتحقق منها من شيفرة كل تطبيق (تحديث 2026-11-16):
 * - osiris-map: /api/health (osiris-map/src/app/api/health/route.ts).
 * - neureed: /api/health (neureed/app/api/health/route.ts).
 * - nchat: /api/health (nchat/frontend/src/app/api/health/route.ts).
 * - umami: /api/heartbeat (docker-compose healthcheck).
 * - loki-verify: /api/health — أُضيف بعقد HUDHUD
 *   (loki-verify/health.py + تسجيل blueprint في webapp.py).
 *   عقد readiness حقيقي بثلاثة مستويات ready/degraded/not_ready (M-03).
 * - zexa-auth: /api/health — أُضيف بعقد HUDHUD
 *   (zexa-auth/src/app/api/health/route.ts). يجب إبقاؤه عامًا في proxy.ts.
 * - rhex-forum: /api/health — أُضيف بعقد HUDHUD
 *   (rhex-forum/src/app/api/health/route.ts).
 */
export const HUDHUD_APPS: HudhudApp[] = [
  {
    brandName: "HUDHUD Maps",
    techId: "osiris-map",
    description: "ذكاء جغرافي مكاني وخرائط تفاعلية",
    baseUrlEnv: "HUDHUD_APP_MAPS_URL",
    healthPath: "/api/health",
    usesPostgres: false,
    healthPathSource: "verified-source",
    readinessContract: "none",
  },
  {
    brandName: "HUDHUD News",
    techId: "neureed",
    description: "تجميع الأخبار ومراقبة المصادر والتغذيات",
    baseUrlEnv: "HUDHUD_APP_NEWS_URL",
    healthPath: "/api/health",
    usesPostgres: true,
    healthPathSource: "verified-source",
    readinessContract: "none",
  },
  {
    brandName: "HUDHUD Verify",
    techId: "loki-verify",
    description: "التحقق من الأخبار وإدارة الأدلة",
    baseUrlEnv: "HUDHUD_APP_VERIFY_URL",
    healthPath: "/api/health",
    usesPostgres: false,
    healthPathSource: "verified-source",
    readinessContract: "readiness-level",
  },
  {
    brandName: "HUDHUD Identity",
    techId: "zexa-auth",
    description: "المصادقة وإدارة الحسابات والأدوار",
    baseUrlEnv: "HUDHUD_APP_IDENTITY_URL",
    healthPath: "/api/health",
    usesPostgres: true,
    healthPathSource: "verified-source",
    readinessContract: "none",
  },
  {
    brandName: "HUDHUD Connect",
    techId: "nchat",
    description: "المراسلة والتواصل",
    baseUrlEnv: "HUDHUD_APP_CONNECT_URL",
    healthPath: "/api/health",
    usesPostgres: true,
    healthPathSource: "verified-source",
    readinessContract: "none",
  },
  {
    brandName: "HUDHUD Community",
    techId: "rhex-forum",
    description: "المنتديات والنقاشات المجتمعية",
    baseUrlEnv: "HUDHUD_APP_COMMUNITY_URL",
    healthPath: "/api/health",
    usesPostgres: true,
    healthPathSource: "verified-source",
    readinessContract: "none",
  },
  {
    brandName: "HUDHUD Analytics",
    techId: "umami",
    description: "التحليلات والإحصاءات ورؤى الاستخدام",
    baseUrlEnv: "HUDHUD_APP_ANALYTICS_URL",
    healthPath: "/api/heartbeat",
    usesPostgres: true,
    healthPathSource: "verified-source",
    readinessContract: "none",
  },
];

export function getApp(techId: string): HudhudApp | undefined {
  return HUDHUD_APPS.find((a) => a.techId === techId);
}

/**
 * مزودو الخدمات الخارجيون لكل تطبيق — مُستخرجون من ملفات .env.example
 * الفعلية للتطبيقات في المستودع (لا افتراضات). البوابة تعرض حضور/غياب
 * المتغير فقط؛ لا قيم تُعرض أبدًا ولا اختبار اتصال يُجرى من المتصفح.
 */
export interface ProviderRequirement {
  /** المفتاح في سجل المزودين — ثابت */
  providerKey: string;
  /** اسم المزود للعرض */
  providerName: string;
  /** متغيرات البيئة المطلوبة لهذا المزود (كما في .env.example للتطبيق) */
  envVars: readonly string[];
  /** التطبيق الذي يستهلك المزود (techId) */
  techId: string;
}

export const PROVIDER_REQUIREMENTS: ProviderRequirement[] = [
  {
    providerKey: "identity-oauth-google",
    providerName: "Google OAuth",
    envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    techId: "zexa-auth",
  },
  {
    providerKey: "identity-oauth-github",
    providerName: "GitHub OAuth",
    envVars: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    techId: "zexa-auth",
  },
  {
    providerKey: "identity-email-resend",
    providerName: "Resend (بريد)",
    envVars: ["RESEND_API_KEY"],
    techId: "zexa-auth",
  },
  {
    providerKey: "community-redis",
    providerName: "Redis",
    envVars: ["REDIS_URL"],
    techId: "rhex-forum",
  },
];

/**
 * مقدمو بيانات محتوى فعليون في شيفرة التطبيقات (أمثلة موثقة):
 * - osiris-map: OpenAQ (air-quality route) — مزود خارجي للبيانات.
 * - loki-verify: LLM client + serper retriever (webapp.py defaults).
 * لم تُدرج كمزودي تهيئة إلزامية لأن شيفرة التطبيق تتعامل معها داخليًا.
 */
