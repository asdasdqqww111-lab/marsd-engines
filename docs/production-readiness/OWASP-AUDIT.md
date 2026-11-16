# HUDHUD — تدقيق OWASP عبر الشيفرة (المرحلة F)

**التاريخ:** 2026-11-16 (UTC) · **الفرع:** `feature/hudhud-security-phase-f`
**المنهجية:** جرد فعلي عبر GitHub API (بحث كود + قراءة ملفات) — لا فحص تشغيلي (C-03)، لذا كل بند إما "متحقق من الشيفرة" أو "يحتاج تشغيلًا للتحقق". لا PASS بلا دليل.

## ملخص الحالة لكل تطبيق (OWASP Top 10)

### portal (HUDHUD CONTROL)
| الفئة | الحالة من الشيفرة |
|---|---|
| A01 Broken Access Control | ✅ RBAC في الشاشات (session + hasPermission) ومسارات API محمية (health: 401 + rate limit) — متحقق من الشيفرة |
| A02 Cryptographic Failures | ✅ لا أسرار في الكود (فحص gitleaks مدمج في ci.yml + security-audit موسع) — أداة فقط؛ التحقق النهائي يتطلب CI |
| A03 Injection | ✅ Drizzle ORM (معاملات) — لا استعلامات مدمجة في الجرد |
| A04 Insecure Design | ✅ حدود ملكية موثقة (hudhud_core فقط) + عزل قواعد |
| A05 Security Misconfiguration | ✅ proxy.ts يبقي /api/health عامًا عن قصد موثق |
| A06 Vulnerable Components | ⚠️ يتطلب CI (npm audit) — NOT RUN |
| A07 Auth Failures | ✅ Better Auth + جلسات خادمية |
| A08 Integrity | ⚠️ lockfiles موجودة؛ التحقق عند CI |
| A09 Logging | ✅ سجل تدقيق فعلي (recordAuditEvent) مع ip/useragent |
| A10 SSRF | ✅ فحص الصحة يمر عبر URL::new + قيود بروتوكول (تحقق E المرحلة C) |

### zexa-auth (HUDHUD Identity)
| الفئة | الحالة |
|---|---|
| A01 | ✅ بعد C-02: فحص جلسة/دور داخلي في مسارات admin (401/403 fail-closed) — FIXED_UNVERIFIED حتى التشغيل |
| A07 | ✅ Better Auth 1.6.11 + OIDC opt-in من البيئة حصرًا |
| A02 | ✅ لا أسرار ملتزمة (جرد)؛ OIDC clients من البيئة |
| بقية الفئات | تعتمد تشغيليًا على PostgreSQL + HTTPS في النشر (مرحلة G) |

### loki-verify (HUDHUD Verify)
| الفئة | الحالة |
|---|---|
| A01 | ❌ **H-03 مفتوح**: لا مصادقة على واجهات الفحص — نقطة موافقة معمارية (OIDC موصى به، موثقة في IDENTITY-OIDC-LOKI-AUDIT.md). C-01 أغلق الأسوأ (عزل النتائج + 503 صادق) لكن الاستهلاك المكلف ما زال مفتوحًا لأي زائر عند وجود مزود |
| A05 | ⚠️ Flask debug=True في __main__ المحلي فقط — للنشر يلزم gunicorn بلا debug (قرار G) |
| A03 | ✅ تخزين SQLite بمعاملات (result_store.py) |

### nchat (HUDHUD Connect)
| الفئة | الحالة |
|---|---|
| A01 | ✅ middleware يحمي DEV_ONLY_ROUTES في production (H-06) + admin عبر RBAC |
| A02 | ⚠️ **E-02 PARTIAL**: فروع NEXT_PUBLIC_*_API_KEY القديمة في 6 ملفات lib/ai لا تزال بالشيفرة — أي ضبط لها يكشف المفتاح. السياسة والمرجع الخادمي منفذان؛ الترقيع الداخلي BLOCKED على بيئة تشغيل |
| A10 | ✅ استدعاءات AI عبر مسارات خادمية /api/ai/* (البنية الأصلية سليمة التصميم) |
| E2EE | ✅ وحدة e2ee موجودة (nchat/frontend/src/lib/e2ee) — خارج نطاق هذا التدقيق، لم تُمس |

### rhex-forum (HUDHUD Community)
| الفئة | الحالة |
|---|---|
| A03 | ⚠️ site-analytics.tsx يستخدم dangerouslySetInnerHTML — **معلّم بموجب قاعدة F-01 الجديدة (medium)**. الكود يوثق أنه قدرة مشرف موثوقة ولا يستقبل مدخلات مستخدمين — مقبول بمستند + مسؤولية، لكن يبقى في التقرير للمراجعة الدورية |
| A01 | ⚠️ WebAuthn موجود؛ RBAC التفصيلي خارج جرد هذه المرحلة |

### neureed / osiris-map / umami
| التطبيق | الحالة |
|---|---|
| neureed | ✅ next-auth v5 + Prisma (معاملات)؛ لا استخدامات خطرة في الجرد |
| osiris-map | ✅ لا تخزين/مصادقة (تطبيق عرض)؛ OpenAQ عام |
| umami | تطبيق مصدر خارجي (upstream Umami) — **خارج نطاق التعديل**؛ تحديثاته تتبع upstream حصرًا |

## قواعد أداة الفحص الجديدة (F-01 — منفذة)

| القاعدة | الخطورة | ما تكتشفه |
|---|---|---|
| ai_key_next_public_browser | high | أي NEXT_PUBLIC_(OPENAI|ANTHROPIC)_API_KEY في كود AI — سياسة E-02 |
| ai_key_env_browser_guard | medium | نمط "typeof window ثم قراءة API_KEY" — نمط nchat القديم |
| fetch_request_url_unverified | high | fetch خادمي بعنوان من مدخلات الطلب مباشرة — مؤشر SSRF للمراجعة اليدوية |
| hardcoded_http_url | low | عناوين http(s) غير localhost مضمنة في الكود بدل البيئة |
| نطاق الفحص | — | **كل التطبيقات الثمانية** (كان portal فقط) + ملفات .env في كل تطبيق + استثناء موثق للقوالب والاختبارات |

## فجوات صادقة تتطلب تشغيلًا (C-03) أو قرارًا

1. **E-02 الترقيع الداخلي** — أهم بند مفتوح (high، أمني).
2. **H-03 مصادقة loki** — NEEDS APPROVAL (الخيار A: OIDC موصى به).
3. A06/A08 لكل التطبيقات — npm audit + frozen lockfiles تُشغل في CI عند تفعيله.
4. debug=True في loki المحلي — يوثق للنشر عبر gunicorn (مرحلة G).

---

*كل ما في هذه الوثيقة إما متحقق من الشيفرة بمصدر، أو معلن كفجوة صادقة. لا ادعاء فحص تشغيلي.*
