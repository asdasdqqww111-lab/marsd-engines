# HUDHUD — خط الأساس للجاهزية للإنتاج (BASELINE)

**التاريخ:** 2026-11-16 (UTC)
**الفرع المفحوص:** `master` @ `164127cb9c6bb23357c010b3b622873d87a2eacc`
**طريقة الفحص:** قراءة مباشرة عبر GitHub API (شيفرة الملفات والفروع والـ PRs وActions) — قراءة فقط، لا تشغيل.
**الغرض:** نقطة مرجعية موثقة قبل بدء أعمال الإصلاح والاستكمال. لا يُعتبر أي عنصر "مكتملًا" دون دليل تنفيذ فعلي.

---

## 1. حالة المستودع (مُتحقَّق فعليًا)

| البند | القيمة | الدليل |
|---|---|---|
| المستودع | `asdasdqqww111-lab/marsd-engines` (خاص) | فحص 2026-11-16 |
| الفرع الافتراضي | `master` | getRepo |
| رأس master | `164127cb` — "Merge pull request #8 … OIDC provider" | resolveRef |
| إجمالي الفروع | 19 فرعًا (فروع عمل المراحل B وC وD وE) | listBranches |
| Pull Requests | 11 مدموجة (#12/#13/#14 مفتوحة) | listPullRequests |
| Tags / Releases | 0 / 0 | listTags, listReleases |
| GitHub Actions | **صفر تشغيلات** — مجلد `.github` غير موجود على master | listWorkflowRuns, getContents |
| ملف CI جاهز غير مفعّل | `ci/ci.yml` موجود بجذر المستودع (portal: typecheck+lint+test+build, gitleaks) | getContents |
| عائق CI الموثق سابقًا | توكن GitHub بلا نطاق workflow (محاولتان فشلتا 2026-11-15/16) — استمر مفتوحًا | IMPLEMENTATION-CHECKLIST |
| صلاحيات التوكن الحالية | قراءة/كتابة ملفات وفروع/PRs: متاحة (أثبتت الأعمال أدناه) · نطاق workflow: غير متوفر (C-03 مستمر) | checkAccess + عمليات فعلية |

## 2. إصدارات التطبيقات والتقنيات (من package.json/pyproject الفعلية)

| التطبيق | المجلد | النواة | قاعدة البيانات | مدير الحزم | lockfile |
|---|---|---|---|---|---|
| HUDHUD CONTROL | `portal/` v0.4.0 | Next.js ^16.2.6 / React ^19.2.6 | PostgreSQL (Drizzle ^0.45.2) | npm | package-lock ✔ |
| HUDHUD Maps | `osiris-map/` | Next.js + MapLibre + Three.js | **لا شيء** | npm | package-lock ✔ |
| HUDHUD News | `neureed/` | Next.js + next-auth v5 + Prisma 7 | PostgreSQL + Redis | npm | package-lock ✔ |
| HUDHUD Verify | `loki-verify/` | Python/Flask (Poetry) | **لا شيء** (→ أضيف تخزين معزول SQLite في المرحلة B) | Poetry | poetry.lock ✔ |
| HUDHUD Identity | `zexa-auth/` v2.0.0 | Next.js + Better Auth ^1.6.11 + Drizzle | PostgreSQL | **pnpm** | pnpm-lock ✔ |
| HUDHUD Connect | `nchat/` | pnpm monorepo + Hasura v2 + GraphQL | PostgreSQL 16 + Redis + MinIO + Meilisearch + LiveKit | **pnpm** | pnpm-lock ✔ |
| HUDHUD Community | `rhex-forum/` v1.1.0 | Next.js + Prisma 6 + WebAuthn | PostgreSQL + Redis + S3 | **pnpm** (رسميًا عبر packageManager pnpm@10.33.4) | pnpm-lock ✔ (npm lock قديم — يُتجاهل، M-01) |
| HUDHUD Analytics | `umami/` | Next.js + Prisma 7 | PostgreSQL (+ ClickHouse/Kafka اختياري) | **pnpm** | pnpm-lock ✔ |

## 3. الفروع الحالية وحالتها

| الفرع | الحالة مقابل master | ملاحظة |
|---|---|---|
| `master` | — | رأس العمل |
| 11 فرع feature/audit مدموجة عبر PRs #1–#11 | مدموجة | تُترك كما هي (لا حذف) |
| `feature/hudhud-ci-activate` | فرع قديم خالٍ | يوثَّق فقط |
| `feature/hudhud-production-readiness` | فرع قديم خالٍ | يوثَّق فقط |
| `feature/hudhud-cicd` | فرع قديم خالٍ | يوثَّق فقط |
| `feature/hudhud-portal` | فرع قديم خالٍ | يوثَّق فقط |
| `feature/hudhud-completion-baseline` | المرحلتان A وB كاملتان | PR #12 مفتوح، لا دمج دون موافقة |
| `feature/hudhud-integration-phase-c` | المرحلة C كاملة (متفرع من B) | PR #13 مفتوح (قاعدته فرع B) |
| `feature/hudhud-i18n-phase-d` | المرحلة D كاملة (متفرع من C) | PR #14 مفتوح (قاعدته فرع C) |
| `feature/hudhud-ai-phase-e` | **فرع العمل الحالي** — المرحلة E (متفرع من D) | AI ENGINE: سجل مزودين + سياسة مفاتيح + شاشة بوابة |

## 4. عقود الصحة

| التطبيق | المسار | الدليل | الحالة |
|---|---|---|---|
| osiris-map | `/api/health` | src/app/api/health/route.ts | liveness فقط (بدون ادعاء جاهزية) |
| neureed | `/api/health` | app/api/health/route.ts | يفحص DB + pgvector فعليًا — أصدق العقود |
| loki-verify | `/api/health` | health.py | readiness.level حقيقي ready/degraded/not_ready (M-03) |
| zexa-auth | `/api/health` | src/app/api/health/route.ts | liveness فقط |
| nchat | `/api/health` | frontend/src/app/api/health/route.ts | liveness فقط |
| rhex-forum | `/api/health` | src/app/api/health/route.ts | liveness فقط |
| umami | `/api/heartbeat` | docker-compose healthcheck | كما هي |
| portal | `/api/health` | مسار عام في proxy.ts | كما هي |

## 5. مصفوفة المشكلات (سجل المشكلات المركزي)

الحالة: `OPEN` / `IN_PROGRESS` / `FIXED_UNVERIFIED` / `FIXED_VERIFIED` / `NEEDS_APPROVAL` / `BLOCKED`

> ملاحظة المنهجية: كل إصلاحات المراحل B–E كُتبت بالكود على فروع عمل دون دمج، ولم تُشغَّل فعليًا (لا بيئة تنفيذ) — حالتها `FIXED_UNVERIFIED` حتى إثباتها بتشغيل الاختبارات في staging/CI (المرحلة G). لا نستخدم "PASS" بلا دليل تشغيل.

| ID | التطبيق | الخطورة | المشكلة | الحل المنفّذ | الملفات المتأثرة | الحالة |
|---|---|---|---|---|---|---|
| C-01 | loki-verify | CRITICAL | تخزين نتائج الفحص في ملف مشترك + سباق كتابة | `result_store.py`: تخزين معزول uuid4 + SQLite (WAL) + استبقاء 30 يومًا + كوكي لكل متصفح + رسائل 503 صادقة | result_store.py، webapp.py | FIXED_UNVERIFIED |
| C-02 | zexa-auth | CRITICAL | مسار admin بلا فحص جلسة/دور داخلي + 500 مضلل | فحص جلسة صريح: 401/403 fail-closed + حدود إدخال | src/app/api/admin/users/route.ts | FIXED_UNVERIFIED |
| C-03 | المنظومة | CRITICAL | لا بيئة تشغيل/CI | توكن GitHub بلا نطاق workflow — يتطلب تدخل المشغّل | .github/workflows | BLOCKED (توكن) |
| **E-01** | المنظومة | HIGH | لا سجل مركزي لمزودي AI ولا سياسة مزودين | **المرحلة E:** `portal/src/lib/ai-providers.ts` — سجل من جرد فعلي (loki: OpenAI/Anthropic/local+Serper؛ nchat: OpenAI/Anthropic مع fallback محلي موجود أصلًا؛ البقية بلا LLM) + حظر Meta موثق (صفر حضور أكده الجرد) + `isProviderAllowed` + شاشة `/providers/ai` + اختبارات | portal/src/lib/ai-providers.ts، app/providers/ai/page.tsx، __tests__/ai-providers.test.ts | FIXED_UNVERIFIED |
| **E-02** | nchat | **CRITICAL (أمني)** | 6 ملفات lib/ai تسمح بقراءة مفاتيح AI من `NEXT_PUBLIC_OPENAI/ANTHROPIC_API_KEY` في المتصفح — كشف مفتاح مدفوع في حزمة JS إن ضُبط | **المرحلة E (جزئي):** `key-policy.ts` — مرجع جلب مفاتيح خادمي فقط (المتصفح undefined دائمًا) + قائمة محظورات NEXT_PUBLIC + اختبارات سياسة. **المتبقي:** إزالة فروع NEXT_PUBLIC من الملفات الستة تتطلب بيئة سحب/تشغيل (الملفات 15-18KB — التعديل عبر API من محتوى مقطوع مخاطرة كسر) | nchat/frontend/src/lib/ai/key-policy.ts، __tests__/key-policy.test.ts | PARTIAL → الترقيع الداخلي BLOCKED (C-03) |
| H-01 | المنظومة | HIGH | HUDHUD_APP_*_URL غير مضبوطة | **المرحلة C:** نظام عناوين مركزي app-urls.ts + HUDHUD_ENV + قوالب موثقة + اختبارات + شاشة إعدادات | portal/src/lib/app-urls.ts + شاشة الإعدادات | FIXED_UNVERIFIED |
| H-02 | المنظومة | HIGH | لا SSO موثق | **المرحلة C:** تدقيق OIDC كامل + قائمة تحقق staging + نقطة موافقة منفصلة | IDENTITY-OIDC-LOKI-AUDIT.md | NEEDS APPROVAL (تقييم مكتمل) |
| H-03 | loki-verify | HIGH | بلا مصادقة/حدود معدل — استهلاك LLM مجاني لأي زائر | **المرحلة C:** 3 خيارات معمارية موثقة (OIDC عبر zexa موصى به) + نقطة موافقة | IDENTITY-OIDC-LOKI-AUDIT.md | NEEDS APPROVAL (تقييم مكتمل) |
| H-04 | zexa-auth | HIGH | جداول OIDC غائبة عن الترحيلات | ترحيل 0002 CREATE-only + schema.ts + journal. 0002_snapshot.json يُولَّد محليًا | drizzle/0002، schema.ts | FIXED_UNVERIFIED |
| H-05 | المنظومة | HIGH | تعريب غائب | **المرحلة D:** قاموس موحد ثنائي + zexa عربية RTL كاملة (جذر/دخول/إدارة/زر CONTROL) + قالبا loki عربيان بهوية هدهد + ورقة RTL لقالب النتائج. **بقية التطبيقات وشاشات zexa المتبقية تدريجيًا** | hudhud-dictionary.ts + الشاشات المذكورة | PARTIAL (تعميم تدريجي) |
| H-06 | nchat | HIGH | شاشات تجريبية مكشوفة للإنتاج | DEV_ONLY_ROUTES موسعة (demo/search-demo/test-env) — الشاشات محفوظة تعمل في dev فقط | nchat/frontend/src/middleware.ts | FIXED_UNVERIFIED |
| H-07 | المنظومة | HIGH | قواعد hudhud_* المعزولة غير منفذة | يتطلب موارد إنتاج — نقطة موافقة في المرحلة G | إعدادات DB | NEEDS APPROVAL |
| M-01 | rhex-forum | MEDIUM | ازدواج lockfiles | pnpm رسمي؛ npm lock في .gitignore دون حذف | rhex-forum/.gitignore | FIXED_UNVERIFIED |
| M-02 | zexa-auth | MEDIUM | لوحة إدارة شبه فارغة | overview حقيقي + settings حقيقية + API fail-closed + sidebar كامل | admin pages + api | FIXED_UNVERIFIED |
| M-03 | loki-verify | MEDIUM | عقد صحة غير صادق | readiness.level ready/degraded/not_ready | health.py | FIXED_UNVERIFIED |
| M-04 | المنظومة | MEDIUM | لا زر عودة موحد إلى CONTROL | **المرحلة C:** ControlReturnLink خادمي env-driven في zexa (معرب في D بسهم RTL)؛ تعميم تدريجي | control-return-link.tsx + layouts | PARTIAL |
| M-06 | osiris-map | MEDIUM | /cutout بلا عودة للخريطة | ترويسة عائمة برابط عودة — إضافة فقط | cutout/page.tsx | FIXED_UNVERIFIED |
| M-08 | المنظومة | MEDIUM | حالات خماسية غير منفذة | **المرحلة C:** AppStatus خماسي + استهلاك readiness الفعلي + 5 KPIs + إصلاح تعارض registry.test.ts (كان يتحقق من 4 والسجل فيه 7) | portal lib + dashboard + api | FIXED_UNVERIFIED |
| L-01 | osiris-map | LOW | مجلدات scratch/runs | مراجعة gitignore — مرحلة لاحقة | .gitignore | OPEN |
| L-02 | المنظومة | LOW | لا Tags/Releases | خطة إصدارات عند الجاهزية (G) | — | OPEN |
| L-03 | المنظومة | LOW | فروع قديمة خالية | موثقة — لا حذف دون موافقة | — | OPEN |

## 6. إعادة تحقق من تقارير سابقة

| ما ورد | النتيجة |
|---|---|
| "صفحة /admin شبه فارغة" | أُصلحت (M-02) + الثغرة C-02 |
| "CI محجوب" | مؤكد (C-03) — 0 تشغيلات |
| "قواعد hudhud_* مخططة" | مؤكد (H-07) |
| "Loki بلا DB" | أُصلح (C-01) |
| "شاشات nChat التجريبية" | أُصلحت (H-06) |
| "لا SSO" | مؤكد + H-04 أصلح خطر الانهيار؛ OIDC جاهز كودًا بانتظار موافقة |
| "عقود صحة السبعة" | Loki صادق (M-03) والبوابة تستهلك العقد (M-08) |
| تعارض registry.test.ts (C) | أُصلح |
| عقد قالب نتائج loki (D) | القالب بقي دون تعديل (عقد C-01)؛ ورقة RTL جاهزة بموافقة |
| **جديد (E): مسار مفاتيح المتصفح** | 6 ملفات nchat تسمح بـ NEXT_PUBLIC_* لمفاتيح AI — اكتشاف جسري؛ السياسة والمرجع الخادمي منفذان، الترقيع الداخلي BLOCKED على بيئة تشغيل |

## 7. خطة التنفيذ المرحلية (A→G)

### المرحلة A ✅ + المرحلة B ✅ (كود — FIXED_UNVERIFIED)
كما في الإصدارات السابقة (C-01/C-02/M-01/M-02/M-03/M-06/H-04/H-06).

### المرحلة C ✅ (كود وتقييم — FIXED_UNVERIFIED)
H-01 عناوين مركزية · M-04 زر CONTROL (zexa) · M-08 حالات خماسية · H-02/H-03 تدقيق OIDC/Loki (لا تفعيل).

### المرحلة D ✅ (كود — FIXED_UNVERIFIED)
D-01 قاموس موحد · D-02 جذر zexa ar/RTL + IBM Plex Sans Arabic · D-03 شاشات zexa معربة · D-04 قالبا loki عربيان (+ورقة RTL جاهزة بموافقة). التعميم على بقية التطبيقات تدريجي.

### المرحلة E ✅ (كود — FIXED_UNVERIFIED / E-02 PARTIAL)
- [x] E-01 سجل مزودي AI المركزي (جرد فعلي، حظر Meta موثق، fallback صادق لكل مزود) + اختبارات
- [x] E-01 شاشة `/providers/ai` (حضور فقط؛ شاشة /providers الأصلية لم تُمس)
- [x] E-02 سياسة مفاتيح خادمية key-policy.ts + اختبارات — المرجع الوحيد لجلب المفاتيح، المتصفح undefined دائمًا
- [x] توثيق AI-ENGINE.md (جرد، قواعد R1–R4، نقاط موافقة)
- [ ] E-02 ترقيع الملفات الستة (إزالة فروع NEXT_PUBLIC) — **BLOCKED على بيئة سحب/تشغيل (C-03)**
- [ ] تفعيل أي مفتاح مدفوع — قرار المشغّل حصرًا (ZERO-COST)

### المرحلة F — الأمن والجودة
تدقيق OWASP عبر الشيفرة + توسيع security-audit.ts (يشمل متابعة إقفال E-02)

### المرحلة G — تجهيز الإنتاج
Staging + اختبارات فعلية + Backup/Restore + توثيق نهائي → **نقطة موافقة للنشر**

## 8. القيود الثابتة

1. لا دمج في `master` دون موافقة صريحة.
2. لا حذف شاشة/وظيفة أصلية — إضافات فقط.
3. لا migrations مدمرة — CREATE-only.
4. ZERO-COST RUNTIME — لا مفاتيح تُفعَّل؛ **Meta AI محظور تمامًا** (سياسة E-01).
5. لا ادعاء نجاح دون دليل تشغيل.
6. لا أسرار في المستودع/السجلات/الواجهات — **ومفاتيح AI لا تمر للمتصفح أبدًا (E-02)**.

## 9. فجوات التحقق المفتوحة (صادقة)

- إصلاحات المراحل B–E: **NOT RUN** (لا بيئة تنفيذ — C-03).
- E-02: السياسة منفذة ومختبرة، لكن فروع NEXT_PUBLIC القديمة في 6 ملفات nchat لا تزال في الشيفرة — أي مشغّل يضبط NEXT_PUBLIC_OPENAI_API_KEY اليوم يكشف المفتاح حتى إتمام الترقيع (موثق وشاشة البوابة تحذر).
- ترحيل OIDC 0002_snapshot.json: يُولَّد محليًا (db:generate).
- خط IBM Plex Sans Arabic: من Google Fonts — بيئة بلا إنترنت تحتاج self-hosted (قرار G).
- فحص تغييرات محلية غير ملتزمة: غير متاح عبر API.

---

*ملف حي. المرحلة E موثقة في git log للفرع `feature/hudhud-ai-phase-e` (6 التزامات).*
