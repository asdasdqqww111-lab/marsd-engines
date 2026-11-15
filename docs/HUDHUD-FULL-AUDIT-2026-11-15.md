# HUDHUD — تقرير التدقيق الشامل وتقييم الجاهزية للإنتاج

**الفرع:** `audit/hudhud-full-audit-2026-11-15` (توثيق فقط)
**التاريخ:** 2026-11-15 · **المنهجية:** فحص فعلي للملفات عبر GitHub API (قراءة فقط — لم يُشغَّل كود أو بناء أو اختبار)

---

## 1. الملخص التنفيذي

المستودع مونوريبو خاص (فرع `master`، التزام واحد `4f60e63` بتاريخ 2026-11-07) يضم سبعة تطبيقات مستقلة حقيقية بتقنيات متباينة، وبنية تحتية ثقيلة. يوجد فرع تطوير `feature/hudhud-portal` بثلاثة التزامات (بوابة CONTROL أولية + نظام تصميم + وثائق) دون أي تعديل على التطبيقات السبعة. لا Pull Request مفتوح ولا دمج في master.

الخلاصة: المنظومة قابلة للتكامل والتوحيد، لكن **الجاهزية للإنتاج اليوم منخفضة** لغياب CI مركزي (0 workflow runs)، وعدم إثبات أي بناء/اختبار فعلي، وعدم قابلية بوابة CONTROL للبناء بحالتها الحالية.

---

## 2. الفروع وحالة المستودع

| العنصر | الحالة المؤكدة |
|---|---|
| master | التزام واحد فقط (المشاريع السبعة كاملة) |
| feature/hudhud-portal | 3 التزامات: e4b7635، 5fd9852، 6e50b10 — إضافات فقط، لا PR، لا دمج |
| audit/hudhud-full-audit-2026-11-15 | هذا الفرع — توثيق فقط |
| Pull Requests | 0 مفتوح |
| Workflow runs | 0 — كل ملفات CI داخل مجلدات التطبيقات وليس في `.github/workflows` الجذر فلا تعمل مركزيًا |

---

## 3. تقييم التطبيقات السبعة

### 3.1 osiris-map — HUDHUD Maps
- Next.js 16.4.3 + React 19.2.4 + MapLibre 6.7 + Three.js + satellite.js + onnxruntime-web + ws + sharp.
- ~48 مسار API (طيران، بحرية، أقمار، حرائق، زلازل، طقس، عبور، OSINT، كريبتو، سايبر، GDELT، Sentinel، RECON، MCP، webhook، SDK ingest).
- أمان جيد مؤكد من next.config.ts: CSP، HSTS، X-Frame-Options، Permissions-Policy، poweredByHeader=false، صور unoptimized، ignoreBuildErrors=false.
- مسار صحة صادق `/api/health` (نطاق: العملية فقط، لا ادعاء صحة المنابع).
- لا PostgreSQL. مفاتيح اختيارية مع فشل آمن 503.
- دين تقني: page.tsx بحجم 142KB (مونوليتي).
- Docker standalone + nginx + deploy.sh. جاهزية: متوسطة-عالية.

### 3.2 neureed — HUDHUD News
- Next.js 16.0.4 + next-auth v5 beta.25 (Prisma adapter) + Prisma 7 + pgvector + ioredis + node-cron + transformers محلي + Storybook + Vitest/Playwright.
- ~9 شاشات (articles، admin، feeds-management، preferences، search، topics، docs…) و9 مجموعات API (admin، articles، auth، feeds، health، jobs، proxy، saved-searches، user).
- Schema: articles بembeddings vector، feeds بصحة/أخطاء، CronJobRun/JobLock، read_articles، saved searches، جداول next-auth.
- Node >=24 فقط. pgvector مطلوب.
- مخاطر: next-auth بيتا؛ مسار proxy غير مفحوص (SSRF محتمل — S3)؛ لا Dockerfile.

### 3.3 loki-verify — HUDHUD Verify
- Python 3.9+ / Flask 3 (OpenFactVerification/LibrAI Loki) + Poetry + openai/anthropic + serper retriever + playwright-stealth.
- webapp.py: POST / للتحقق من نص، GET /shownClaim/<id>؛ نتائج تُكتب إلى ملف محلي (غير ملائم للتوسع).
- مخاطر: خادم تطوير debug=True، لا HTTPS، لا rate limit، لا تخزين مُدار.
- جاهزية: منخفضة للإنتاج — يحتاج gunicorn + تخزين + أسرار مُدارة. مختلف تقنيًا تمامًا (الوحيد Python) — التكامل عبر API فقط.

### 3.4 zexa-auth — HUDHUD Identity
- Next.js 16.2.6 + Better Auth 1.6.11 + Drizzle + PostgreSQL + Resend + admin plugin.
- مؤكد من الكود: email/password مع تحقق بريدي، reset 60 دقيقة، OAuth GitHub+Google، accountLinking، جلسات بIP/UA، impersonation، أدوار admin/user.
- جداول: user، session، account، verification فقط (2 migrations Drizzle).
- **Zexa ليس مزود هوية مركزيًا (IdP) في وضعه الحالي** — لا OIDC provider/issuer/JWKS. لاستخدامه كمصدر SSO يلزم تفعيل plugin OIDC وخطة ربط موثقة.

### 3.5 nchat — HUDHUD Connect
- pnpm monorepo: backend (nself/Hasura) + frontend (Next.js 15.5.28 على Vercel مع crons) + frontend-vite + desktop (4 منصات) + integration tests.
- OpenAPI 3.0.3 v0.9.1 كامل: health، ready، config، upload، search، translation، link-preview، webhooks، audit، metrics، setup — Bearer JWT + أدوار owner/admin + rate limits موثقة + Prometheus.
- بنية تحتية (compose): PostgreSQL 16 + Hasura v2.44 + nhost-auth 0.36 + Redis 7 + MinIO + Meilisearch v1.5 + Mailpit + Nginx + LiveKit اختياري (برخصة nself).
- 47 workflow داخل nchat/.github (security-scan 29KB، e2e 21KB، gitleaks، SBOM، placeholder-gate، openapi-diff-gate) — لكنها لا تعمل مركزيًا.
- مخاطر: أسرار dev افتراضية ملتزمة في Git (S1)؛ CORS wildcard في dev.

### 3.6 rhex-forum — HUDHUD Community
- Next.js 16.2.6 + Prisma 6.19 + Redis + S3 + worker منفصل + WebAuthn + arctic + nodemailer + مدفوعات (Alipay/alicloud/tencentcloud) + jieba/pinyin + mermaid/katex/markdown-it.
- Schema ضخم (117KB): أقسام/مواضيع/تعليقات + مزادات + يانصيب + RedPacket + نقاط + VIP + شارات + مهام + إعلانات + مدفوعات + RSS Universe + OAuth clients + Gobang + YinYang + Zones + addons.
- ~50 صفحة و37 مجموعة API.
- compose: postgres:18 + redis + web + worker + setup + postgres-backup (pg_dump) + uploads/addons volumes؛ صورة ghcr.io/lovedevpanda/rhex.
- مخاطر: ignoreBuildErrors=true (S2)، CSP = frame-ancestors فقط (S2a)، تعقيد مدفوعات (S8)، لا مسار صحة مؤكد.

### 3.7 umami — HUDHUD Analytics
- Next.js 16.4.2 + Prisma 7 (adapter-pg + read replicas) + ClickHouse اختياري + Redis + Kafka اختياري + next-intl + OpenAPI مولّد + tracker/recorder (rrweb) + 2FA + bcrypt + JWT + maxmind.
- app: (collect), (compat), (main), login, logout, share, sso, mcp؛ API: 20+ مجموعة (2fa, admin, auth, dashboard, heartbeat, me, pixels, realtime, record, send, teams, users, websites…).
- docker + podman + netlify + vercel configs؛ Vitest + Playwright e2e + api tests.
- جاهزية: الأنضج اختباريًا وأمنيًا (2FA، SSO page).

### 3.8 جدول مقارنة

| التطبيق | الإطار | الشاشات | API | القاعدة | الاختبارات | Docker | جاهزية إنتاج |
|---|---|---|---|---|---|---|---|
| osiris-map | Next 16.4.3 | ~4 | ~48 مسار | — | Vitest | نعم | متوسطة-عالية |
| neureed | Next 16.0.4 | ~9 | 9 مجموعات | PG+pgvector | Vitest/Playwright | لا | متوسطة |
| loki-verify | Flask 3 | 2 | 2 | — | لا | لا | منخفضة |
| zexa-auth | Next 16.2.6 | ~6 | 2 مجموعات | PG | لا | لا | متوسطة |
| nchat | Next 15.5.28 | متعدد المنصات | OpenAPI كامل | PG16+Hasura | e2e+integration | نعم | متوسطة-عالية |
| rhex-forum | Next 16.2.6 | ~50 | 37 مجموعة | PG18+Redis | tsx test | نعم | متوسطة |
| umami | Next 16.4.2 | ~8 | 20+ مجموعة | PG+CH | Vitest+Playwright | نعم | متوسطة-عالية |

---

## 4. مصفوفة الاعتماديات

| التطبيق | PG | Redis | MinIO/S3 | Hasura | Meili | ClickHouse | Kafka | LiveKit | SMTP |
|---|---|---|---|---|---|---|---|---|---|
| osiris-map | — | — | — | — | — | — | — | — | — |
| neureed | نعم (pgvector) | نعم | — | — | — | — | — | — | — |
| loki-verify | — | — | — | — | — | — | — | — | — |
| zexa-auth | نعم | — | — | — | — | — | — | — | Resend |
| nchat | نعم (16) | نعم | MinIO | v2.44 | v1.5 | — | — | اختياري | Mailpit dev |
| rhex-forum | نعم (18) | نعم | S3 | — | — | — | — | — | SMTP |
| umami | نعم | نعم | — | — | — | اختياري | اختياري | — | — |

---

## 5. قواعد البيانات والتخزين

- إصدارات PostgreSQL مختلطة: 16 (nchat)، 18 (rhex)، وأخرى عبر Prisma/Drizzle بدون تثبيت compose (neureed, umami, zexa).
- امتدادات مطلوبة: pgvector (neureed)، uuid-ossp/pgcrypto/pg_trgm/citext (nchat).
- Prisma 6 (rhex) مقابل Prisma 7 (neureed/umami) مقابل Drizzle (zexa) — كل مشروع بمولّده المستقل؛ لا دمج.
- Meilisearch/ClickHouse/Kafka/Redis/MinIO/Hasura/LiveKit تُحفظ كما هي؛ PostgreSQL لا يستبدلها.
- HA المركزي قابل للتنفيذ (قواعد hudhud_* + أدوار منفصلة + TLS + PgBouncer + PITR) بشرط فحص توافق: pgvector على الإصدار المختار، Prisma 6 مع PG، Hasura عبر PgBouncer (وضع transaction)، أثر read replicas (umami).

---

## 6. المصادقة والتفويض

- خمس منظومات مصادقة مختلفة مؤكدة: next-auth v5 beta (neureed)، Better Auth (zexa)، nhost-auth JWT HS256 + Hasura (nchat)، arctic + bcrypt + WebAuthn (rhex)، JWT + bcrypt + 2FA + SSO page (umami).
- Zexa كIdP: غير مفعّل حاليًا كOIDC provider. الخطة الواقعية: (أ) ربط مُدار عبر OAuth clients في كل تطبيق مع إبقاء المصادقات المحلية، ثم (ب) تقييم SSO كامل بعد إثبات توافق الجلسات والكوكيز عبر النطاقات.
- عدم توافق مؤكد: جلسات JWE (next-auth) مقابل DB sessions (Better Auth) مقابل JWT HS256 (Hasura) — لا توحيد للمخازن دون تعديل جوهري؛ المسار: OIDC provider في zexa + نطاق موحد + اختبارات توافق موثقة.

---

## 7. خريطة الصحة والتكامل

- مسارات صحة مؤكدة: osiris `/api/health`، neureed `/api/health`، nchat `/api/health` + `/api/ready`، umami `/api/heartbeat`.
- مسارات مفقودة (يلزم إنشاؤها): rhex-forum، loki-verify، zexa-auth.
- عقود API موثقة موجودة: nchat (OpenAPI كامل)، umami (OpenAPI مولد + contracts)، osiris (MCP + SDK ingest + webhook).

---

## 8. الأمان — سجل المخاطر

| # | الموقع | الخطورة | الوصف | المعالجة |
|---|---|---|---|---|
| S1 | nchat/backend/.env.dev | عالية (نمطًا) | أسرار dev افتراضية ملتزمة في Git (admin secret، minio root، postgres، livekit keys) | إزالة القيم من Git + تدوير أي سر مشتق + secret manager |
| S2 | rhex next.config.mjs | متوسطة | ignoreBuildErrors=true يخفي أخطاء TS عن البناء | إزالة العلم بعد إصلاح الأخطاء + بوابة CI على tsc |
| S2a | rhex CSP | متوسطة | CSP = frame-ancestors فقط | CSP كامل |
| S3 | neureed api/proxy | متوسطة | مسار proxy غير مفحوص محتوىً — SSRF محتمل | فحص الكود + allowlist + حجب عناوين داخلية |
| S3a | neureed next-auth beta | متوسطة | مكتبة مصادقة بيتا | ترقية عند الاستقرار + اختبارات توافق |
| S4 | loki webapp | متوسطة | Flask debug=True + ملف حالة + لا rate limit/HTTPS | gunicorn + تخزين مُدار + مفاتيح مُدارة |
| S5 | osiris page.tsx 142KB | منخفضة | مكون مونوليتي | تقسيم تدريجي |
| S6 | portal (فرع الميزة) | عالية للبوابة | لا dependencies ولا مصادقة ولا CSP ولا rate limit — غير قابلة للبناء | إصلاح كامل في المرحلة 1 |
| S7 | جذر المستودع | متوسطة | لا CI جذر ولا secret scanning مركزي | workflows جذر + gitleaks + dependency-review |
| S8 | rhex مدفوعات | منخفضة-متوسطة | SDKs مدفوعات Alipay/تينسنت | تقرير امتثال قبل أي تفعيل إنتاج |
| S10 | nchat dev CORS wildcard | متوسطة | CORS wildcard على Hasura في dev | ضبط CORS على نطاقات HUDHUD في الإنتاج |

> لا أسرار إنتاج حقيقية مكتشفة؛ القيم الملتزمة كلها dev/placeholders. التوصية: تفعيل push protection + secret scanning + تدوير أي سر مشتق قبل أي نشر.

---

## 9. البناء والاختبار

- **لم يُشغَّل أي بناء أو اختبار — لا دليل تنفيذ.** لا بيئة تشغيل متاحة من هذه الواجهة و0 workflow runs. الحالة لكل بناء/اختبار: UNKNOWN.
- ما يوجد: ملفات اختبار وCI موثقة داخل التطبيقات (Vitest، Playwright، e2e، security-scan) — التنفيذ غير مُثبت.

---

## 10. تعارضات التكامل

| # | التعارض | الحل المقترح |
|---|---|---|
| I1 | إصدارات PG مختلفة (16/18) | توحيد على إصدار مدعوم بعد فحص توافق كل ORM |
| I2 | جلسات مصادقة غير متوافقة | OIDC provider في zexa + ربط مُدار + نطاق موحد |
| I3 | مسارات صحة غير متجانسة (3 تطبيقات بلا مسار) | عقد صحة موحد لكل تطبيق |
| I4 | CI داخل مجلدات التطبيقات لا الجذر | نقل/استنساخ إلى workflows الجذر |

---

## 11. تقييم بوابة HUDHUD CONTROL

**موجود:** سجل 7 تطبيقات (أسماء HUDHUD + معرفات تقنية أصلية)، فحص صحة SSRF-safe (بروتوكول مقيد + مهلة 5 ثوانٍ + redirect يدوي) مع تمييز unknown، لوحة RTL داكنة ذهبية، توكنز تصميم، وثائق.

**نواقص حرجة:**
1. package.json بلا أي dependencies — `next build` سيفشل — **غير قابلة للبناء اليوم**.
2. لا مصادقة/تفويض/RBAC/audit على لوحة إدارية.
3. لا CSP ولا rate limiting.
4. لا قاعدة hudhud_core ولا سجل أحداث.
5. استيراد CSS بمسار خارج جذر التطبيق — يحتاج حل حزمة عند النشر.

---

## 12. المعمارية المستهدفة

- البوابة: Next.js 16 + Better Auth (admin) + Drizzle + `hudhud_core` — مراقِب عبر health/ready وAPIs موثقة فقط، لا iframes، ليست اعتمادًا تشغيليًا.
- قواعد: `hudhud_neureed`، `hudhud_zexa_auth`، `hudhud_nchat`، `hudhud_rhex_forum`، `hudhud_umami`، `hudhud_core` — وعدم إنشاء قواعد للتطبيقات التي لا تحتاج PG (osiris، loki).
- HA: primary + replica، PgBouncer (transaction mode)، TLS، أدوار منفصلة لكل قاعدة، pgBackRest/WAL-G لPITR، اختبار استعادة دوري.
- RTO/RPO مقترحان: RTO ≤ 30 دقيقة، RPO ≤ 5 دقائق (للاعتماد).

---

## 13. خطة الهوية البصرية

1. الطبقة 1 (منفذة على الفرع): توكنز CSS في shared/design-system — استيراد في globals.css لكل تطبيق دون تغيير معرفات تقنية.
2. الطبقة 2: حزمة `@hudhud/design` (خاصة) — تحل مشكلة مسار الاستيراد خارج الجذر — + favicon/logo SVG موحد + ميتاداتا (title/description/theme-color #0C0E12) + شاشات دخول بنفس النمط + حالات تحميل/خطأ موحدة + قوالب بريد HUDHUD.
3. الطبقة 3: مكونات مشتركة اختيارية (شريط علوي HUDHUD، بطاقة حالة) دون فرض.
4. الطبقة 4: الحفاظ على التخطيطات المتخصصة (الخريطة fullscreen، لوحات التحليلات).
5. الطبقة 5: فحص بصري دوري (Playwright visual على 3 مقاسات + RTL) + خط IBM Plex Sans Arabic مستضاف ذاتيًا (next/font) لا CDN.

---

## 14. خطة التنفيذ المرحلية

| # | المرحلة | النطاق | التقدير | يعتمد على |
|---|---|---|---|---|
| 0 | الخط الأساس | هذا التقرير | تم | — |
| 1 | إصلاح بوابة CONTROL | dependencies + Better Auth + CSP + hudhud_core + أحداث + إخفاء عناوين داخلية | 2-3 أيام | — |
| 2 | حزمة تصميم + علامة موحدة | @hudhud/design + 7 تطبيقات + خطوط مستضافة ذاتيًا + فحص بصري | 5-8 أيام | 1 |
| 3 | عقود صحة موحدة | مسارات مفقودة (rhex، loki، zexa) + توحيد العقد + تكامل بوابة | 2-3 أيام | 1 |
| 4 | هوية مركزية (مُدارة) | OIDC provider في zexa + clients لكل تطبيق + جدول account_link في hudhud_core + فشل لطيف | 5-8 أيام | 2، D2 |
| 5 | PG HA وعزل القواعد | PG16/18 + hudhud_* + أدوار + TLS + PgBouncer + PITR + ترحيل غير هدّام بمراحل | 6-10 أيام | D1، D4 |
| 6 | أمان وتشغيل | إصلاح S1-S10 + secret manager + شبكات معزولة + تدوير أسرار | 4-6 أيام | 5 |
| 7 | مراقبة | OpenTelemetry + Prometheus/Grafana + تنبيهات + سجل تدقيق موحد | 5-8 أيام | 3، 6 |
| 8 | CI/CD مركزي | workflows جذر + matrix لكل تطبيق + gitleaks + SBOM + dependency-review | 3-5 أيام | 1 |
| 9 | القبول النهائي | تشغيل staging + قياس معايير القبول + توثيق | 3-5 أيام | الكل |

**منهجية كل مرحلة:** فرع مستقل + PR + اختبارات + معايير قبول. لا حذف وظائف؛ لا دمج قواعد؛ لا SSO قبل إثبات التوافق؛ الترحيل غير هدّام بنسخ احتياطية مُختبرة وإبقاء الأصول القديمة.

---

## 15. متطلبات وموارد خارجية

| المورد | الحالة |
|---|---|
| استضافة PG HA + PgBouncer + الخدمات (Redis، MinIO، Meili، Hasura، CH اختياري، LiveKit اختياري) | غير متوفرة — قرار مطلوب |
| نطاق موحد + TLS | غير محدد — قرار مطلوب |
| مفاتيح LLM (OpenAI/Anthropic + Serper) لloki | مطلوبة — ليست في المستودع (صحيح) |
| Gemini/Shodan/CF/transit keys لosiris | اختيارية — فشل آمن بدونها |
| Resend + SMTP لzexa/rhex | مطلوبة للبريد |
| رخصة nself plugins لnchat المتقدم | اختيارية — قرار |
| Google/GitHub OAuth apps | مطلوبة |

---

## 16. معايير القبول المقترحة للإنتاج

- بناء فعلي مثبت لكل تطبيق + بوابة (في CI).
- اختبارات آلية تمر أو استثناءات موثقة مقبولة.
- صحة موحدة تعرضها البوابة بدقة (unknown ≠ down).
- عزل قواعد مثبت باختبار وصول مرفوض بين قواعد التطبيقات.
- HA: failover مختبر + RTO/RPO مقاسان (فقط حيث تسمح البنية التحتية الفعلية).
- نسخ احتياطي واستعادة مختبران موثقان.
- أمان: SAST/DAST خفيف + إصلاح S1-S10 أو استثناءات مقبولة + push protection.
- RTL/موبايل: فحص موحد + أدوات a11y.
- rollback موثق لكل تطبيق ومُختبَر.
- تمييز صريح: جاهزية تطوير / staging / إنتاج.

---

## 17. حدود التدقيق (صراحةً)

- لم يُقرأ كل ملف من آلاف الملفات؛ فُحصت البنية والملفات الجوهرية والأمنية والسطحية الحاسمة لكل تطبيق. تدقيق كل ملف يتطلب SAST/جلسات إضافية.
- لم يُشغَّل أي بناء/اختبار/lint — لا بيئة تنفيذ. الحالة UNKNOWN ولا ادعاء نجاح.
- النشر الفعلي (DNS، شهادات، بيئات) خارج المستودع — لا يمكن التحقق منه من هنا.
- إعدادات حماية الفروع في GitHub غير مفعّلة (فرع غير محمي مؤكد) — توصية بتفعيلها.

---

## 18. القرارات المطلوبة منك

| # | القرار | التوصية | الأثر إن لم يُحسم |
|---|---|---|---|
| D1 | إصدار PostgreSQL الموحد | PG16 (توافق Hasura المختبر + pgvector) | تعليق المرحلة 5 |
| D2 | مسار الهوية الموحدة | OIDC عبر zexa بعد تفعيل plugin OIDC | تعليق المرحلة 4 |
| D3 | نطاق الإنتاج | نطاق موحد *.hudhud + TLS | لا SSO عبر النطاقات ولا نشر إنتاج |
| D4 | الاستضافة | سحابة مُدارة PG + compose للخدمات الأخرى | تعليق كل الإنتاج |
| D5 | قواعد للتطبيقات غير المحتاجة | لا ننشئ hudhud_osiris/loki_verify | تعقيد بلا حاجة إن أُنشئت |
| D6 | رخصة nself/LiveKit لnchat | تعطيل مؤقت (اختيارية) | لا أثر |
| D7 | مدفوعات rhex | تعطيل حتى توضيح الامتثال | تعطيل جزئي للمجتمع إن كانت مطلوبة |
| D8 | دمج فرع البوابة | نعم بعد إصلاح البناء + المصادقة | بوابة معلقة |
| D9 | تفعيل CI الجذر + حماية الفروع | نعم | تراكم أخطاء صامتة |
| D10 | ترحيل rhex PG18→PG16 | يُفحص توافق Prisma 6 أولًا؛ يُبقى 18 مؤقتًا إن لزم | قرار مرحلة 5 |

---

**نهاية التقرير — بانتظار موافقتك الصريحة قبل استئناف أي تنفيذ.**
