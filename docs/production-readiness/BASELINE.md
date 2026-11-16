# HUDHUD — خط الأساس للجاهزية للإنتاج (BASELINE)

**التاريخ:** 2026-11-16 (UTC) · **رأس master:** `164127cb9c6bb23357c010b3b622873d87a2eacc`
**المنهج:** جرد فعلي عبر GitHub API — لا تشغيل. لا عنصر "مكتمل" دون دليل تنفيذ.

---

## 1. حالة المستودع

| البند | القيمة |
|---|---|
| المستودع | `asdasdqqww111-lab/marsd-engines` (خاص) |
| الفروع | 21 (فروع عمل B–G) · **لا كتابة مباشرة على master** |
| PRs | 11 مدموجة (upstream) · #12–#17 مفتوحة بالسلسلة |
| CI | 0 تشغيلات — `ci/ci.yml` جاهز غير مفعّل (C-03) |
| صلاحيات الوكيل | ملفات/فروع/PRs ✔ · workflow ✖ |

## 2. سلسلة المراحل (كلها كود على فروع — FIXED_UNVERIFIED حتى التشغيل)

| المرحلة | الفرع | PR | المحتوى |
|---|---|---|---|
| A — الأساس | completion-baseline | [#12](https://github.com/asdasdqqww111-lab/marsd-engines/pull/12) | BASELINE + مصفوفة المشكلات |
| B — إصلاحات حرجة | (نفس الفرع) | #12 | C-01 عزل نتائج loki · C-02 RBAC خادمي · H-04 ترحيل OIDC · H-06 حرس dev · M-01/M-02/M-03/M-06 |
| C — تكامل | integration-phase-c | [#13](https://github.com/asdasdqqww111-lab/marsd-engines/pull/13) | H-01 عناوين مركزية · M-04 زر CONTROL · M-08 حالات خماسية · H-02/H-03 تدقيق OIDC/loki |
| D — تعريب | i18n-phase-d | [#14](https://github.com/asdasdqqww111-lab/marsd-engines/pull/14) | D-01 قاموس موحد · zexa عربية RTL كاملة · قوالب loki بهوية هدهد (H-05 جزئي) |
| E — AI ENGINE | ai-phase-e | [#15](https://github.com/asdasdqqww111-lab/marsd-engines/pull/15) | E-01 سجل مزودين + حظر Meta · E-02 سياسة مفاتيح خادمية (ترقيع داخلي BLOCKED) |
| F — أمن | security-phase-f | [#16](https://github.com/asdasdqqww111-lab/marsd-engines/pull/16) | F-01 فحص شامل عبر التطبيقات · F-02 مصفوفة OWASP · F-03 rhex analytics موثق |
| **G — staging** | **staging-phase-g** | [#17](https://github.com/asdasdqqww111-lab/marsd-engines/pull/17) | **G-01 خطة القبول + Backup/Restore + Runbook + قائمة موافقات موحدة · G-02 سكربت فحص صحة عبر التطبيقات** |

## 3. مصفوفة المشكلات — الحالات النهائية للمرحلة الحالية

| ID | الخطورة | الحالة | ملاحظة الحسم |
|---|---|---|---|
| C-01 | CRITICAL | FIXED_UNVERIFIED | يتحقق في §3.3 من STAGING-ACCEPTANCE |
| C-02 | CRITICAL | FIXED_UNVERIFIED | يتحقق في §3.2 |
| C-03 | CRITICAL | **BLOCKED → A1** | تفعيل CI قرار المشغّل (P1) |
| E-01 | HIGH | FIXED_UNVERIFIED | شاشة /providers/ai تتحقق في §3.1 |
| E-02 | CRITICAL (أمني) | PARTIAL → **إلزامي قبل أي نشر nchat** | ترقيع 6 ملفات في بيئة سحب ثم §3.4 |
| F-01/F-02 | HIGH | FIXED_UNVERIFIED / DOCUMENTED | تشغيل الأداة في §3.1 |
| H-01/H-05/M-02/M-08 | HIGH/MED | FIXED_UNVERIFIED (H-05 PARTIAL تعميمًا) | تتحقق في §3 |
| H-02 | HIGH | NEEDS APPROVAL → **A9** | OIDC staging بموافقة منفصلة |
| H-03 | HIGH | NEEDS APPROVAL → **A10** | خيار A (OIDC) موصى به |
| H-07 | HIGH | NEEDS APPROVAL → **A8** | موارد staging |
| M-04 | MED | PARTIAL | تعميم ControlReturnLink تدريجي بعد G |
| L-01 | LOW | OPEN | .gitignore لاحق |
| L-02 | LOW | OPEN → **A11** | Tag `v0.4.0-hudhud-baseline` بعد نجاح القبول |
| L-03 | LOW | OPEN | لا حذف فروع |

## 4. خطة التنفيذ (A→G) — الوضع النهائي

- **A–F:** منجزة ككود وتوثيق (تفاصيلها في إصدارات BASELINE السابقة على فروعها) — كلها FIXED_UNVERIFIED بانتظار تشغيل §3.
- **G ✅ (كود وتوثيق):**
  - [x] G-01 خطة القبول الكاملة (متطلبات تمهيدية، سلسلة دمج مرتبة، اختبارات لكل تطبيق، Backup/Restore قابل للتشغيل، Runbook تراجع، 11 موافقة موحدة)
  - [x] G-02 سكربت فحص صحة staging (PASS/FAIL/NOT RUN صادق، تحقق readiness لـ loki، عناوين من البيئة عبر H-01)
  - [ ] تنفيذ §3 و§4 من STAGING-ACCEPTANCE.md في بيئة فعلية — **رهن المشغّل (P1–P4)**
  - [ ] Tag/Release بعد نجاح القبول — **A11**

## 5. القيود الثابتة (مستمرة)

1. لا دمج في master دون موافقة صريحة منفصلة لكل PR.
2. لا حذف شاشة/وظيفة أصلية — إضافات فقط.
3. لا migrations مدمرة — CREATE-only.
4. ZERO-COST — لا مفاتيح تُفعَّل من الشيفرة؛ Meta AI محظور.
5. لا ادعاء نجاح دون دليل تشغيل موثق.
6. لا أسرار في المستودع/السجلات/الواجهات — مفاتيح AI لا تمر للمتصفح.

## 6. فجوات التحقق الصادقة (نهائية لهذه الدفعة)

- كل إصلاحات B–F + أدوات G: **NOT RUN** (لا بيئة للوكيل).
- E-02 الترقيع الداخلي: شرط تعجيزي لأي نشر لـ nchat قبل تنفيذه.
- OWASP A06/A08: تتطلب CI فعليًا.
- خط IBM Plex Sans Arabic: self-hosting لبيئات بلا إنترنت (قرار نشر).
- ترحيل OIDC 0002_snapshot.json: يُولَّد محليًا بـ `pnpm db:generate` قبل تشغيل migrate في staging.

---

*المرحلة G موثقة في git log للفرع `feature/hudhud-staging-phase-g` (3 التزامات). السلسلة A→G كاملة ككود؛ القبول الحقيقي يبدأ بتنفيذ STAGING-ACCEPTANCE.md — والكرة الآن في ملعب المشغّل (قائمة A1–A11).*
