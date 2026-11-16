# HUDHUD — المرحلة 4: التقوية الأمنية والرصد وقبول staging

**الفرع:** `feature/hudhud-phase4-hardening`
**التاريخ:** 2026-11-16
**الأساس:** master بعد دمج PR #10 (التصميم موحد على كل الشاشات)

## ما نُفِّذ فعليًا

| # | التغيير | الملف | النوع |
|---|---------|-------|------|
| 1 | سكربت فحص أمني فعلي قابل للتشغيل محليًا: أنماط أسرار (AWS/Google/OpenAI/GitHub/private keys/connection strings)، نقاط حقن (eval/new Function/exec/dangerouslySetInnerHTML)، ملفات .env ملتزمة — مخرجات JSON، كود خروج صريح | `portal/scripts/security-audit.ts` | أمن |
| 2 | تحسين أمني فعلي للنسخ الاحتياطي: الاتصال لـ pg_dump عبر بيئة العملية الفرعية (PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD) بدل سطر الأوامر — كلمة المرور لا تظهر في /proc/<pid>/cmdline أبدًا | `portal/scripts/backup-core.ts` | أمن |
| 3 | مسار سجل أحداث الصحة `/api/monitoring/history` — آخر 3 لقطات لكل تطبيق من app_health_snapshot الفعلي، جلسة + monitoring.view + rate limit | `portal/src/app/api/monitoring/history/route.ts` | رصد |
| 4 | سكربت `security:audit` في package.json + رفع الإصدار إلى 0.4.0 | `portal/package.json` | تشغيل |

## الاكتشافات أثناء التنفيذ (تدقيق ذاتي)

1. **قوس مفقود في collectEnvFiles** في الدفعة الأولى من security-audit.ts — اكتُشف بالمراجعة الذاتية قبل أي دمج، وأُصلح (commit 65e463).
2. **فحص ذاتي خاطئ**: نمط `exec(` كان سيطابق تعريف النمط نفسه في السكربت — عولج بالاستبعاد الذاتي (file !== self).
3. **فشل كتابة CI workflow**: محاولة عبر githubTool (putRepositoryFile) فشلت برسالة مجهولة والتحقق أكد عدم وجود الملف. هذا نفس العائق الموثق في المرحلة 3 (نطاق workflow غير متوفر في التوكن). **لا يوجد CI شغّال.**

## الاختبارات والفحوصات — الحالة الصادقة

| البند | الحالة | الدليل |
|-------|--------|--------|
| صحة TypeScript للسكربتات الجديدة | PASS (مراجعة سطرية) — أول نسخة كان بها قوس ناقص وأُصلح | قراءة الملف بعد الدفع (SHA 9596e4c) |
| فحص الأسرار (محلي) | قابل للتشغيل — **NOT RUN** حتى الآن | `cd portal && npm run security:audit` |
| الاختبارات / البناء / typecheck / lint | **NOT RUN** — لا بيئة تنفيذ للوكيل | المشغل يشغلها: `npm run typecheck && npm run lint && npm test && npm run build` |
| CI على GitHub | **BLOCKED** — نطاق workflow غير متوفر | محاولة كتابة ci.yml فشلت مجددًا (موثق أعلاه)

**قاعدة الصدق:** لا يُدّعى نجاح أي فحص لم يُشغّل فعليًا.

## ما يجب على المشغل تشغيله فعليًا (قبل الدمج)

```bash
cd portal
npm install
npm run typecheck
npm run lint
npm test
npm run security:audit
npm run build
```

## ما تبقى من المراحل (خارج نطاق الوكيل — تتطلب موارد/قرارات مشغّل)

1. **CI workflow**: يتطلب إعادة ربط GitHub بنطاق workflow — المحتوى جاهز في docs/HUDHUD-CONTROL-PHASE3-2026-11-16.md (قسم CI المُعدّ) وسيُضاف فور توفر النطاق.
2. **PostgreSQL HA (المرحلة 4 الأصلية)**: قرار موارد إنتاج — خارج نطاق الشيفرة وحدها.
3. **قوالب التشغيل (staging acceptance)**: قائمة الفحص التفصيلية في docs/HUDHUD-PRODUCTION-READINESS — تتطلب بيئة staging فعلية للتشغيل الفعلي.

## الأثر الأمني

- كلمة مرور قاعدة البيانات لم تعد تظهر في جدول العمليات أثناء النسخ الاحتياطي (تحسين عملي موثق).
- فحص الأسرار صار قابلًا للتشغيل محليًا بدون CI (مخرجات JSON قابلة للأتمتة).
- مسار history جديد بذات النمط الأمني: fail-closed + rate limit + لا كشف عناوين للتطبيقات.
- لا تغيير سلوكي في أي مسار قائم؛ الاستعادة بقيت هادمة بلا أي تغيير.

## الخطوة التالية

1. تشغيل أوامر التحقق أعلاه وتوثيق النتائج الفعلية.
2. دمج هذه المرحلة بموافقة صريحة (PR المرحلة 4).
3. توفير نطاق workflow → إضافة ci.yml فورًا.
