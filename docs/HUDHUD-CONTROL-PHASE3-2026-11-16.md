# HUDHUD CONTROL — المرحلة الثالثة (تنفيذ فعلي)

**الفرع:** `feature/hudhud-control-phase3`
**PR:** #4 — https://github.com/asdasdqqww111-lab/marsd-engines/pull/4
**التاريخ:** 2026-11-16

## ما نُفِّذ فعليًا في هذه المرحلة

| # | التغيير | الملف | النوع |
|---|---------|-------|------|
| 1 | صلاحية `monitoring.view` جديدة (admin + operator) في مصفوفة RBAC | `portal/src/lib/rbac.ts` | ميزة أمنية |
| 2 | مسارات صحة مُتحقَّقة من شيفرة كل تطبيق + وسم المصدر لكل مسار + متطلبات مزودين من .env.example الفعلية | `portal/src/lib/registry.ts` | تحقق حقيقي |
| 3 | جدولا `backup_record` و`restore_record` (سجلات append-only) | `portal/src/db/schema.ts` | قاعدة بيانات |
| 4 | ترحيل 0002 (جداول النسخ/الاستعادة + seed صلاحية monitoring.view) — idempotent | `portal/src/db/migrations/0002_monitoring_backup.sql` | قاعدة بيانات |
| 5 | سكربت نسخ احتياطي فعلي عبر pg_dump مع عدّ جداول حقيقي من information_schema | `portal/scripts/backup-core.ts` | تشغيل |
| 6 | سكربت استعادة آمن: dry-run افتراضيًا، `--confirm` إلزامي للتنفيذ، منع اجتياز مسار، hudhud_core فقط | `portal/scripts/restore-core.ts` | تشغيل |
| 7 | API تاريخ الصحة (`/api/monitoring/snapshots`) — تجميع لكل تطبيق من لقطات فعلية | `portal/src/app/api/monitoring/snapshots/route.ts` | ميزة |
| 8 | API سجل النسخ (`/api/admin/backups`) — قراءة فقط | `portal/src/app/api/admin/backups/route.ts` | ميزة |
| 9 | API حالة المزودين (`/api/admin/providers`) — حضور/غياب متغيرات من .env.example الفعلية للتطبيقات | `portal/src/app/api/admin/providers/route.ts` | ميزة |
| 10 | صفحة المراقبة — آخر حالة لكل تطبيق + عدد اللقطات الفعلية خلال 24 ساعة | `portal/src/app/monitoring/page.tsx` | ميزة |
| 11 | صفحة النسخ الاحتياطي والاستعادة — سجلان فعليان من backup_record/restore_record | `portal/src/app/backup/page.tsx` | ميزة |
| 12 | صفحة المزودين — حالة التهيئة بلا كشف أسرار أبدًا | `portal/src/app/providers/page.tsx` | ميزة |
| 13 | لوحة القيادة — روابط تنقل جديدة واعية بالأدوار (مراقبة/مزودون/نسخ) | `portal/src/app/page.tsx` | تحسين |
| 14 | الإعدادات — صلاحية المراقبة في مصفوفة الأدوار | `portal/src/app/settings/page.tsx` | تحسين |
| 15 | مركز التدقيق المحسّن — فلاتر فعلية (هدف/إجراء/نتيجة) على أعمدة مفهرسة فقط | `portal/src/app/audit/page.tsx` | تحسين |
| 16 | سكربتا `db:backup` و`db:restore` + إصدار 0.3.0 | `portal/package.json` | تشغيل |
| 17 | قالب البيئة — HUDHUD_BACKUP_DIR + متغيرات seed + مزودو التطبيقات | `portal/.env.example` | توثيق |
| 18 | اختبارات RBAC محدثة (6 صلاحيات) + اختبارات مزودين ومسارات صحة | `portal/src/lib/__tests__/rbac.test.ts` + `registry.test.ts` | اختبار |
| 19 | منع التزام ملفات النسخ `*.dump` | `.gitignore` | أمن |

## مسارات الصحة — مصدر التحقق

كل مسار في السجل مُتحقَّق منه من شيفرة التطبيق الفعلية (2026-11-16):
- **osiris-map** → `/api/health` (osiris-map/src/app/api/health/route.ts)
- **neureed** → `/api/health` (neureed/app/api/health/route.ts)
- **nchat** → `/api/health` (nchat/frontend/src/app/api/health/route.ts)
- **umami** → `/api/heartbeat` (docker-compose.yml healthcheck)
- **loki-verify / zexa-auth / rhex-forum** → لا مسار صحة مخصص في الشيفرة؛ الجذر `/` يُستخدم كفحص حياة صادق (liveness) مع وسم `root-liveness`.

## الأمان في الاستعادة (سكربت restore-core.ts)

- **dry-run افتراضيًا**: بدون `--confirm` لا يُكتب أي شيء — يتحقق من الملف والاتصال ويسجل `dry_run`.
- منع اجتياز المسار: اسم ملف فقط، لا `/` ولا `..`.
- يرفض أي ملف لا يبدأ بـ `hudhud_core_` — لا استعادة لقاعدة تطبيق أبدًا.
- عند `--confirm` يطالب صراحة بنسخة احتياطية جديدة قبل الاستعادة (خطة تراجع).
- كل محاولة تُسجَّل في `restore_record` بالنتيجة الفعلية.

## الحدود الأمنية المحفوظة

- hudhud_core فقط؛ لا وصول لأي قاعدة تطبيق.
- النسخ الاحتياطي يلمس hudhud_core فقط عبر pg_dump — لا قاعدة تطبيق.
- ملفات النسخ لا تُلتزم أبدًا (.gitignore) ولا يُخزن لها مسار داخلي في القاعدة (اسم ملف فقط).
- صفحة المزودين: حضور/غياب فقط — لا قيم، لا اختبار اتصال من المتصفح.
- الاستعادة عملية هادمة: لا تُنفَّذ من الواجهة إطلاقًا؛ موافقة صريحة + تنفيذ من المضيف.
- فلاتر مركز التدقيق على أعمدة مفهرسة فقط — لا بحث حر في jsonb.
- fail-closed في كل المسارات الجديدة (RBAC + جلسة + تحديد معدل).

## العائق الموثق — CI

فشلت كتابة `.github/workflows/ci.yml` على المسارين المتاحين:
1. **MCP GitHub**: رفض صريح — نطاق `workflow` مطلوب وغير متوفر في التوكن.
2. **githubTool**: فشل غير معروف وتحقق لاحق أثبت عدم اكتمال الكتابة (المجلد `.github` غير موجود على الفرع).

لا يوجد CI شغّال. محتوى الـ workflow جاهز بالكامل أدناه ويُضاف فور توفير نطاق `workflow` (إعادة ربط GitHub بنطاق موسّع).

## التحقق — الحالة الفعلية

| البند | الحالة | الدليل |
|-------|--------|--------|
| توافق schema مع migration 0002 | PASS (قراءة ملفات — الحقول والفهارس والCHECK متطابقة) | schema.ts ↔ 0002_monitoring_backup.sql |
| مسارات الصحة من شيفرة فعلية | PASS (بحث شيفرة + قراءة ملفات) | مصادر كل مسار موثقة أعلاه |
| صياغة TypeScript للملفات الجديدة | PASS (مراجعة يدوية سطرية + إصلاح استيرادات غير مستخدمة في monitoring) | قراءة الملفات بعد الكتابة |
| الاختبارات | NOT RUN — لا بيئة تنفيذ (لا CI شغّال) | تشغيل يدوي: `npm test` في portal |
| البناء | NOT RUN — نفس السبب | `npm run typecheck && npm run build` في portal |
| CI على GitHub | BLOCKED — نطاق workflow غير متوفر | الرفض الموثق أعلاه |

**قاعدة الصدق:** لا تُدّعى أي نتيجة PASS لاختبار أو بناء لم يُشغَّل فعليًا.

## محتوى CI المُعدّ (يُضاف فور توفر النطاق)

```yaml
name: CI
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
permissions:
  contents: read
jobs:
  portal:
    name: Portal — typecheck, lint, tests, build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: portal
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: portal/package.json
      - run: npm install --no-audit --no-fund
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: |
          cp .env.example .env.local
          npm run build
        env:
          DATABASE_URL: postgresql://ci:ci@localhost:5432/ci
          BETTER_AUTH_SECRET: ci-only-placeholder-not-a-real-secret
          NEXT_TELEMETRY_DISABLED: 1
  secret-scan:
    name: Secret scanning (gitleaks)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## التالي

1. مراجعة PR #4 ودمجه إلى master بموافقة صريحة.
2. توفير نطاق workflow → إضافة CI فورًا → التحقق الفعلي من typecheck/lint/test/build.
3. تشغيل `npm run db:apply` (ترحيل 0002) على hudhud_core — ثم فحص صفحات المراقبة/النسخ/المزودين ببيانات فعلية.
4. تشغيل نسخة احتياطية أولى عبر `HUDHUD_BACKUP_DIR=... npm run db:backup` والتحقق من ظهورها في السجل.
5. المرحلة 4 (PostgreSQL HA وقواعد hudhud_*) تتطلب بنية إنتاج فعلية وقرارات موارد (خارج نطاق الشيفرة وحدها).
