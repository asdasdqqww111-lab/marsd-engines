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
| إجمالي الفروع | 16 فرعًا | listBranches |
| Pull Requests | 11 — كلها مغلقة ومدموجة (لا PRs مفتوحة) | listPullRequests |
| Tags / Releases | 0 / 0 | listTags, listReleases |
| GitHub Actions | **صفر تشغيلات** — مجلد `.github` غير موجود على master | listWorkflowRuns, getContents |
| ملف CI جاهز غير مفعّل | `ci/ci.yml` موجود بجذر المستودع (portal: typecheck+lint+test+build, gitleaks) | getContents |
| تغييرات غير ملتزمة | غير قابل للفحص عبر API البعيد — يُفترض نظافة الشجرة؛ `worktree` محلي غير متاح للوكيل | — |
| عائق CI الموثق سابقًا | توكن GitHub بلا نطاق workflow (محاولتان فشلتا 2026-11-15/16) — استمر مفتوحًا | IMPLEMENTATION-CHECKLIST |

## 2. إصدارات التطبيقات والتقنيات (من package.json/pyproject الفعلية)

| التطبيق | المجلد | الإصدار المعلن | النواة | قاعدة البيانات | مدير الحزم | lockfile |
|---|---|---|---|---|---|---|
| HUDHUD CONTROL | `portal/` | 0.4.0 | Next.js ^16.2.6 / React ^19.2.6 | PostgreSQL (Drizzle ^0.45.2، مخطط `hudhud_core`) | npm | package-lock.json ✔ |
| HUDHUD Maps | `osiris-map/` | — (package.json 1408B) | Next.js + MapLibre + Three.js | **لا شيء** (usesPostgres=false) | npm | package-lock.json ✔ |
| HUDHUD News | `neureed/` | — | Next.js + next-auth v5 + Prisma 7 | PostgreSQL + Redis | npm | package-lock.json ✔ |
| HUDHUD Verify | `loki-verify/` | — | Python/Flask (pyproject + poetry.lock) | **لا شيء** | Poetry | poetry.lock ✔ |
| HUDHUD Identity | `zexa-auth/` | — | Next.js + Better Auth + Drizzle | PostgreSQL | **pnpm** | pnpm-lock.yaml ✔ |
| HUDHUD Connect | `nchat/` | — | pnpm monorepo + Hasura v2 + GraphQL | PostgreSQL 16 + Redis + MinIO + Meilisearch + LiveKit | **pnpm** | pnpm-lock.yaml ✔ |
| HUDHUD Community | `rhex-forum/` | — | Next.js + Prisma 6 + WebAuthn | PostgreSQL + Redis + S3 | npm **وpnpm** معًا ⚠️ | package-lock + pnpm-lock (ازدواج) |
| HUDHUD Analytics | `umami/` | — | Next.js + Prisma 7 | PostgreSQL (+ ClickHouse/Kafka اختياري) | **pnpm** | pnpm-lock.yaml ✔ |

⚠️ ملاحظة جرد: `rhex-forum` يحوي lockfiles لمديرين مختلفين — يلزم حسم مدير الحزم المعتمد قبل CI (المشكلة M-07 أدناه).

## 3. الفروع الحالية وحالتها

| الفرع | الحالة مقابل master | ملاحظة |
|---|---|---|
| `master` | — | رأس العمل |
| 11 فرع feature/audit (phase1→4, design2→3, identity, health, ci-ready) | مدموجة عبر PRs #1–#11 | تُترك كما هي (لا حذف) |
| `feature/hudhud-ci-activate` | خلف بـ 18، أمامه 0 | **فرع قديم بدون محتوى جديد** |
| `feature/hudhud-production-readiness` | خلف بـ 22، أمامه 0 | **فرع قديم بدون محتوى جديد** |
| `feature/hudhud-cicd` | خلف بـ 31، أمامه 0 | **فرع قديم بدون محتوى جديد** |
| `feature/hudhud-portal` | خلف بـ 108، أمامه 0 | **فرع قديم بدون محتوى جديد** |
| `feature/hudhud-completion-baseline` | جديد — من master | فرع هذه المرحلة |

القرار: لا حذف ولا force-push. الفروع الأربعة القديمة خاوية أماميًا (كل محتواها مدموج) وتوثَّق كمخلفات قابلة للأرشفة لاحقًا بموافقة.

## 4. عقود الصحة (مُتحقَّق منها في الشيفرة)

| التطبيق | المسار | الدليل |
|---|---|---|
| osiris-map | `/api/health` | `osiris-map/src/app/api/health/route.ts` |
| neureed | `/api/health` | `neureed/app/api/health/route.ts` |
| loki-verify | `/api/health` | `loki-verify/health.py` (blueprint مسجل بلا شروط في webapp.py) — liveness فقط بلا فحص تبعيات |
| zexa-auth | `/api/health` | `zexa-auth/src/app/api/health/route.ts` |
| nchat | `/api/health` | `nchat/frontend/src/app/api/health/route.ts` |
| rhex-forum | `/api/health` | `rhex-forum/src/app/api/health/route.ts` |
| umami | `/api/heartbeat` | docker-compose healthcheck |
| portal | `/api/health` | مسار عام في proxy.ts |

⚠️ ملاحظة جودة: عقود الصحة الحالية **liveness فقط** — لا تميز HEALTHY/DEGRADED/CONFIGURATION_ERROR كما يتطلب التوجيه. تصنيفات الحالة الخماسية مطلوبة في المرحلة B/C.

## 5. مصفوفة المشكلات (سجل المشكلات المركزي)

الحالة: `OPEN` / `IN_PROGRESS` / `FIXED_UNVERIFIED` / `FIXED_VERIFIED` / `NEEDS_APPROVAL` / `BLOCKED`

| ID | التطبيق | الخطورة | المشكلة | الدليل | الحل المقترح | الملفات المتأثرة | الاختبارات المطلوبة | الحالة |
|---|---|---|---|---|---|---|---|---|
| C-01 | loki-verify | CRITICAL | تخزين نتائج الفحص في ملف مشترك `assets/response.json` — آخر فحص يستبدل نتائج غيره؛ سباق كتابة عند التزامن | `webapp.py:36-44` (open/json.dump) و `webapp.py:49-57` (قراءة الملف) | تخزين دائم معزول + معرف فريد لكل عملية + ربط بالمستخدم/الطلب | webapp.py + طبقة تخزين جديدة + قالب النتائج | اختبار تزامن (طلبان متوازيان) + اختبار عزل النتائج + فشل التحليل | OPEN |
| C-02 | zexa-auth | CRITICAL | مسار `GET /api/admin/users` **لا يتحقق من الجلسة أو الدور داخل المسار** — الاعتماد كليًا على حماية الواجهة (layout) — Broken Access Control | `src/app/api/admin/users/route.ts:1-1412B` — لا getSession ولا فحص role | فحص جلسة + دور admin داخل المسار (fail-closed من الخادم) | route.ts | اختبار: طلب بلا جلسة → 401؛ جلسة غير admin → 403 | OPEN |
| C-03 | المنظومة | CRITICAL | لا بيئة تشغيل/CI — كل فحوص NOT RUN؛ لا يمكن إثبات أي وظيفة تشغيليًا | listWorkflowRuns=0، .github غير موجود على master | تفعيل CI (يتطلب توكن بنطاق workflow) + بيئة staging | .github/workflows (من ci/ci.yml الجاهز) | تشغيل workflow فعلي | BLOCKED (توكن) |
| H-01 | المنظومة | HIGH | `HUDHUD_APP_*_URL` غير مضبوطة في أي بيئة → كل الحالات "غير معروف" ولا يمكن فتح أي تطبيق من البوابة | registry.ts + .env.example فقط | نظام إعدادات مركزي لكل بيئة (dev/staging/prod) + تحقق صحة العناوين | portal/lib + env docs | فحص صحة لكل عنوان مضبوط | OPEN |
| H-02 | المنظومة | HIGH | لا SSO/هوية مركزية — 5 أنظمة مصادقة منفصلة؛ zexa OIDC موجود (PR #8) لكن غير مفعّل إلا staging اختياري وغير مدقّق أمنيًا | سجل التطبيقات + docs/HUDHUD-IDENTITY-OIDC-PROVIDER | تدقيق OIDC (PKCE، redirect URIs، tokens) ثم خطة انتقال اختيارية | zexa + عقد تكامل التطبيقات | اختبارات Authorization Code Flow + CSRF/replay | NEEDS APPROVAL (قرار معماري) |
| H-03 | loki-verify | HIGH | بلا مصادقة ولا مستخدمين ولا صلاحيات إطلاقًا — أي زائر يستهلك LLM المدفوع | webapp.py بلا أي auth | طبقة مصادقة متوافقة مع عقد HUDHUD + حدود معدل | webapp.py | اختبار رفض مجهول + حد المعدل | OPEN |
| H-04 | zexa-auth | HIGH | إدارة OIDC/OAuth غير مكتملة: مخطط قاعدة البيانات **لا يحوي جداول OIDC** (user/session/account/verification فقط) — تنفيذ PR #8 يعتمد على جداول غير موجودة في migrations المرئية | `src/db/schema.ts` (4 جداول) + drizzle/0000,0001 | تدقيق ما أضافه PR #8 فعليًا + استكمال schema/ترحيلات OIDC | schema.ts + drizzle/ | اختبار ترحيل + فحص جداول | OPEN |
| H-05 | المنظومة | HIGH | تعريب غائب كليًا: واجهات loki-verify إنجليزية بعلامة LibrAI (علامة تجارية ثالثة ظاهرة للمستخدم)؛ واجهات zexa/umami إنجليزية | templates/input.html + LibrAI_fc.html؛ صفحات zexa | نظام i18n لكل تطبيق + عربية افتراضية + إزالة العلامات الدخيلة من واجهات HUDHUD | قوالب Loki، صفحات zexa/umami المستهدفة، ملفات locales | اختبار جرد نصوص غير مترجمة + فحص RTL | OPEN |
| H-06 | nchat | HIGH | شاشات تجريبية مكشوفة في شجرة الإنتاج: `/demo`, `/search-demo`, `/test-env`, `/dev` | مجلدات موجودة في app/ | حرس بيئة (تُخفى خارج dev) دون حذف أي شاشة | middleware/app للصفحات الأربع | اختبار وصول 404 في وضع prod | OPEN |
| H-07 | المنظومة | HIGH | قواعد البيانات المعزولة `hudhud_*` غير منفذة — كل تطبيق يستخدم قاعدة تكوين خاصة به بلا عزل موحد موثق | docs/PRODUCTION-READINESS (المرحلة 5 مخططة) | تنفيذ مخطط العزل + أدوار DB منفصلة (يتطلب موافقة موارد) | إعدادات اتصال كل تطبيق | اختبار رفض وصول تطبيق لقاعدة تطبيق آخر | NEEDS APPROVAL (بنية) |
| M-01 | rhex-forum | MEDIUM | ازدواج lockfiles: package-lock.json وpnpm-lock.yaml معًا — خطر تثبيتات غير حتمية | جذر rhex-forum | حسم مدير واحد وتوثيقه | الملفان + package.json | تثبيت نظيف من lockfile واحد | OPEN |
| M-02 | zexa-auth | MEDIUM | صفحة `/admin` تحويل فقط لـ `/admin/users`؛ لا إدارة جلسات/أحداث أمنية/عملاء OIDC | admin/page.tsx (142B) | استكمال لوحة إدارة فعلية بعد جرد Backend | src/app/admin/** | اختبار كل وظيفة من الخادم | OPEN |
| M-03 | loki-verify | MEDIUM | `/api/health` يرد "ok" دائمًا دون فحص جاهزية التبعيات (LLM/retriever) — يكذب على البوابة | health.py | تمييز liveness من readiness + كشف config_error | health.py | فحص صحة مع تبعيات معطلة | OPEN |
| M-04 | المنظومة | MEDIUM | لا زر عودة موحد من التطبيقات إلى CONTROL | فحص التنقل في التقرير السابق | مكوّن عودة خفيف غير مدمِّر لقوائم التطبيقات | كل تطبيق (إضافة فقط) | فحص رابط العودة | OPEN |
| M-05 | nchat | MEDIUM | `/demo` (23KB) وغيرها ضمن شجرة الإنتاج — خطر أداء وارتباك | demo/page.tsx | يُدمج مع H-06 | نفس H-06 | نفس H-06 | OPEN |
| M-06 | osiris-map | MEDIUM | `/cutout` (830B) معزولة من التنقل — ميزة بلا مدخل أو بقايا | cutout/page.tsx | قرار: ربط بالتنقل أو وسمها كأداة مساعدة | cutout/page.tsx + التنقل | فحص الوصول | OPEN |
| M-07 | rhex-forum | MEDIUM | (نفس M-01 — إبقاء للإحالة المتبادرة) مدير حزم غير محسم | — | — | — | — | OPEN |
| M-08 | المنظومة | MEDIUM | الحالة الخماسية للصحة (HEALTHY/DEGRADED/UNAVAILABLE/UNKNOWN/CONFIGURATION_ERROR) غير منفذة في عقود التطبيقات | health routes | توحيد عقد الحالة | كل مسار صحة | اختبار كل حالة | OPEN |
| L-01 | osiris-map | LOW | بقايا scratch/runs/scratch في شجرة المستودع | مجلدات موجودة | مراجعة gitignore دون حذف | .gitignore | فحص نظافة build | OPEN |
| L-02 | المنظومة | LOW | لا Versioning/Tags/Releases | listTags=0 | خطة إصدارات عند الجاهزية | — | — | NEEDS APPROVAL (عند النشر) |
| L-03 | المنظومة | LOW | الفروع القديمة الأربعة الخاوية (ci-activate, production-readiness, cicd, portal) | compareRefs | توثيق فقط — لا حذف دون موافقة | — | — | OPEN |

## 6. مشكلات تقرير الاستكشاف السابق — إعادة تحقق

| ما ورد في تقرير 2026-11-16 | نتيجة إعادة التحقق |
|---|---|
| "صفحة /admin في zexa شبه فارغة" | **دقّق أكثر:** هي تحويل لـ `/admin/users` وهذه موجودة لكن Backendها (getUsers) يعتمد على حماية خارجية — المشكلة أمنية (C-02) وليست شكلية فقط |
| "CI محجوب بسبب نطاق التوكن" | **مؤكد:** لا `.github` على master + 0 تشغيلات + `ci/ci.yml` جاهز بلا تفعيل |
| "قواعد hudhud_* مخططة فقط" | **مؤكد** (لا دليل تنفيذ) |
| "Loki بلا DB ومشكلة ملف مشترك" | **مؤكد بالسطر** (webapp.py) |
| "شاشات nChat التجريبية" | **مؤكد** (`/demo` 23KB، `/search-demo`, `/test-env`, `/dev`) |
| "لا SSO" | **مؤكد مع تعقيد جديد:** PR #8 أضاف OIDC لكن مخطط DB الظاهر لا يحوي جداول OIDC → يلزم تدقيق H-04 قبل أي اعتماد |
| "عقود صحة للسبعة" | **مؤكد وجودها؛ لكنها liveness فقط** → M-03/M-08 |

## 7. خطة التنفيذ المرحلية (وفق التوجيه — مراحل A→G)

### المرحلة A — تثبيت الأساس (هذه المرحلة)
- [x] إعادة تحقق كاملة من الحالة (الفروع/PRs/commits/Actions/الاعتماديات)
- [x] ملف خط الأساس هذا (BASELINE.md)
- [ ] خريطة الاعتماديات للمشكلات (أدناه)
- [ ] إعداد فروع العمل القادمة

### المرحلة B — إصلاح التطبيقات (الأولوية للحرج)
1. **C-02** إغلاق ثغرة الوصول في zexa-admin (أصغر تغيير، أعلى أثر)
2. **C-01 + H-03 + M-03** إصلاح معمارية Loki Verify (تخزين معزول + مصادقة + عقد صحة صادق)
3. **H-04** تدقيق/استكمال مخطط OIDC في zexa
4. **M-02** استكمال لوحة إدارة zexa (بعد جرد Backend كامل)
5. **H-06** حرس بيئة لشاشات nChat التجريبية
6. **M-01** حسم مدير حزم rhex-forum

### المرحلة C — التكامل
- **H-01** نظام عناوين مركزي (dev/staging/prod) + تحقق الصحة
- **M-04** تنقل موحد (عودة إلى CONTROL)
- **M-08** عقود الحالة الخماسية
- **H-02** تدقيق OIDC + مصفوفة مصادقة → **يتوقف عند نقطة موافقة** قبل أي تفعيل SSO
- **H-07** قواعد معزولة → **NEEDS APPROVAL**

### المرحلة D — الهوية والتعريب
- **H-05** i18n + عربية افتراضية + RTL + قاموس مصطلحات موحد + إزالة العلامات الدخيلة من الواجهات (مع الحفاظ على كل شاشة ووظيفة أصلية)

### المرحلة E — HUDHUD AI ENGINE
- بناء AI Gateway/Router مع Provider Registry وحدود استخدام وZERO-COST RUNTIME — لا تفعيل أي مزود دون تحقق حدود مجانية موثق؛ Meta AI محظور

### المرحلة F — الأمن والجودة
- تدقيق OWASP شامل عبر الشيفرة + توسيع security-audit.ts + توثيق الثغرات والإصلاحات

### المرحلة G — تجهيز الإنتاج
- Staging (يتطلب موارد — نقطة موافقة) + الاختبارات الفعلية + Backup/Restore مختبر + توثيق FINAL-ACCEPTANCE

## 8. القيود الثابتة (ملزمة لكل المراحل)

1. لا دمج في `master` دون موافقة صريحة — PRs للمراجعة فقط.
2. لا حذف أي شاشة أو وظيفة أصلية — إضافات فقط إلا بضرورة معمارية موثقة وموافقة.
3. لا migrations مدمرة، لا DROP/TRUNCATE، لا استبدال بيانات.
4. ZERO-COST RUNTIME: لا خدمات مدفوعة، لا مفاتيح جديدة تُفعَّل دون تحقق حدود مجانية موثق. Meta AI محظور تمامًا.
5. لا ادعاء نجاح دون دليل — NOT RUN تُسجَّل بصراحة ولا تتحول إلى PASS.
6. لا أسرار في المستودع أو السجلات أو الواجهات.

## 9. الفجوات المفتوحة لهذه المرحلة

- **فحص تشغيلي (typecheck/lint/test/build):** NOT RUN — لا بيئة تنفيذ محلية للوكيل ولا CI شغّال. يُعالج في المرحلة G عند توفر staging أو تفعيل CI.
- **فحص تغييرات غير ملتزمة محليًا:** غير متاح عبر API البعيد — يتحقق منه المشغّل عند السحب.

---

*هذا الملف سجل حي — يُحدَّث مع كل مرحلة تنفيذ مع الالتزام المرجعي والدليل.*
