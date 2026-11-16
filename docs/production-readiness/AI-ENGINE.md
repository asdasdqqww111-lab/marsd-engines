# HUDHUD AI ENGINE — المعمارية والحدود (E)

**التاريخ:** 2026-11-16 (UTC) · **الفرع:** `feature/hudhud-ai-phase-e`
**مصدر الحقيقة:** جرد فعلي للشيفرة عبر GitHub API — لا افتراضات.

## 1. جرد استهلاك الذكاء الاصطناعي (متحقق منه)

| التطبيق | المزودون الفعليون | الملفات المرجعية | وضع غياب المفتاح |
|---|---|---|---|
| loki-verify | OpenAI (افتراضي gpt-4o) / Anthropic / LLM محلي + Serper للاسترجاع | factcheck/utils/llmclient.py، docs/user_guide.md | **503 صادق** — لا نتيجة مبتدعة (سلوك C-01 من المرحلة B) |
| nchat | OpenAI / Anthropic عبر lib/ai (20+ ملفًا: summarizers/search/sentiment/embeddings) مع fallback محلي مدمج | lib/ai/INFRASTRUCTURE.md، providers/ | **وضع محلي** — الملخصات والبحث يعملان بدون مفاتيح (موجود أصلًا) |
| osiris-map | OpenAQ — بيانات جوية عامة مجانية، **ليس LLM** | air-quality route | غير ذي صلة بمفاتيح AI |
| neureed / zexa-auth / rhex-forum / umami / portal | **لا استهلاك LLM** (جرد 2026-11-16) | — | — |

**Meta AI / Llama: صفر حضور في المستودع كله** (بحث شامل: 0 نتائج) — والحظر سياسة موثقة أدناه.

## 2. القواعد الصارمة للبوابة (AI ENGINE)

### R1 — ZERO-COST RUNTIME
لا مفتاح مدفوع يُفعَّل أو يُقترح من الشيفرة. المفاتيح ملك بيئة المشغّل حصرًا؛ غيابها = قدرة معطلة صادقة لا كسر. أدوات إدارة الميزانية الموجودة أصلًا في nchat (cost-tracker/rate-limiter على Redis) تُستخدم كما هي دون فرض حدود من الشيفرة.

### R2 — الحظر: Meta
`BLOCKED_AI_PROVIDERS` في `portal/src/lib/ai-providers.ts`: meta، meta-ai، llama-api، meta-llama، llama. أي إضافة مزود مستقبلية تمر من `isProviderAllowed()` وتُرفض إن كانت من المحظورات.

### R3 — المفتاح لا يمر للمتصفح أبدًا (E-02)
- جرد المرحلة E كشف أن 6 ملفات في nchat تسمح بقراءة `NEXT_PUBLIC_OPENAI_API_KEY`/`NEXT_PUBLIC_ANTHROPIC_API_KEY` من المتصفح — **مسار كشف مفتاح مدفوع في حزمة JS العميلة**.
- العلاج المنفذ: `key-policy.ts` — المرجع الوحيد لجلب المفاتيح (خادمي فقط؛ المتصفح undefined دائمًا) + اختبار سياسة يمنع الاستخدام الجديد.
- **المتبقي (BLOCKED على بيئة تشغيل):** إزالة فروع `NEXT_PUBLIC` من الملفات الستة (message-summarizer/thread-summarizer/sentiment-analyzer/channel-digest/meeting-notes/smart-search) تتطلب تحريرًا موضعيًا في بيئة سحب محلية (الملفات 15-18KB والتعديل عبر API من محتوى مقروء مقطوع مخاطرة كسر). البوابة تعرض التحذير في شاشة /providers/ai، والسياسة الجديدة موثقة ومختبرة.

### R4 — لا نماذج مفروضة
النموذج يحدده المشغّل (nchat: cost-tracker models موجودة؛ loki: `--model` CLI). سجل E-01 لا يثبت نماذج.

## 3. المكونات المنفذة (فرع المرحلة E)

| المكون | المسار | الوظيفة |
|---|---|---|
| سجل المزودين | `portal/src/lib/ai-providers.ts` | مصدر واحد: مسموحون/محظورون/متغيرات خادمية/fallback صادق لكل مزود |
| سياسة المفاتيح | `nchat/frontend/src/lib/ai/key-policy.ts` | جلب خادمي فقط؛ المتصفح undefined دائمًا؛ قائمة محظورات NEXT_PUBLIC |
| اختبارات السياسة | `__tests__/key-policy.test.ts` + `ai-providers.test.ts` | حظر Meta، لا NEXT_PUBLIC، حالات صادقة |
| شاشة البوابة | `portal/src/app/providers/ai/page.tsx` | حالات فعلية حضور-فقط + عرض المحظورات والسياسة (شاشة /providers الأصلية لمزودي الهوية بقيت كما هي) |

## 4. نقاط موافقة مفتوحة (المرحلة E لا تفعّل شيئًا)

1. **تفعيل أي مفتاح مدفوع** (OpenAI/Anthropic/Serper) في أي بيئة — قرار المشغّل، خارج نطاق الوكيل.
2. **إزالة فروع NEXT_PUBLIC من الملفات الستة** — يتطلب بيئة سحب/تشغيل (عائق C-03) ثم مراجعة، لأنها تعديلات داخل ملفات تشغيلية حساسة.

---

*وثيقة حية — لا يُدعى نجاح أي تكامل دون دليل تشغيل. كل مكونات هذه المرحلة FIXED_UNVERIFIED حتى CI/staging.*
