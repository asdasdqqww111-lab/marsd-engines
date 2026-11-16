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
| إجمالي الفروع | 17 فرعًا (فرعا عمل المرحلتين B وC) | listBranches |
| Pull Requests | 11 مدموجة (PR #12 مفتوح — المرحلة A+B) | listPullRequests |
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
| `feature/hudhud-ci-activate` | خلف بـ 18، أمامه 0 | فرع قديم خالٍ — يوثَّق فقط |
| `feature/hudhud-production-readiness` | خلف بـ 22، أمامه 0 | فرع قديم خالٍ |
| `feature/hudhud-cicd` | خلف بـ 31، أمامه 0 | فرع قديم خالٍ |
| `feature/hudhud-portal` | خلف بـ 108، أمامه 0 | فرع قديم خالٍ |
| `feature/hudhud-completion-baseline` | المرحلتان A وB كاملتان | PR #12 مفتوح للمراجعة، لا دمج دون موافقة |
| `feature/hudhud-integration-phase-c` | **فرع العمل الحالي** — المرحلة C (متفرع من المرحلة B) | H-01 + M-04 + M-08 + H-02/H-03 كوثيقة تقييم |

## 4. عقود الصحة

| التطبيق | المسار | الدليل | الحالة بعد المرحلة C |
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

> ملاحظة المنهجية: كل إصلاحات المرحلتين B وC كُتبت بالكود على فروع عمل دون دمج، ولم تُشغَّل فعليًا (لا بيئة تنفيذ) — حالتها `FIXED_UNVERIFIED` حتى إثباتها بتشغيل الاختبارات في staging/CI (المرحلة G). لا نستخدم "PASS" بلا دليل تشغيل.

| ID | التطبيق | الخطورة | المشكلة | الحل المنفّذ | الملفات المتأثرة | الحالة |
|---|---|---|---|---|---|---|
| C-01 | loki-verify | CRITICAL | تخزين نتائج الفحص في ملف مشترك `assets/response.json` — آخر فحص يستبدل غيره + سباق كتابة | `result_store.py` جديد: تخزين معزول بمعرف فريد uuid4 لكل عملية + SQLite (WAL) أو memory للاختبار + حصص استبقاء 30 يومًا + تحقق صارم من شكل المعرف. `webapp.py`: مسار POST يخزن معزولًا ويعرض النتيجة عبر كوكي خاص بالمتصفح (قالب النتائج الأصلي دون أي تعديل) + رسائل فشل صادقة 503 عند غياب مزود AI دون اختلاق نتائج | result_store.py، webapp.py | FIXED_UNVERIFIED |
| C-02 | zexa-auth | CRITICAL | مسار `/api/admin/users` لا يتحقق من الجلسة/الدور داخليًا (اعتماد كلي على حماية الواجهة) + إرجاع 500 مضلل عند فشل الصلاحية | فحص جلسة صريح في المسار: مجهول→401، غير admin→403 (fail-closed من الخادم) + حدود إدخال (limit≤100) | src/app/api/admin/users/route.ts | FIXED_UNVERIFIED |
| C-03 | المنظومة | CRITICAL | لا بيئة تشغيل/CI — كل الفحوص NOT RUN | عائق توكن GitHub (نطاق workflow) — يتطلب من المشغّل تفعيل نطاق التوكن أو إضافة `.github/workflows` من واجهة GitHub | .github/workflows (من ci/ci.yml الجاهز) | BLOCKED (توكن) |
| H-01 | المنظومة | HIGH | `HUDHUD_APP_*_URL` غير مضبوطة → حالات "غير معروف" ولا فتح تطبيقات من البوابة | **المرحلة C (منجز):** نظام عناوين مركزي `portal/src/lib/app-urls.ts` — HUDHUD_ENV يحدد البيئة (dev/staging/production)، لكل تطبيق نمط نطاق موثق يُعرض للمشغّل في الإعدادات (نص وصفي فقط، لا عناوين حقيقية)، القيم الفعلية من HUDHUD_APP_*_URL حصرًا، لا افتراضات عامة + اختبارات + HUDHUD_ENV في .env.example | portal/src/lib/app-urls.ts، __tests__/app-urls.test.ts، app/settings/page.tsx، portal/.env.example | FIXED_UNVERIFIED |
| H-02 | المنظومة | HIGH | لا SSO/هوية مركزية موثقة | **المرحلة C (تقييم):** وثيقة IDENTITY-OIDC-LOKI-AUDIT.md — تدقيق OIDC الفعلي من الشيفرة (plugin opt-in + عملاء من البيئة + JWKS + جداول H-04) + قائمة تحقق staging قبل أي تفعيل + نقطة موافقة منفصلة | docs/production-readiness/IDENTITY-OIDC-LOKI-AUDIT.md | NEEDS APPROVAL (تقييم مكتمل) |
| H-03 | loki-verify | HIGH | بلا مصادقة/حدود معدل — أي زائر يستهلك LLM المدفوع | **المرحلة C (تقييم):** ثلاثة خيارات معمارية موثقة (OIDC عبر zexa موصى به / قفل شبكي / مصادقة مستقلة) + نقطة موافقة قبل تعديل شيفرة loki | docs/production-readiness/IDENTITY-OIDC-LOKI-AUDIT.md | NEEDS APPROVAL (تقييم مكتمل) |
| H-04 | zexa-auth | HIGH | جداول OIDC غائبة كليًا عن الترحيلات رغم تفعيل PR #8 — تفعيل OIDC سينهار عند أول authorize | ترحيل `0002_oidc_provider_tables.sql` (CREATE فقط، غير مدمّر) بثلاثة جداول مطابقة لِ better-auth@1.6.11 + تحديث schema.ts + تسجيل journal. **فجوة توثيق:** 0002_snapshot.json يُولَّد بـ drizzle-kit محليًا (db:generate) | drizzle/0002، meta/_journal.json، src/db/schema.ts | FIXED_UNVERIFIED |
| H-05 | المنظومة | HIGH | تعريب غائب (واجهات Loki إنجليزية بعلامة LibrAI؛ zexa/umami إنجليزية) | المرحلة D | قوالب/صفحات | OPEN (مرحلة D) |
| H-06 | nchat | HIGH | شاشات تجريبية مكشوفة للإنتاج: `/demo`, `/search-demo`, `/test-env` (`/dev` محمي سابقًا) | توسيع `DEV_ONLY_ROUTES` في middleware.ts لتشمل الثلاثة — **الشاشات محفوظة** وتعمل في dev/E2E وتُحجب في production فقط | nchat/frontend/src/middleware.ts | FIXED_UNVERIFIED |
| H-07 | المنظومة | HIGH | قواعد `hudhud_*` المعزولة غير منفذة | يتطلب بنية إنتاج (موارد) — نقطة موافقة في المرحلة G | إعدادات DB | NEEDS APPROVAL |
| M-01 | rhex-forum | MEDIUM | ازدواج lockfiles (npm + pnpm) | pnpm رسمي (packageManager + Dockerfile --frozen-lockfile)؛ `package-lock.json` القديم أُضيف إلى .gitignore — **لم يُحذف الملف** | rhex-forum/.gitignore | FIXED_UNVERIFIED |
| M-02 | zexa-auth | MEDIUM | لوحة إدارة شبه فارغة (تحويل فقط) + رابط sidebar إلى مسار غير موجود (`/admin/settings` كان 404) | `/admin` لوحة overview حقيقية (عدادات من PostgreSQL الفعلي — فشل القراءة يظهر "Error" بصدق) + `/admin/settings` شاشة إعدادات حقيقية (OIDC/social/بريد/جلسات — حالات فقط لا أسرار) + `/api/admin/settings` fail-closed (401/403) + تغطية sidebar كاملة | src/app/admin/page.tsx، admin/settings/page.tsx، api/admin/settings/route.ts، lib/auth.ts، dashboard-sidebar.tsx | FIXED_UNVERIFIED |
| M-03 | loki-verify | MEDIUM | عقد صحة يرد "ok" دائمًا دون فحص تبعيات | health.py: liveness + readiness.level (ready/degraded/not_ready) — حضور فقط، لا أسرار | loki-verify/health.py | FIXED_UNVERIFIED |
| M-04 | المنظومة | MEDIUM | لا زر عودة موحد للتطبيقات إلى CONTROL | **المرحلة C (منجز في zexa كنموذج مرجعي):** مكوّن خادمي `ControlReturnLink` يقرأ `HUDHUD_CONTROL_URL` — مخفي كليًا عند غياب المتغير (لا افتراض) + دمج في admin layout بنمط slot خادمي (العنوان لا يمر عبر props عميلة) + توثيق في .env.example. تعميمه على بقية التطبيقات لاحقًا تدريجيًا | zexa-auth/src/components/control-return-link.tsx، admin/layout.tsx، dashboard-layout.tsx، .env.example | PARTIAL (zexa منجز، بقية التطبيقات تدريجيًا) |
| M-06 | osiris-map | MEDIUM | `/cutout` معزولة من التنقل — لا عودة إلى الخريطة عند وجود bbox صالح | ترويسة عائمة دائمة برابط "Open the map" — إضافة في page.tsx فقط، CutoutView دون تعديل | osiris-map/src/app/cutout/page.tsx | FIXED_UNVERIFIED |
| M-08 | المنظومة | MEDIUM | حالات الصحة الخماسية غير منفذة | **المرحلة C (منجز):** AppStatus أصبح خماسيًا (healthy/degraded/starting/down/unknown) + health.ts يستهلك readiness.level الفعلي من جسم استجابة كل تطبيق (loki: ready→healthy، degraded→degraded، not_ready→starting) + لوحة القيادة تعرض الخمس KPIs + اللقطات والتدقيق يسجلان الخمسة (عمود status نص حر — لا ترحيل) + **إصلاح تعارض registry.test.ts** (كان يتحقق من 4 عقود والسجل فيه 7 — كان سيفشل) | portal/src/lib/registry.ts، health.ts، app/page.tsx، api/health/apps/route.ts، __tests__/registry.test.ts | FIXED_UNVERIFIED |
| L-01 | osiris-map | LOW | مجلدات scratch/runs في الشجرة | مراجعة gitignore — مرحلة لاحقة | .gitignore | OPEN |
| L-02 | المنظومة | LOW | لا Tags/Releases | خطة إصدارات عند الجاهزية (مرحلة G) | — | OPEN |
| L-03 | المنظومة | LOW | أربعة فروع قديمة خالية | موثقة في §3 — لا حذف دون موافقة | — | OPEN |

## 6. إعادة تحقق من تقرير الاستكشاف السابق

| ما ورد سابقًا | نتيجة إعادة التحقق |
|---|---|
| "صفحة /admin في zexa شبه فارغة" | كانت تحويلًا؛ الآن لوحة overview حقيقية، والمسار كان بلا حماية داخلية (C-02) + إدارة OIDC غائبة من القاعدة (H-04) |
| "CI محجوب بسبب نطاق التوكن" | مؤكد — 0 تشغيلات وci/ci.yml جاهز غير مفعّل |
| "قواعد hudhud_* مخططة فقط" | مؤكد |
| "Loki بلا DB ومشكلة ملف مشترك" | مؤكد وأُصلح معماريًا (C-01) |
| "شاشات nChat التجريبية" | مؤكد وأُصلح بحرس بيئة (H-06)؛ `/dev` كان محميًا أصلًا |
| "لا SSO" | مؤكد مع دقة جديدة: OIDC موجود ككود لكن **كان سيؤدي لانهيار تشغيلي** لغياب الجداول — أُصلح (H-04) |
| "عقود صحة للسبعة" | مؤكدة؛ Loki صادق readiness (M-03) والبوابة تستهلك العقد فعليًا الآن (M-08) |
| **جديد في المرحلة C:** تعارض registry.test.ts | الاختبار كان يتحقق من 4 عقود صحة "verified" فقط بينما السجل يحوي 7 (بعد PRs #5/#8) — كان سيفشل عند التشغيل؛ أُصلح |

## 7. خطة التنفيذ المرحلية (A→G)

### المرحلة A — تثبيت الأساس ✅ مكتملة
- [x] إعادة تحقق كاملة (فروع/PRs/commits/Actions/اعتماديات/ترحيلات)
- [x] BASELINE.md + مصفوفة المشكلات
- [x] فرع العمل `feature/hudhud-completion-baseline`

### المرحلة B — إصلاح التطبيقات ✅ منجزة ككود (كلها FIXED_UNVERIFIED حتى التشغيل)
- [x] C-02 إغلاق ثغرة الوصول في zexa-admin
- [x] C-01 تخزين معزول لنتائج Loki + فشل صادق
- [x] M-03 عقد صحة صادق لـ Loki
- [x] H-06 حرس بيئة لشاشات nChat التجريبية (دون حذف)
- [x] M-01 حسم pnpm لـ rhex-forum (دون حذف ملف)
- [x] H-04 ترحيل + schema جداول OIDC في zexa
- [x] M-02 استكمال لوحة إدارة zexa (overview حقيقي + settings حقيقية + API محمي)
- [x] M-06 رابط عودة دائم إلى الخريطة في /cutout (إضافة فقط)
- [ ] فحوص تشغيلية لكل ما أعلاه عند توفر بيئة (تُسجل بصدق NOT RUN حتى ذلك الحين)

### المرحلة C — التكامل ✅ منجزة ككود وتقييم (كلها FIXED_UNVERIFIED حتى التشغيل)
- [x] H-01 نظام عناوين مركزي (app-urls.ts + HUDHUD_ENV + قوالب موثقة + اختبارات + شاشة إعدادات)
- [x] M-04 زر عودة إلى CONTROL (نموذج مرجعي في zexa — env-driven، مخفي عند غياب المتغير؛ تعميم تدريجي لاحق)
- [x] M-08 حالات خماسية في البوابة + استهلاك عقود readiness الفعلية + إصلاح تعارض اختبار السجل
- [x] H-02/H-03 وثيقة تدقيق OIDC ومصادقة Loki — تقييم كامل، **لا تفعيل SSO** (نقطة موافقة منفصلة)
- [ ] تعميم ControlReturnLink على بقية التطبيقات (تدريجي، كل تطبيق إضافة فقط)
- [ ] فحوص تشغيلية عند توفر بيئة

### المرحلة D — الهوية والتعريب
H-05 i18n كامل + عربية افتراضية + RTL + قاموس موحد

### المرحلة E — HUDHUD AI ENGINE
AI Gateway بموارد ZERO-COST موثقة الحدود، Meta AI محظور

### المرحلة F — الأمن والجودة
تدقيق OWASP عبر الشيفرة + توسيع security-audit.ts

### المرحلة G — تجهيز الإنتاج
Staging + اختبارات فعلية + Backup/Restore مختبر + توثيق نهائي → **نقطة موافقة للنشر**

## 8. القيود الثابتة (ملزمة لكل المراحل)

1. لا دمج في `master` دون موافقة صريحة — فروع العمل وكل ما عليها تبقى للمراجعة فقط.
2. لا حذف أي شاشة أو وظيفة أصلية — إضافات فقط.
3. لا migrations مدمرة — كل ترحيل جديد CREATE-only.
4. ZERO-COST RUNTIME — لا خدمات مدفوعة، لا مفاتيح جديدة تُفعَّل. Meta AI محظور تمامًا.
5. لا ادعاء نجاح دون دليل — FIXED_UNVERIFIED لا تصبح VERIFIED إلا بتشغيل فعلي موثق.
6. لا أسرار في المستودع أو السجلات أو الواجهات.

## 9. فجوات التحقق المفتوحة (صادقة)

- كل إصلاحات المرحلتين B وC: **NOT RUN** (كود مكتوب ومراجَع ذاتيًا، بلا بيئة تنفيذ للوكيل).
- ترحيل OIDC 0002: صالح للتشغيل لكن 0002_snapshot.json يُولَّد محليًا بـ `pnpm db:generate`.
- عقود readiness للمحركات الخمسة غير الصادقة (zexa/nchat/rhex liveness فقط؛ osiris يصرح scope=process بصدق) — تحسينها تدريجي بعد المرحلة D حسب أولوية كل تطبيق.
- فحص تغييرات غير ملتزمة محليًا: غير متاح عبر API — مسؤولية المشغّل عند السحب.

---

*ملف حي — يُحدَّث مع كل مرحلة. المرحلة C موثقة في git log للفرع `feature/hudhud-integration-phase-c` (13 التزامًا).*
