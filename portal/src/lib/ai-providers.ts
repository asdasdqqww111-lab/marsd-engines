/**
 * HUDHUD AI ENGINE — سجل مزودي الذكاء الاصطناعي المركزي (E-01).
 *
 * مصدر واحد للحقيقة لكل استهلاك AI عبر منظومة HUDHUD:
 * - loki-verify: OpenAI (افتراضي gpt-4o) أو Anthropic أو LLM محلي عبر api_config.yaml
 *   (factcheck/utils/llmclient.py CLIENTS) + serper retriever.
 * - nchat: OpenAI وAnthropic عبر lib/ai (openai-client/anthropic-client) مع fallback
 *   محلي للبحث والملخصات — لا مفاتيح = وضع محلي صادق، لا تعطل.
 * - osiris-map: OpenAQ (بيانات عامة مجانية) — ليس مزود LLM.
 * - neureed/zexa-auth/rhex-forum/umami/portal: لا استهلاك LLM (متحقق من الجرد 2026-11-16).
 *
 * القواعد الصارمة (ملزمة):
 * 1. ZERO-COST RUNTIME: لا مفتاح مدفوع يُفعَّل أو يُقترح تفعيله من هذه الشيفرة.
 *    المفاتيح من بيئة المشغّل حصرًا؛ غيابها = قدرة معطلة صادقة، لا كسر.
 * 2. المحظورات: أي مزود Meta (Llama API / Meta AI / Meta LLM) محظور كليًا —
 *    لا client ولا نموذج ولا endpoint. أي إضافة مستقبلية لمزود تمر من هنا
 *    وتُرفض إن كانت من المحظورات.
 * 3. المفتاح لا يمر للمتصفح أبدًا: كل استدعاء AI يمر عبر مسار خادمي
 *    (route handler) — المتغيرات NEXT_PUBLIC_*_API_KEY **ممنوعة** لمفاتيح AI
 *    (جرد المرحلة E وجد أن nchat كان يسمح بها — عيب جسري عولج في E-02).
 * 4. لا نماذج افتراضية مدفوعة تُفرض: النموذج يحدده المشغّل في بيئته.
 */

/** المزودون المسموحون — توسيع بالموافقة فقط، والقائمة موثقة في AI-ENGINE.md */
export type AllowedAiProvider = "openai" | "anthropic" | "local" | "none";

/**
 * المحظورات — ممنوع إضافتها كسجل أو ككود في أي تطبيق HUDHUD.
 * الحظر سياسة مشغّل موثقة (ZERO-COST + سياسة هوية المنظومة).
 */
export const BLOCKED_AI_PROVIDERS: readonly string[] = [
  "meta",
  "meta-ai",
  "llama-api",
  "meta-llama",
  "llama",
];

export interface AiProviderRequirement {
  /** المفتاح في السجل — ثابت */
  providerKey: string;
  /** الاسم للعرض في البوابة */
  providerName: string;
  /** المزود المسموح */
  provider: AllowedAiProvider;
  /** متغيرات البيئة الخادمية فقط (لا NEXT_PUBLIC أبدًا لمفاتيح AI) */
  envVars: readonly string[];
  /** التطبيق المستهلك (techId من سجل البوابة) */
  techId: string;
  /**
   * حدود الموارد الموثقة — الصفر يعني: بلا مفتاح = القدرة معطلة بصدق.
   * لا حدود مفروضة من الشيفرة؛ المشغّل يضبط الميزانية عبر أدوات nchat
   * الموجودة أصلًا (cost-tracker/rate-limiter بجهاز Redis).
   */
  fallbackWhenUnset: string;
}

/**
 * متطلبات المزودين — من جرد فعلي للشيفرة (2026-11-16):
 * - loki: OPENAI_API_KEY أو ANTHROPIC_API_KEY أو LOCAL_API_URL (llmclient.py)
 *   وSERPER_API_KEY للاسترجاع (user_guide.md).
 * - nchat: OPENAI_API_KEY أو ANTHROPIC_API_KEY (خادمي فقط بعد E-02).
 */
export const AI_PROVIDER_REQUIREMENTS: AiProviderRequirement[] = [
  {
    providerKey: "verify-llm-openai",
    providerName: "OpenAI (فحص الأخبار)",
    provider: "openai",
    envVars: ["OPENAI_API_KEY"],
    techId: "loki-verify",
    fallbackWhenUnset: "الفحص يرد 503 صادقًا — لا نتيجة مبتدعة (سلوك C-01)",
  },
  {
    providerKey: "verify-llm-anthropic",
    providerName: "Anthropic (فحص الأخبار)",
    provider: "anthropic",
    envVars: ["ANTHROPIC_API_KEY"],
    techId: "loki-verify",
    fallbackWhenUnset: "كما أعلاه — بديل اختياري لـ OpenAI",
  },
  {
    providerKey: "verify-llm-local",
    providerName: "LLM محلي (فحص الأخبار)",
    provider: "local",
    envVars: ["LOCAL_API_URL", "LOCAL_API_KEY"],
    techId: "loki-verify",
    fallbackWhenUnset: "كما أعلاه — الخيار ZERO-COST الموصى به",
  },
  {
    providerKey: "verify-retriever-serper",
    providerName: "Serper (استرجاع الأدلة)",
    provider: "openai",
    envVars: ["SERPER_API_KEY"],
    techId: "loki-verify",
    fallbackWhenUnset: "الاسترجاع يتوقف بصدق — الفحص لا يختلق أدلة",
  },
  {
    providerKey: "connect-llm-openai",
    providerName: "OpenAI (ملخصات وبحث nchat)",
    provider: "openai",
    envVars: ["OPENAI_API_KEY"],
    techId: "nchat",
    fallbackWhenUnset:
      "الملخصات والبحث يعودان للوضع المحلي الموجود أصلًا — لا تعطل",
  },
  {
    providerKey: "connect-llm-anthropic",
    providerName: "Anthropic (ملخصات وبحث nchat)",
    provider: "anthropic",
    envVars: ["ANTHROPIC_API_KEY"],
    techId: "nchat",
    fallbackWhenUnset: "كما أعلاه — بديل اختياري",
  },
];

/** التحقق: هل مزود مقترح مسموح؟ (تستخدمه أي إضافة مستقبلية) */
export function isProviderAllowed(name: string): boolean {
  const n = name.trim().toLowerCase();
  return !BLOCKED_AI_PROVIDERS.includes(n);
}

/**
 * حالة التهيئة للمزود — حضور فقط (لا قيم ولا أسرار أبدًا).
 * تستهلكها شاشة مزودي AI في البوابة.
 */
export function aiProviderStatuses(): Array<{
  providerKey: string;
  providerName: string;
  techId: string;
  configured: boolean;
  envVarNames: readonly string[];
}> {
  return AI_PROVIDER_REQUIREMENTS.map((p) => ({
    providerKey: p.providerKey,
    providerName: p.providerName,
    techId: p.techId,
    configured: p.envVars.every((v) => Boolean(process.env[v])),
    envVarNames: p.envVars,
  }));
}
