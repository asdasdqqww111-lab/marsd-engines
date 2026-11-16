# HUDHUD CI — حالة التجهيز والتنشيط

**الفرع:** `feature/hudhud-ci-ready`
**التاريخ:** 2026-11-16

## الوضع الحالي (صادق)

- ملف workflow الكامل جاهز في `ci/ci.yml` على هذا الفرع.
- **BLOCKED**: كتابة `.github/workflows/ci.yml` مرفوضة على كلا تكاملي GitHub المتاحين — نطاق `workflow` غير موجود في التوكن (رفض صريح Forbidden: insufficient scopes من MCP، وفشل غير معروف من githubTool على نفس المسار — تحقق القراءة أثبت عدم اكتمالها).

## خطوات التنشيط فور إعادة ربط GitHub بنطاق workflow

1. المستخدم يعيد ربط GitHub من إعدادات الحساب مع تفعيل نطاق `workflow`.
2. أنقل الملف: `ci/ci.yml` → `.github/workflows/ci.yml` (نفس المحتوى دون تغيير).
3. يُفتح PR ويُدمج بموافقة صريحة (تشغيل CI على master = حدث تشغيلي).
4. أول تشغيل فوري على دفعة master يعطي نتائج فعلية لـ: typecheck، lint، vitest، build، وgitleaks.
5. أُبلغ بالنتائج الحقيقية فقط — أي فشل يُصلح على فرع قبل أي دمج لاحق.

## محتوى الـ pipeline (مُوثق من ci/ci.yml)

| Job | الخطوات | ملاحظة |
|---|---|---|
| portal | checkout → Node 22 + npm cache → install → typecheck → lint → test → build | DATABASE_URL وBETTER_AUTH_SECRET قيم CI مؤقتة فقط؛ البناء يستخدم .env.example نسخةً |
| secret-scan | checkout كامل التاريخ → gitleaks-action v2 | يفحص كل الشيفرة الملتزمة تاريخيًا |

## لماذا هذا الترتيب

CI على master يعني أول تنفيذ فعلي لاختبارات وبناء البوابة — قبل دمج أي مرحلة لاحقة. لا يُدَّعى نجاح أي فحص لم يظهر في تبويب Actions فعليًا.
