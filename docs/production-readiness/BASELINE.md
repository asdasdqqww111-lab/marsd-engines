# HUDHUD — خط الأساس للجاهزية للإنتاج (BASELINE)

**التاريخ:** 2026-11-16 (UTC)
**الفرع المفحوص:** `master` @ `164127cb9c6bb23357c010b3b622873d87a2eacc`
**طريقة الفحص:** قراءة مباشرة عبر GitHub API — قراءة فقط، لا تشغيل.
**الغرض:** نقطة مرجعية موثقة. لا يُعتبر أي عنصر "مكتملًا" دون دليل تنفيذ فعلي.

---

## 1. حالة المستودع (مُتحقَّق فعليًا)

| البند | القيمة | الدليل |
|---|---|---|
| المستودع | `asdasdqqww111-lab/marsd-engines` (خاص) | فحص 2026-11-16 |
| الفرع الافتراضي | `master` | getRepo |
| رأس master | `164127cb` — "Merge pull request #8 … OIDC provider" | resolveRef |
| إجمالي الفروع | 20 فرعًا (فروع عمل المراحل B–F) | listBranches |
| Pull Requests | 11 مدموجة (#12/#13/#14/#15 مفتوحة) | listPullRequests |
| Tags / Releases | 0 / 0 | listTags, listReleases |
| GitHub Actions | **صفر تشغيلات** — `.github` غير موجود على master | listWorkflowRuns |
| ملف CI جاهز غير مفعّل | `ci/ci.yml` بجذر المستودع | getContents |
| عائق CI | توكن GitHub بلا نطاق workflow — C-03 مستمر | IMPLEMENTATION-CHECKLIST |
| صلاحيات التوكن | قراءة/كتابة ملفات وفروع/PRs متاحة · نطاق workflow غير متوفر | checkAccess + عمليات فعلية |

## 2. التطبيقات (كما في الإصدارات السابقة)

| التطبيق | المجلد | النواة | مدير الحزم |
|---|---|---|---|
| HUDHUD CONTROL | `portal/` v0.4.0 | Next.js 16 + Drizzle | npm |
| HUDHUD Maps | `osiris-map/` | Next.js + MapLibre | npm |
| HUDHUD News | `neureed/` | Next.js + next-auth v5 + Prisma 7 | npm |
| HUDHUD Verify | `loki-verify/` | Python/Flask (Poetry) | Poetry |
| HUDHUD Identity | `zexa-auth/` v2.0.0 | Next.js + Better Auth + Drizzle | pnpm |
| HUDHUD Connect | `nchat/` | pnpm monorepo + Hasura | pnpm |
| HUDHUD Community | `rhex-forum/` v1.1.0 | Next.js + Prisma 6 + WebAuthn | pnpm |
| HUDHUD Analytics | `umami/` | Next.js + Prisma 7 (upstream) | pnpm |

## 3. الفروع

| الفرع | الملاحظة |
|---|---|
| `master` | رأس العمل — لا كتابة مباشرة |
| `feature/hudhud-completion-baseline` | المرحلتان A+B — PR #12 |
| `feature/hudhud-integration-phase-c` | المرحلة C — PR #13 (قاعدته B) |
| `feature/hudhud-i18n-phase-d` | المرحلة D — PR #14 (قاعدته C) |
| `feature/hudhud-ai-phase-e` | المرحلة E — PR #15 (قاعدته D) |
| `feature/hudhud-security-phase-f` | **فرع العمل الحالي** — المرحلة F (قاعدته E) |
| 11 فرع audit مدموجة + 4 قديمة خالية | لا حذف — موثقة |

## 4. عقود الصحة (كما بعد المرحلة C)

| التطبيق | المسار | الحالة |
|---|---|---|
| osiris-map / zexa-auth / nchat / rhex-forum | `/api/health` | liveness |
| neureed | `/api/health` | يفحص DB فعليًا |
| loki-verify | `/api/health` | readiness.level صادق (M-03) |
| umami | `/api/heartbeat` | كما هي |
| portal | `/api/health` | عامة عن قصد موثق |

## 5. مصفوفة المشكلات (السجل المركزي)

الحالة: `OPEN` / `IN_PROGRESS` / `FIXED_UNVERIFIED` / `FIXED_VERIFIED` / `NEEDS_APPROVAL` / `BLOCKED`

> كل إصلاحات المراحل B–F كُتبت ككود دون تشغيل (C-03) — `FIXED_UNVERIFIED` حتى إثبات تشغيلي.

| ID | التطبيق | الخطورة | المشكلة | الحل | الحالة |
|---|---|---|---|---|---|
| C-01 | loki-verify | CRITICAL | تخزين مشترك + سباق كتابة | result_store.py معزول + 503 صادق | FIXED_UNVERIFIED |
| C-02 | zexa-auth | CRITICAL | مسار admin بلا فحص داخلي | 401/403 fail-closed | FIXED_UNVERIFIED |
| C-03 | المنظومة | CRITICAL | لا بيئة تشغيل/CI | توكن بلا نطاق workflow — تدخل المشغّل | BLOCKED |
| E-01 | المنظومة | HIGH | لا سجل AI ولا سياسة مزودين | سجل من جرد فعلي + حظر Meta + شاشة /providers/ai + اختبارات | FIXED_UNVERIFIED |
| E-02 | nchat | CRITICAL (أمني) | مفاتيح AI قابلة للكشف في المتصفح | key-policy.ts خادمي + اختبارات؛ **ترقيع 6 ملفات داخليًا BLOCKED على بيئة تشغيل** | PARTIAL |
| **F-01** | المنظومة | HIGH | أداة الفحص الأمني تغطي portal فقط | **المرحلة F:** توسيع لكل التطبيقات الثمانية + قواعد جديدة (مفاتيح AI في المتصفح، مؤشر SSRF، عناوين مضمنة) + فحص .env في كل تطبيق + استثناءات موثقة (قوالب/اختبارات) + اختبار قواعد | FIXED_UNVERIFIED |
| **F-02** | المنظومة | HIGH | لا تدقيق OWASP موثق عبر الشيفرة | **المرحلة F:** OWASP-AUDIT.md — مصفوفة كاملة لكل تطبيق من جرد فعلي، مع فجوات صادقة (A06/A08 تحتاج CI؛ rhex analytics HTML معلّم بمستند؛ loki debug محلي يوثق للنشر عبر gunicorn) | DOCUMENTED (تقييم مكتمل) |
| H-01 | المنظومة | HIGH | عناوين تشغيل غير مضبوطة | نظام عناوين مركزي (C) | FIXED_UNVERIFIED |
| H-02 | المنظومة | HIGH | لا SSO موثق | تدقيق OIDC (C) — تفعيل بانتظار موافقة | NEEDS APPROVAL |
| H-03 | loki-verify | HIGH | بلا مصادقة — استهلاك مجاني | 3 خيارات معمارية (C)؛ OIDC موصى به | NEEDS APPROVAL |
| H-04 | zexa-auth | HIGH | جداول OIDC غائبة | ترحيل 0002 CREATE-only | FIXED_UNVERIFIED |
| H-05 | المنظومة | HIGH | تعريب غائب | قاموس + zexa كاملة + قوالب loki (D)؛ تعميم تدريجي | PARTIAL |
| H-06 | nchat | HIGH | شاشات تجريبية مكشوفة | DEV_ONLY_ROUTES موسعة | FIXED_UNVERIFIED |
| H-07 | المنظومة | HIGH | قواعد معزولة غير منفذة | موارد إنتاج — مرحلة G | NEEDS APPROVAL |
| M-01 | rhex-forum | MEDIUM | ازدواج lockfiles | pnpm رسمي؛ npm lock في gitignore دون حذف | FIXED_UNVERIFIED |
| M-02 | zexa-auth | MEDIUM | لوحة إدارة فارغة | overview + settings + API fail-closed | FIXED_UNVERIFIED |
| M-03 | loki-verify | MEDIUM | عقد صحة غير صادق | readiness.level | FIXED_UNVERIFIED |
| M-04 | المنظومة | MEDIUM | لا زر عودة موحد | ControlReturnLink في zexا (معرب D)؛ تعميم تدريجي | PARTIAL |
| M-06 | osiris-map | MEDIUM | /cutout بلا عودة | ترويسة عائمة | FIXED_UNVERIFIED |
| M-08 | المنظومة | MEDIUM | حالات خماسية | نموذج M-08 كامل (C) | FIXED_UNVERIFIED |
| **F-03** | rhex-forum | LOW | dangerouslySetInnerHTML في site-analytics | كود أصلي يوثق أنه قدرة مشرف موثوقة بلا مدخلات مستخدمين — معلّم الآن في OWASP-AUDIT وسيُعلّم تلقائيًا بأداة F-01 للمراجعة الدورية؛ لا تعديل (إضافة فقط) | DOCUMENTED (مقبول بمستند) |
| L-01 | osiris-map | LOW | مجلدات scratch | مرحلة لاحقة | OPEN |
| L-02 | المنظومة | LOW | لا Tags/Releases | مرحلة G | OPEN |
| L-03 | المنظومة | LOW | فروع قديمة | لا حذف دون موافقة | OPEN |

## 6. إعادة تحقق (تراكمي)

كما في المراحل السابقة + إضافة المرحلة F:
- أداة الفحص الأمني كانت portal-only — ثبت بالجرد؛ توسعت لكل التطبيقات.
- rhex site-analytics يستخدم dangerouslySetInnerHTML بتعليق توثيقي أصلي — يبقى معلّمًا للمراجعة الدورية، لا يُعدّل.

## 7. خطة التنفيذ المرحلية (A→G)

### المرحلة A ✅ + B ✅ + C ✅ + D ✅ + E ✅ (كود — FIXED_UNVERIFIED)
كما وثق في الإصدارات السابقة. نقاط الموافقة المفتوحة: OIDC staging (H-02)، مصادقة loki (H-03)، قواعد معزولة (H-07).

### المرحلة F — الأمن والجودة ✅ منجزة (كود + توثيق)
- [x] F-01 توسيع security-audit.ts لكل التطبيقات الثمانية + قواعد E-02/SSRF/عناوين مضمنة + استثناءات موثقة + اختبار قواعد
- [x] F-02 وثيقة OWASP-AUDIT.md — مصفوفة شاملة من جرد فعلي بفجوات صادقة
- [x] F-03 توثيق حالة rhex analytics HTML (قبول بمستند، بلا تعديل)
- [ ] تشغيل الفحص فعليًا — BLOCKED (C-03)

### المرحلة G — تجهيز الإنتاج
Staging + اختبارات فعلية (تشغيل كل اختبارات B–F) + Backup/Restore مختبر + توثيق نهائي → **نقطة موافقة للنشر**

## 8. القيود الثابتة

1. لا دمج في `master` دون موافقة صريحة.
2. لا حذف شاشة/وظيفة أصلية — إضافات فقط.
3. لا migrations مدمرة — CREATE-only.
4. ZERO-COST — لا مفاتيح تُفعَّل؛ Meta AI محظور.
5. لا ادعاء نجاح دون دليل تشغيل.
6. لا أسرار في المستودع/السجلات/الواجهات — مفاتيح AI لا تمر للمتصفح (E-02).

## 9. فجوات التحقق المفتوحة (صادقة)

- إصلاحات المراحل B–F: **NOT RUN** (C-03).
- E-02 الترقيع الداخلي للملفات الستة: BLOCKED على بيئة سحب — تحذير التسريب قائم حتى إتمامه.
- OWASP A06/A08 (اعتماديات/سلامة): تتطلب CI (npm audit + frozen lockfiles).
- loki debug=True في التشغيل المحلي: يوثق للنشر عبر gunicorn بلا debug (G).
- ترحيل OIDC snapshot: يُولَّد محليًا.
- خط IBM Plex Sans Arabic: يحتاج self-hosting للنشر بلا إنترنت (G).

---

*ملف حي. المرحلة F موثقة في git log للفرع `feature/hudhud-security-phase-f` (4 التزامات).*
