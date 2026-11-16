/**
 * HUDHUD AI ENGINE — سياسة مفاتيح AI (E-02).
 *
 * جرد 2026-11-16 كشف عيبًا جسريًا في nchat: مكونات lib/ai تسمح للمتصفح
 * بقراءة مفاتيح AI من متغيرات NEXT_PUBLIC_OPENAI_API_KEY /
 * NEXT_PUBLIC_ANTHROPIC_API_KEY — أي أن ضبطها يكشف مفتاحًا مدفوعًا
 * في حزمة JavaScript العميلة.
 *
 * سياسة HUDHUD الصارمة (من E-01): مفتاح AI لا يمر للمتصفح أبدًا.
 * هذه الوحدة هي المرجع الوحيد لجلب المفاتيح — خادمي فقط:
 * - في سياق خادم: تُعاد من process.env (بدون بادئة NEXT_PUBLIC).
 * - في سياق متصفح: undefined دائمًا — بلا استثناء. المتصفح يستخدم مسارات
 *   الخادم (/api/ai/*) أو الوضع المحلي الموجود أصلًا (fallback صادق).
 *
 * الترقيع الداخلي للملفات الستة (إزالة فروع NEXT_PUBLIC فيها) يتطلب إعادة
 * كتابة كاملة — موثق في BASELINE كخطوة BLOCKED تنفذ محليًا أو عبر بيئة
 * تشغيل (C-03). هذه الوحدة + اختبارها يمنعان أي استخدام جديد للمسار الآمن.
 */

export type ServerAiKeyName =
  | "OPENAI_API_KEY"
  | "ANTHROPIC_API_KEY"
  | "LOCAL_API_URL"
  | "LOCAL_API_KEY"
  | "SERPER_API_KEY";

/**
 * المفاتيح المحظورة في حزمة المتصفح — أي استخدام لها في كود AI يجب أن
 * يفشل المراجعة. موجودة هنا لكي يفحصها اختبار السياسة والمراجعون.
 */
export const FORBIDDEN_BROWSER_AI_VARS: readonly string[] = [
  "NEXT_PUBLIC_OPENAI_API_KEY",
  "NEXT_PUBLIC_ANTHROPIC_API_KEY",
];

/**
 * جلب مفتاح AI — خادمي فقط.
 * في المتصفح تعيد undefined دائمًا: الوضع المحلي الصادق هو fallback
 * المتصفح الوحيد، والميزات السحابية تمر عبر مسارات الخادم.
 */
export function getServerAiKey(name: ServerAiKeyName): string | undefined {
  if (typeof window !== "undefined") {
    // سياق متصفح: لا مفاتيح أبدًا — مهما كان المصدر.
    return undefined;
  }
  return process.env[name];
}

/** هل نحن في سياق آمن لاستخدام مزود سحابي؟ (خادم + مفتاح حاضر) */
export function canUseCloudProvider(): boolean {
  if (typeof window !== "undefined") return false;
  return Boolean(
    getServerAiKey("OPENAI_API_KEY") || getServerAiKey("ANTHROPIC_API_KEY"),
  );
}
