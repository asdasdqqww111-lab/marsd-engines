# HUDHUD — وثيقة المعمارية

الحالة: **مسودة نشطة** — تُحدَّث مع كل مرحلة تنفيذ.
آخر تحديث: 2026-11-15 (المرحلة 1: بوابة CONTROL الأساس + نظام التصميم المشترك).

## 1. الوضع الراهن (مُتحقَّق من المستودع)

المستودع مونوريبو يحوي 7 مشاريع مستقلة على فرع `master`:

| المشروع | اسم HUDHUD | التقنية | البنية التحتية الخاصة |
|---|---|---|---|
| osiris-map | HUDHUD Maps | Next.js 16 + React 19 + MapLibre + Three.js | لا قاعدة بيانات؛ مفاتيح اختيارية، فشل آمن (503) |
| neureed | HUDHUD News | Next.js 16 + next-auth v5 + Prisma 7 | PostgreSQL + Redis + node-cron |
| loki-verify | HUDHUD Verify | Python/Flask (OpenFactVerification) على منفذ 2024 | LLM + retriever خارجي، لا PostgreSQL |
| zexa-auth | HUDHUD Identity | Next.js 16 + Better Auth + Drizzle | PostgreSQL |
| nchat | HUDHUD Connect | pnpm monorepo + Hasura v2.44 + nhost-auth | PostgreSQL 16 + Redis + MinIO + Meilisearch + Mailpit + Nginx + LiveKit |
| rhex-forum | HUDHUD Community | Next.js 16 + Prisma 6 + worker + WebAuthn | PostgreSQL 18 + Redis + S3 |
| umami | HUDHUD Analytics | Next.js 16 + Prisma 7 + OpenAPI مولّد | PostgreSQL + ClickHouse اختياري + Kafka اختياري |

## 2. المعمارية المستهدفة

- **بوابة `portal/` (HUDHUD CONTROL)**: Next.js 16، قاعدة مستقلة `hudhud_core`. لا iframes — تنقل مباشر. تعمل كمراقِب لا كاعتماد تشغيلي؛ تعطُّل البوابة لا يؤثر على التطبيقات.
- **عزل قواعد البيانات**: قاعدة لكل تطبيق (`hudhud_osiris`، `hudhud_neureed`، `hudhud_loki_verify`، `hudhud_zexa_auth`، `hudhud_nchat`، `hudhud_rhex_forum`، `hudhud_umami`) + `hudhud_core`. أدوار وبيانات اعتماد منفصلة لكل تطبيق، TLS، pooling.
- **الخدمات المحفوظة**: Redis، MinIO، Meilisearch، ClickHouse، Hasura، LiveKit، Mailpit — تُبقى كما هي، وPostgreSQL لا يستبدل أيًا منها.
- **التكامل**: عقود APIs موثقة + مصادقة + تحقق مدخلات + حدود معدل + مهل زمنية، لا وصول مباشر بين قواعد بيانات التطبيقات.
- **الهوية البصرية**: نظام تصميم مشترك في `shared/design-system/` (tokens CSS) تستهلكه التطبيقات دون إجبارها على إطار واحد أو تغيير معرفاتها التقنية.

## 3. الهوية البصرية

- الخلفية `#0C0E12`، السطوح `#16181D`، التمييز `#F5A623`.
- خط: IBM Plex Sans Arabic؛ دعم RTL كامل؛ تصميم mobile-first.
- التوكنز في `shared/design-system/hudhud-tokens.css` + شرح الاستهلاك في `README.md`.

## 4. قائمة التنفيذ (محدثة مع كل مرحلة)

- [x] تدقيق أولي للمستودع (قراءة فقط).
- [x] المرحلة 1: فرع عمل + أساس بوابة CONTROL + نظام التصميم المشترك + وثائق معمارية.
- [ ] المرحلة 2: صفحات البوابة (سجل التطبيقات، لوحة القيادة، الأحداث، الإعدادات) + APIs مؤمّنة.
- [ ] المرحلة 3: تطبيق الهوية على التطبيقات السبعة (ملفات tokens + هوية الرؤوس/الأيقونات) دون تغيير المعرفات التقنية.
- [ ] المرحلة 4: بنية PostgreSQL HA وقواعد `hudhud_*` (مع خطة نسخ احتياطي واستعادة موثقة ومُختبَرة).
- [ ] المرحلة 5: تقييم Zexa/Better Auth كمصدر هوية مركزي (لا SSO قبل إثبات التوافق).
- [ ] المرحلة 6: CI موحد + اختبارات + فحص أسرار.

## 5. القرارات والمخاطر

- تعدد التقنيات حقيقي (Flask/Python في loki-verify): الهوية عبر tokens CSS وليس عبر توحيد الأطر.
- إصدارات Prisma مختلفة (6/7): لا دمج schemas؛ كل تطبيق يبقى مستقلًا.
- لا بوابة موجودة مسبقًا؛ البوابة الجديدة لا تمس أي ملف قائم.
- لا SSO قبل فحص شامل لمسارات Better Auth (OIDC/issuer/JWKS/callbacks) — حاليًا تحفظ المصادقات الأصلية.
