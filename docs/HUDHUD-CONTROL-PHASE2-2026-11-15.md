# HUDHUD CONTROL — المرحلة الثانية (تنفيذ فعلي)

**الفرع:** `feature/hudhud-control-phase2` — PR #3
**آخر تحديث:** 2026-11-15

## ما نُفِّذ فعليًا في هذه المرحلة

| # | التغيير | الملف | النوع |
|---|---------|-------|------|
| 1 | إصلاح خطأ صياغة يمنع البناء + تصدير `sanitizeMetadata` المطلوب للاختبارات | `portal/src/lib/audit.ts` | إصلاح حرج |
| 2 | إصلاح خطأ صياغة يمنع البناء (`} 60,`) | `portal/src/lib/auth-config.ts` | إصلاح حرج |
| 3 | حفظ لقطات فحص الصحة في جدول `app_health_snapshot` (كان الجدول موجودًا بلا استخدام) | `portal/src/app/api/health/apps/route.ts` | ميزة |
| 4 | API إدارة مستخدمي البوابة (قراءة + تغيير دور) مع حماية من تخفيض الذات وتحديد معدل وتدقيق | `portal/src/app/api/admin/users/route.ts` | ميزة |
| 5 | صفحة إدارة المستخدمين (بيانات فعلية من hudhud_core) | `portal/src/app/users/page.tsx` | ميزة |
| 6 | مكوّن تغيير الدور من الواجهة | `portal/src/components/UserRoleSelect.tsx` | ميزة |
| 7 | صفحة إعدادات النظام (عرض حضور/غياب المتغيرات فقط — لا قيم أسرار أبدًا) | `portal/src/app/settings/page.tsx` | ميزة |
| 8 | لوحة قيادة بتنقل واعٍ بالأدوار (RBAC-aware) | `portal/src/app/page.tsx` | تحسين |
| 9 | حالة اختبار إضافية لتنقية عدادات الصحة | `portal/src/lib/__tests__/audit.test.ts` | اختبار |
| 10 | استخراج واقي منع تخفيض الذات إلى دالة نقية `checkPortalRoleChange` وربطه بمسار API | `portal/src/lib/rbac.ts` + `users/route.ts` | تحسين أمني |
| 11 | تغطية اختبار للواقي الأمني (4 حالات: هدف آخر مسموح، حفظ الدور مسموح، تخفيض الذات ممنوع، أي تغيير ذاتي ممنوع) | `portal/src/lib/__tests__/rbac.test.ts` | اختبار |

## الحدود الأمنية المحفوظة

- قاعدة hudhud_core فقط؛ لا وصول لأي قاعدة تطبيق.
- لا تُعرض قيم أي متغير بيئة في صفحة الإعدادات — حضور/غياب فقط.
- لا يمكن لمشغّل تغيير دوره الخاص (منع الانغلاق خارج البوابة) — الآن حدّ نقدي مُختبَر.
- كل تغيير دور يُسجَّل في `audit_event` مع الفاعل وIP والوقت.
- disableSignUp محفوظ — الحسابات تُنشأ عبر seed فقط.

## حالة CI (عائق موثق)

فشلت كتابة `.github/workflows/ci.yml` عبر التكاملين المتاحين:
1. **githubTool**: يفتقر لاستجابة نجاح موثوقة عند كتابة ملفات (سلوك غير مستقر — بعض الكتابات تكتمل فعليًا رغم إظهار خطأ).
2. **MCP GitHub**: رفض صريح `Forbidden: insufficient scopes` — نطاق **`workflow`** مطلوب على التوكن وغير متوفر.

لا يوجد CI شغّال حاليًا. محتوى الـ workflow المُعدّ موثق أدناه ويُضاف فور توفير النطاق.

## التحقق — الحالة الفعلية

| البند | الحالة | الدليل |
|-------|--------|--------|
| الإصلاحات الصياغية | PASS (قراءة ملفات) | audit.ts و auth-config.ts مقروءان سليمين على رأس الفرع |
| توافق حقول snapshot مع schema | PASS (قراءة) | حقول appHealthSnapshot متطابقة مع ما يُدرجه المسار |
| اختبارات الوحدة | NOT RUN | لا بيئة تنفيذ متاحة (sandbox معطل + لا CI شغّال) |
| البناء (next build) | NOT RUN | نفس السبب |
| CI على GitHub | BLOCKED | نطاق `workflow` غير متوفر في أي من التكاملين |

**قاعدة الصدق:** لا تُدّعى أي نتيجة PASS لاختبار أو بناء لم يُشغَّل فعليًا. التشغيل اليدوي: `npm install && npm test && npm run typecheck && npm run build` داخل portal (Node 22+).

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
```

## التالي بعد الدمج

1. تشغيل CI فور توفر نطاق workflow — التحقق الفعلي من النتائج.
2. تفعيل secret scanning (gitleaks) على المستودع.
3. المرحلة 3 من CONTROL (design system مشترك، مركز التدقيق المحسّن، إدارة المزودين).
