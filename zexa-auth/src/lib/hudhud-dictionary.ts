/**
 * HUDHUD D-01 — القاموس الموحد للهوية والتعريب.
 *
 * مصدر واحد للنصوص العربية/الإنجليزية عبر التطبيقات. العربية هي الافتراضية
 * (HUDHUD هوية عربية). الأنماط:
 * - كل مفتاح له نص عربي وإنجليزي — لا مفاتيح ناقصة (فحص نوعي Type-level).
 * - الاتجاه مشتق من اللغة: ar → rtl، en → ltr — لا يُفترض اتجاه أبدًا.
 * - لا نصوص أصلية تُحذف — هذا القاموس إضافة؛ التطبيقات تستهلكه اختياريا.
 */

export type HudhudLocale = "ar" | "en";

export const HUDHUD_DEFAULT_LOCALE: HudhudLocale = "ar";

/** اشتقاق الاتجاه من اللغة — الاتجاه ليس اصطلاحًا مستقلًا. */
export function dirFor(locale: HudhudLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** بنية كل مدخل في القاموس — النسختان إلزاميتان على مستوى النوع. */
type DictEntry = { ar: string; en: string };

/**
 * مساحات القاموس — تنمو مع كل شاشة نُعرّبها. المفاتيح ثابتة (لا تُعدَّل
 * بعد النشر) والإضافات فقط مسموحة.
 */
export const HUDHUD_DICT = {
  /** الهوية العامة */
  brand: {
    name: { ar: "هدهد", en: "HUDHUD" },
    identity: { ar: "هوية هدهد", en: "HUDHUD Identity" },
    control: { ar: "مركز التحكم هدهد", en: "HUDHUD CONTROL" },
  },

  /** المصادقة — شاشات zexa-auth */
  auth: {
    login: { ar: "تسجيل الدخول", en: "Login" },
    register: { ar: "إنشاء حساب", en: "Create an account" },
    logout: { ar: "تسجيل الخروج", en: "Logout" },
    loggingIn: { ar: "جارٍ تسجيل الدخول...", en: "Logging in..." },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    password: { ar: "كلمة المرور", en: "Password" },
    showPassword: { ar: "إظهار كلمة المرور", en: "Show password" },
    hidePassword: { ar: "إخفاء كلمة المرور", en: "Hide password" },
    or: { ar: "أو", en: "OR" },
    notRegistered: { ar: "ليس لديك حساب؟", en: "Not registered?" },
    alreadyRegistered: { ar: "لديك حساب بالفعل؟", en: "Already registered?" },
    invalidEmail: { ar: "بريد إلكتروني غير صالح", en: "Invalid email address" },
    passwordRequired: { ar: "كلمة المرور مطلوبة", en: "Password is required" },
  },

  /** لوحة الإدارة — zexa-auth */
  admin: {
    panel: { ar: "لوحة الإدارة", en: "Admin Panel" },
    dashboard: { ar: "لوحة القيادة", en: "Dashboard" },
    users: { ar: "المستخدمون", en: "Users" },
    settings: { ar: "الإعدادات", en: "Settings" },
    backToControl: { ar: "عودة إلى CONTROL", en: "Back to CONTROL" },
    liveCounts: {
      ar: "عدادات حية من قاعدة البيانات الفعلية — لا مؤشرات وهمية",
      en: "Live counts from the real database — no mock indicators",
    },
    error: { ar: "خطأ", en: "Error" },
  },

  /** التحقق من الأخبار — قوالب loki-verify */
  verify: {
    appTitle: { ar: "هدهد للتحقق", en: "HUDHUD Verify" },
    inputLabel: {
      ar: "أدخل النص أو الادعاء للتحقق منه:",
      en: "Enter the claim or text to fact-check:",
    },
    inputPlaceholder: { ar: "أدخل ما تريد التحقق منه...", en: "Enter text to check..." },
    submit: { ar: "تحقق الآن", en: "Submit" },
    timeElapsed: { ar: "الزمن المنقضي:", en: "Time elapsed:" },
    seconds: { ar: "ثانية", en: "seconds" },
    processing: { ar: "جارٍ التحقق...", en: "Checking..." },
    footer: { ar: "منظومة هدهد للتحقق", en: "HUDHUD Verify" },
  },

  /** حالات عامة */
  common: {
    loading: { ar: "جارٍ التحميل...", en: "Loading..." },
    cancel: { ar: "إلغاء", en: "Cancel" },
    confirm: { ar: "تأكيد", en: "Confirm" },
    close: { ar: "إغلاق", en: "Close" },
    search: { ar: "بحث", en: "Search" },
    unknown: { ar: "غير معروف", en: "Unknown" },
  },
} as const;

export type HudhudDict = typeof HUDHUD_DICT;

/**
 * الوصول لمدخل باللغة — يُرجع النص للغة المطلوبة، مع العربي كاحتياط
 * (الافتراضي الصادق: لا نص مفقود أبدًا).
 */
export function t(
  entry: DictEntry,
  locale: HudhudLocale = HUDHUD_DEFAULT_LOCALE,
): string {
  return entry[locale] ?? entry.ar;
}
