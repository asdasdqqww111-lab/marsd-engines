export type AppStatus = "unknown" | "healthy" | "degraded" | "down";

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
}

/**
 * سجل التطبيقات الرسمي — مصدر واحد للحقيقة للبوابة.
 * الأسماء التقنية والمجلدات كما هي في المستودع دون تغيير.
 */
export const HUDHUD_APPS: HudhudApp[] = [
  { brandName: "HUDHUD Maps", techId: "osiris-map", description: "ذكاء جغرافي مكاني وخرائط تفاعلية", baseUrlEnv: "HUDHUD_APP_MAPS_URL", healthPath: "/", usesPostgres: false },
  { brandName: "HUDHUD News", techId: "neureed", description: "تجميع الأخبار ومراقبة المصادر والتغذيات", baseUrlEnv: "HUDHUD_APP_NEWS_URL", healthPath: "/", usesPostgres: true },
  { brandName: "HUDHUD Verify", techId: "loki-verify", description: "التحقق من الأخبار وإدارة الأدلة", baseUrlEnv: "HUDHUD_APP_VERIFY_URL", healthPath: "/", usesPostgres: false },
  { brandName: "HUDHUD Identity", techId: "zexa-auth", description: "المصادقة وإدارة الحسابات والأدوار", baseUrlEnv: "HUDHUD_APP_IDENTITY_URL", healthPath: "/", usesPostgres: true },
  { brandName: "HUDHUD Connect", techId: "nchat", description: "المراسلة والتواصل", baseUrlEnv: "HUDHUD_APP_CONNECT_URL", healthPath: "/", usesPostgres: true },
  { brandName: "HUDHUD Community", techId: "rhex-forum", description: "المنتديات والنقاشات المجتمعية", baseUrlEnv: "HUDHUD_APP_COMMUNITY_URL", healthPath: "/", usesPostgres: true },
  { brandName: "HUDHUD Analytics", techId: "umami", description: "التحليلات والإحصاءات ورؤى الاستخدام", baseUrlEnv: "HUDHUD_APP_ANALYTICS_URL", healthPath: "/api/send?x=", usesPostgres: true },
];

export function getApp(techId: string): HudhudApp | undefined {
  return HUDHUD_APPS.find((a) => a.techId === techId);
}
