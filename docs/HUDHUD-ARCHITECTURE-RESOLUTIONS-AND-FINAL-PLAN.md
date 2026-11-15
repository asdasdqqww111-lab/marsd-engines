# HUDHUD — تحديث التدقيق: حل القرارات المعمارية + الخطة الرئيسية النهائية

**الفرع:** `audit/hudhud-full-audit-2026-11-15` · **التاريخ:** 2026-11-15 · **طبيعة الملف:** توثيق فقط (تحديث لنتائج التدقيق، لا كود)

هذا الملحق يكمل تقرير `docs/HUDHUD-FULL-AUDIT-2026-11-15.md` ويحسم القرارات المعمارية بأدلة جديدة (قراءة كود فعلية + تحقق خارجي من وثائق المكونات الرسمية).

---

## 1. تصحيح دقة الأعداد (التزامًا بمطلب الدقة #9)

- **feature/hudhud-portal: 3 التزامات تنفيذية** فوق master: `e4b7635` (أساس + توكنز + وثائق)، `5fd9852` (سجل تطبيقات + فحص صحة)، `6e50b10` (لوحة RTL + إصلاح package.json). التزام البوابة على فرع التدقيق `976ea79` يخص التقرير الأول فقط. سابقًا أُشير خطأً إلى «4 التزامات» — التصحيح أعلاه هو المرجع.

## 2. قرار قاعدة البيانات (محسوم بأدلة)

**التوصية النهائية: مجموعة PostgreSQL HA واحدة على PG 16 (آخر تصحيح)، مع قواعد منفصلة وأدوار منفصلة لكل تطبيق + hudhud_core للبوابة.**

الأدلة:

1. **Hasura v2.44 (nchat):** وثائق Hasura الرسمية: «supports all supported versions of Postgres per the public documentation» — أي كل إصدار PG مدعوم رسميًا؛ وتشير ملاحظات إصدار Hasura v2.51.6 (2026-11-11) إلى مشكلة معروفة في logical replication catalog على PG 16.11+ و17.7+ و18.0+ تُصلح بإصدار Hasura محدث أو SQL بديل موثق (`ALTER TABLE hdb_catalog.hdb_source_catalog_version REPLICA IDENTITY FULL`). **الخلاصة: PG16 مع Hasura v2.44 آمن؛ الترقية لPG17/18 تتطلب ترقية Hasura أولًا.**
2. **pgvector (neureed):** دعم PG18 بدأ من pgvector **0.8.1** (0.8.0 لا يدعمه)؛ وخط 0.8 (0.8.7 حاليًا) يدعم PG13+. المطلوب: تثبيت pgvector ≥ 0.8.1 على PG16 (مثبت افتراضيًا في 0.8.7).
3. **Prisma:** rhex على Prisma 6.19 — وثائق Prisma تدعم PG 13+ في الإصدار 6 (رسميًا حتى PG16/17 وفق مصفوفة الدعم)، وPrisma 7 (neureed/umami) يدعم PG 18 عبر driver adapters. قرار rhex على PG16 آمن؛ وإبقاؤه على PG18 يتطلب مجموعة ثانية.
4. **تعارض نطاقات 172:** في neureed `isSafeFeedUrl` يرفض أي `172.*` — خطأ فحص زائد (172.1–172.31 فقط خاصة). انظر القسم 5.
5. **التكلفة:** مجموعة HA واحدة أرخص من مجموعتين (نسخة احتياطية واحدة، نسخ WAL واحد، مراقبة واحدة، فشل آمن واحد). مجموعة ثانية لا تُبرر إلا بعزل فشل منفصل — غير مطلوب هنا لأن الأدوار والقواعد منفصلة تمنع الوصول المتبادل.

**خطة الترحيل (غير هدّامة):** لكل قاعدة: جرد → `pg_dump -Fc` موثق → تحقق سلامة → استعادة اختبارية معزولة → مقارنة صفوف/علاقات → نافذة صيانة → إنشاء قاعدة hudhud_* + دور خاص → استعادة → تحديث connection string → اختبارات دخان → الاحتفاظ بالقاعدة الأصلية قراءةً (لا حذف) → فترة استعادة موثقة. rhex ينتقل من PG18 إلى PG16 عبر dump/restore (توافق binary معاكس الاتجاه ممنوع — dump/restore آمن).

## 3. قرار المصادقة (محسوم بأدلة)

**التوصية النهائية: مُزوّد OIDC قائم على Better Auth داخل zexa-auth، بترحيل مرحلي «ربط مُدار» يُبقي كل مصادقة محلية تعمل.**

الأدلة الجديدة:

1. **nchat يملك بالفعل بنية SSO كاملة موثقة:** ترحيل `20260207_sso_tables.sql` ينشئ `nchat_sso_connections` (بروتوكول `saml` **أو `oidc`** — config JSONB بissuer/clientId/clientSecret/authorizationUrl/tokenUrl/userInfoUrl)، وجلسات SSO، وسجل تدقيق SSO، وربط نطاقات بريد، وذاكرة metadata — **مع RLS كاملة وقواعد owner/admin**. أي أن nchat **مستعد بنيويًا لاستقبال IdP خارجي عبر OIDC دون أي تعديل جوهري**.
2. **nchat يملك RBAC لكل تطبيق جاهزًا:** ترحيل `20260212_add_per_app_rbac.sql` ينشئ `apps` (سجل تطبيقات مشتركة)، `app_user_roles` (دور المستخدم لكل تطبيق مع انتهاء صلاحية)، `app_role_permissions` (صلاحيات دقيقة)، ودوال `user_has_app_role`/`user_has_app_permission` مع RLS — **نموذج جاهز لمنظومة HUDHUD متعددة التطبيقات ويمكن استلهامه للبوابة.**
3. **Better Auth oidcProvider plugin (وثائق رسمية):** يوفر تسجيل عملاء + تسجيل ديناميكي + Authorization Code Flow + عملاء عامين (PKCE) + JWKS (يتطلب jwt plugin، وموثق بأنه «not fully implemented» في أجزاء) + refresh tokens + شاشة consent + UserInfo. **تنبيه رسمي: الإضافة «in active development and may not be suitable for production use» وستُستبدل بـ OAuth Provider Plugin** — لذا الخطة تعتمد الاستقرار أولًا: تجميد إصدار Better Auth، اختبار الإضافة في staging، وتقييم OAuth Provider Plugin الأحدث كبديل.
4. **umami:** لا يوجد دعم OIDC رسمي في v3 (issue #3163): آلية `/sso?url&token` عبر `createSecureToken` هي الموجودة (تُستخدم في Cloud)، ودمج OIDC شامل عبر next-auth في انتظار PRs مفتوحة. **قرار umami: تكامل عبر `/sso` token موقّع من البوابة (خفيف وموثق) بدل تعديل طبقة مصادقة umami** — يحفظ استقلاله.
5. **neureed:** next-auth v5 يدعم مزود OIDC عام عبر متغيرات البيئة (OAUTH_CLIENT_ID/SECRET/AUTHORIZATION_URL/TOKEN_URL/USERINFO_URL/ISSUER) — **البنية جاهزة في الكود كما قرأنا** (`src/lib/auth.ts` يبني مزودًا عامًا ديناميكيًا). التكامل يحتاج فقط إنشاء تطبيق OAuth في zexa وضبط متغيرات البيئة.
6. **rhex:** arctic يدعم OIDC؛ لكن rhex يملك OAuth Authorization Server خاصًا (ترحيل `20260615160000_oauth_authorization_server`) — يمكن أن يكون مستهلكًا أو مزودًا — يحتاج تصميمًا دقيقًا؛ المرحلة تُبقي مصادقته المحلية وتضيف IdP كبديل.
7. **zexa نفسه:** proxy.ts يحمي كل المسارات غير العامة بجلسة cookie — إطار RBAC جاهز (admin plugin، roles user/admin، ban/impersonation). المطلوب للتطوير: OIDC provider plugin + jwt plugin (لJWKS) + endpoints discovery — كلها إضافات Better Auth معروفة، بلا إعادة كتابة.

**التسلسل المقترح للهوية:**

- المرحلة أ: إبقاء المصادقات المحلية تعمل + إنشاء OIDC provider في zexa (staging) + اختبار PKCE/JWKS/token/revocation.
- المرحلة ب: ربط مُدار (nchat عبر جداول SSO الجاهزة، neureed عبر مزود OAuth العام الموجود، rhex عبر arctic، umami عبر /sso token، البوابة عبر Better Auth client).
- المرحلة ج: مزامنة الأدوار عبر نموذج per-app RBAC (استلهام جداول nchat) في hudhud_core مع إبقاء أدوار كل تطبيق مصونة.
- **الشرط الصارم: تعطل IdP يجب ألا يعطل الدخول المحلي في أي تطبيق (فشل لطيف مُختبر).**

## 4. قرار البنية التحتية والتراخيص

1. **LiveKit:** الخادم مفتوح المصدر **Apache 2.0** — الاستضافة الذاتية مجانية بلا رسوم؛ المدفوع فقط هو LiveKit Cloud المُدار (خدمة SAAS اختيارية) أو Egress/Ingress/SIP المتقدمة كخدمات مُدارة. **القرار: يمكن تفعيل مكالمات nchat عبر LiveKit مستضاف ذاتيًا بلا تكلفة ترخيص — لا حاجة لتعطيل الوظيفة.**
2. **nself plugins (chat core مجاني):** `livekit/recording/moderation/bots/realtime/auth` تتطلب رخصة nself Basic (موثق في .env.dev: 0.99$/شهر أو 9.99$/سنة). **القرار: الرخصة اختيارية للمستخدم — الوظائف الأساسية (قنوات/رسائل/بحث/ترجمة/webhooks/audit) تعمل بدونها.** البنية المقترحة تشغّل LiveKit ذاتيًا (Apache 2.0) وتُبقي إضافات nself معطلة حتى قرار المستخدم.
3. **rhex مدفوعات (Alipay/Alicloud/Tencentcloud):** الكود كامل ومحفوظ ولا يُعطَّل — المطلوب فقط **تقرير امتثال قبل التفعيل الإنتاجي** (متطلبات رخصة الدفع/مزود الخدمة/السوق المستهدف). التوصية: إبقاؤها متاحة ككود مع تفعيل تدريجي حسب السوق، دون حذف أي SDK أو مسار.
4. **umami compose يُظهر PG15-alpine** كقاعدة افتراضية (أدنى من 16!) — عند الترحيل إلى hudhud_umami على PG16، التحقق من توافق ترحيلات umami 26 على PG16 (غالبًا آمنة لأنها SQL قياسي).
5. **PostgreSQL مُدار HA:** الخيار الأنظف (مثل RDS/Cloud SQL/Neon/Supabase) يوفر failover وPITR تلقائيًا — **لكنه قرار استضافة/ميزانية للمستخدم**. البديل self-host: Patroni + PgBouncer + pgBackRest/WAL-G على 3 عقد. كلاهما مدعوم بالخطة؛ الخيار المُدار موصى به لتقليل العبء التشغيلي.

## 5. تحديث نتائج الأمان (حسم نقاط مفتوحة)

| # | الحسم | الدليل/الملاحظة |
|---|---|---|
| S1 (env.dev) | **قيم dev افتراضية placeholders — لا أسرار إنتاج.** التاريخ: كلها في التزام التهيئة الوحيد، لا تعرض لقيم لاحقة. **التدوير غير مطلوب لذاته**، لكن النمط خطر ويجب تصحيحه: تحويل القيم لـ .env.example فارغة + تفعيل push protection/secret scanning. لو استُخدمت ذات القيم في أي نشر خارجي فيجب تدويرها فورًا (احتمال خارجي، غير مُثبت). |
| S3 (proxy neureed) | **محسوم من الكود:** حماية موجودة (localhost/127.0.0.1/::1/192.168./169.254. محجوبة + requireAuth) لكن (أ) `redirect: follow` يتبع تحويلات تلقائيًا بلا إعادة فحص، (ب) لا فحص DNS rebinding (اسم عام يحل لعنوان خاص)، (ج) `startsWith("172.")` يحجب نطاقات 172 عامة حقيقية — عيب وظيفي. **التوصية: تبنّي safeFetch/validateHost من osiris-map (موجود في المستودع) — تحسين وليس إصلاح ثغرة حرجة.** |
| S6 (portal) | مؤكد: بلا dependencies/auth/CSP/rate-limit — أسباب عدم البناء حرفية: package.json يحوي scripts فقط. الإصلاح موصوف في المرحلة 1. |
| S4 (loki) | مؤكد: debug=True + ملف حالة + بلا rate limit. المسار: gunicorn + تخزين مُدار + أسرار مُدارة. |
| S10 (Hasura CORS) | wildcard في dev فقط (.env.dev). الإنتاج يتطلب ضبطه على نطاقات HUDHUD. |
| Portal SSRF | فحص الصحة الحالي يقيد البروتوكول ومهلة 5ث وmanual redirect — **لا يفحص DNS rebinding لعناوين مستهدفة من env vars**. بما أن المصدر متغيرات بيئة يتحكم بها المشغل، الخطر منخفض؛ يُحسَّن بمصادقة إدارية + إخفاء العناوين الداخلية عن client (كلها في المرحلة 1). |
| rhex TS | ignoreBuildErrors=true مؤكد — يُزال بعد إصلاح أخطاء TS + بوابة CI. |
| Hasura/PG16 | آمن (قسم 2). ترقية PG ل17/18 تتطلب ترقية Hasura أولًا (ملاحظات v2.51.6). |

## 6. جرد التطبيقات — إضافات مُثبتة

- **osiris-map:** 52 مكونًا في src/components (بينها OsirisMap.tsx 197KB وOsintPanel 99KB وLiveAlerts 64KB) + ~120 ملفًا في src/lib (بينها ssrf-guard قوي 12.7KB وstealthFetch وtransit-routes مولّد 1.3MB) + ~48 مسار API + middleware مع اختبار. **اختبارات موحدة موجودة فعليًا** (عشرات ملفات .test.ts).
- **neureed:** 41 ترحيلًا Prisma مؤرخًا (0_init حتى 20251201183639) — تاريخ تطوير موثق؛ 9 مجموعات API؛ طبقة api-handler موحدة مع zod + RBAC (requireAdmin/requireUserOrAbove)؛ مزود OAuth عام ديناميكي جاهز لIdP مركزي؛ مكتبة SSRF بدائية (localhost/127/192.168/169.254/172.*) بلا DNS resolution.

### 6.1 نماذج الأمان المكتشفة (جديدة)

- **neureed admin:** حماية إدارية عبر requireAdmin في api-handler (401/403) — جيد.
- **nchat RLS:** جداول SSO/RBAC مفعّل عليها RLS بقواعد owner/admin — نموذج أمني ممتاز يمكن استلهامه للبوابة.
- **nchat build gate:** next.config.js يرفض البناء الإنتاجي بلا HASURA_ADMIN_SECRET — بوابة أمنية جيدة.
- **umami Dockerfile:** Node 22.23-alpine + pnpm 12.3.4 + Prisma 7.10 — متطلبات بناء موثقة.

## 7. التحقق من البوابة الحالية (مطلب #7)

**ملفات portal/ الملتزمة (الفرع feature/hudhud-portal):**

- `portal/package.json` — **بلا أي dependencies**: السبب الحرفي لفشل البناء. scripts: dev/build/start/lint/test مع "next" غير مثبت.
- `portal/next.config.ts` — minimal (reactStrictMode) — سليم لكن بلا CSP/headers.
- `portal/tsconfig.json` — سليم (strict، paths @/*) لكن لا يوجد eslint.config ولا vitest.config ولا .gitignore للبوابة.
- `portal/src/lib/registry.ts` — سجل 7 تطبيقات دقيق (أسماء HUDHUD + معرفات تقنية أصلية + healthPath + usesPostgres) — **صحيح ودقيق**.
- `portal/src/lib/health.ts` — فحص صحة مع مهلة 5ث + تقييد بروتوكول + redirect manual — **سليم كمراقب** لكنه يفحص من client-side fetch في صفحة server component (يفقد عناوين داخلية) ولا يحتوي DNS pinning.
- `portal/src/app/layout.tsx` — يستورد `../../shared/design-system/hudhud-tokens.css` — **مسار خارج جذر البوابة**: يعمل في نسخة repo واحد فقط؛ عند النشر المستقل يتطلب حزمة أو نسخ الملف.
- `portal/src/app/page.tsx` — لوحة RTL تعرض الحالات الحقيقية مع تمييز unknown — سليمة الوظيفة لكن بلا مصادقة.
- `portal/README.md` + `ARCHITECTURE.md` + `IMPLEMENTATION-CHECKLIST.md` — توثيق جيد.
- **نقص إضافي مكتشف:** لا .env.example للبوابة (متغيرات HUDHUD_APP_*_URL غير موثقة في ملف قالب)، لا Dockerfile، لا CI.

**متطلبات الإصلاح (المرحلة 1، غير منفذة):** dependencies كاملة (next/react/eslint/vitest) + Better Auth إدارية + CSP/headers + rate limit + قاعدة hudhud_core (Drizzle) + سجل أحداث + إخفاء العناوين الداخلية عن client + حزمة @hudhud/design لحل مسار الاستيراد + .env.example + Dockerfile.

## 8. توافق نظام التصميم المشترك مع التطبيقات السبعة

- **osiris-map:** لديه style-tokens.ts خاص (18.7KB) — دمج توكنز HUDHUD يتطلب توفيقًا مع نظام طبقات الخريطة (لا استبدال). Tailwind 4 postcss — استهلاك CSS vars بسيط.
- **neureed:** globals.css قياسي + Tailwind 4 — استهلاك مباشر.
- **loki-verify:** قوالب Jinja2 HTML — استهلاك عبر وسوم <link>/متغيرات CSS، لا حزم Node. متوافق كليًا.
- **zexa-auth:** globals.css + Tailwind 4 — استهلاك مباشر.
- **nchat:** tailwind.config.ts (7.6KB) + next.config.js مع CSP تسمح fonts.googleapis/gstatic — **تداخل**: يجب تحديث CSP عند استضافة الخط ذاتيًا أو إبقاء Google Fonts (أسهل، مع تعديل font-src). متوافق.
- **rhex-forum:** tailwind.config.ts (7.6KB) + globals.css 44.6KB — استهلاك مباشر؛ انتبه لتعارض أسماء المتغيرات مع النظام الحالي.
- **umami:** global.css صغير (2.6KB) + next-intl + chart.js — استهلاك مباشر؛ لوحات الرسوم تحافظ على تخطيطها.

**الخلاصة:** التوكنز CSS الخالصة متوافقة مع كل التطبيقات؛ نقطة العمل الوحيدة هي تحديث CSP لكل تطبيق عند استضافة الخطوط ذاتيًا (متغير --hudhud-font) وعدم فرض مكونات React على تطبيقات غير React (loki قوالب Jinja2).
/font
/font

## 9. الخطة الرئيسية النهائية (نسخة محسومة)

| # | المرحلة | الحالة | التقدير | ملاحظات محسومة |
|---|---|---|---|---|
| 0 | التدقيق والخط الأساس | ✅ منجز | — | هذا التقرير + الملحق |
| 1 | إصلاح بوابة CONTROL | معتمدة تقنيًا، غير منفذة | 2-3 أيام | كل نقاط القسم 7 |
| 2 | حزمة @hudhud/design + علامة موحدة | مخططة | 5-8 أيام | CSP خطوط لكل تطبيق؛ لا فرض مكونات على loki |
| 3 | عقود صحة موحدة + مسارات مفقودة (rhex/loki/zexa) | مخططة | 2-3 أيام | عقد موحد: status/scope/checks/version/timestamp |
| 4 | OIDC عبر zexa (ربط مُدار، فشل لطيف) | مخططة | 5-8 أيام | جداول nchat SSO جاهزة؛ neureed مزود عام جاهز؛ umami عبر /sso token |
| 5 | PG16 HA + قواعد hudhud_* + ترحيل غير هدّام | مخططة | 6-10 أيام | rhex: PG18→16 عبر dump/restore؛ umami: PG15→16؛ Hasura عبر PgBouncer transaction-mode |
| 6 | أمان (S1-S10 كاملة) | مخططة | 4-6 أيام | تصحيح env.dev كنمط؛ تبنّي ssrf-guard في neureed؛ رفع CSP rhex |
| 7 | مراقبة (OTel + Prometheus/Grafana + تدقيق موحد) | مخططة | 5-8 أيام | استنساخ أنماط nchat metrics/audit |
| 8 | CI/CD مركزي (workflows جذر) | مخططة | 3-5 أيام | استنساخ أنماط nchat .github (47 workflow) كنقطة انطلاق |
/ |
| 9 | القبول النهائي (staging → production) | مخططة | 3-5 أيام | معايير القبول في التقرير الأول §16 |

**إجمالي التقدير:** 35-55 يوم عمل (فريق فردي متسلسل) — قابل للتقسيم على مسارات متوازية بعد المرحلة 2.

**التوقفات المطلوبة (تعطيل/حذف/ترحيل هدّام/إنتاج):** نهاية المرحلة 1 (مراجعة بوابة)، بداية المرحلة 4 (سياسة IdP)، بداية المرحلة 5 (نافذة ترحيل)، بداية المرحلة 9 (تشغيل إنتاج).

## 10. الموارد الخارجية المطلوبة من المستخدم (قائمة كاملة)

| المورد | الغرض | البديل/الملاحظة |
|---|---|---|
| استضافة (VM/s سحابية أو Kubernetes) | تشغيل المنظومة + HA PG (إن لم تكن مُدارة) | الحد الأدنى: 2 عقد (app + db replica)؛ الأمثل: 3 عقد + نسخ احتياطي خارجي |
| PostgreSQL مُدار HA أو موافقة على self-host (Patroni+PgBouncer+pgBackRest) | قاعدة hudhud_* | مُدار موصى به؛ self-host يعمل لكن يضيف عبئًا تشغيليًا |
| نطاق HUDHUD + DNS + شهادات TLS (مثل *.hudhud.example) | إنتاج | مطلوب لSSO عبر النطاقات وتوجيه التطبيقات |
| Google/GitHub OAuth apps (client id/secret) | zexa + neureed تسجيل دخول اجتماعي | إنشاء مجاني عبر مزودي الهوية |
| Resend API key (أو SMTP) | بريد التحقق zexa + بريد rhex/nchat | بدون بريد: التسجيل بالتحقق معطل |
| مفاتيح LLM (OpenAI/Anthropic + Serper) | loki-verify تشغيل فعلي | بدائل: أي مزود متوافق من api_config.yaml |
| Gemini/Shodan/CF/transit keys (اختيارية) | osiris طبقات متقدمة | التطبيق يعمل بدونها (فشل آمن 503) |
| رخصة nself Basic (اختيارية 0.99$/شهر) | إضافات nchat المتقدمة (recording/bots/SSO enforce) | غير مطلوبة للوظائف الأساسية؛ LiveKit ذاتي مجاني (Apache 2.0) |
| أسرار إنتاج (كلمات مرور قواعد، JWT keys، MinIO roots) | نشر | تُولّد جديدة عند النشر — لا تُلتزم في Git أبدًا |
| GitHub secrets للCI | تشغيل CI/CD | تُضبط عند تفعيل المرحلة 8 |

## 11. الحدود المتبقية (شفافية كاملة)

- لم يُشغَّل أي build/test/lint — الحالة UNKNOWN لكل بناء. CI المرحلة 8 هو آلية الإثبات.
- التدقيق قرأ الأصول الجوهرية (configs، schemas، migrations، حُماة أمنية، auth stacks، compose، Dockerfiles، CI، نقاط دخول، مكونات نموذجية) — وليس كل ملف من آلاف الملفات. SAST/dependency-audit آلي موصى به في CI (gitleaks/codeql/dependency-review موجودة كقوالب جاهزة في nchat/.github).
- لا يمكن التحقق من إعدادات النطاقات/DNS/الاستضافة/شهادات من داخل المستودع.

## 12. حدود التنفيذ الحالية (التزامًا بالتوجيه)

- لم يُنشأ أي فرع تنفيذي جديد، ولا التزام كود، ولا دمج، ولا PR، ولا تعديل على التطبيقات السبعة أو البوابة.
- هذا الملف توثيقي فقط على فرع التدقيق المسموح بتحديثه.

**نهاية الملحق — بانتظار الموافقة الصريحة الواحدة على برنامج التنفيذ.**
