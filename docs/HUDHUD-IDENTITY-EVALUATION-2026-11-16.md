# تقييم HUDHUD Identity — المرحلة أ من تسلسل الهوية

**الفرع:** `feature/hudhud-identity-evaluation`
**التاريخ:** 2026-11-16
**طبيعة الملف:** تقييم موثق فقط — لا تعديل شيفرة في هذه المرحلة

---

## 1. القرار المحسوم سابقًا (من الخطة المعتمدة)

**HUDHUD Identity (zexa-auth) كسلطة هوية مركزية عبر مزود OIDC قائم على Better Auth، بترحيل مرحلي "ربط مُدار" يُبقي كل مصادقة محلية تعمل. لا SSO إلزامي في الإنتاج.**

## 2. التقييم الفعلي (قراءة شيفرة 2026-11-16)

| البند | الحالة الفعلية | الدليل |
|-------|----------------|--------|
| zexa-auth كإطار IdP | جاهز جزئيًا | Better Auth + drizzleAdapter + admin plugin + nextCookies — بلا إضافات OIDC provider بعد |
| إضافة OIDC provider plugin | مطلوبة وغير مثبتة | `zexa-auth/src/lib/auth.ts` لا يحتوي `oidcProvider` ولا `jwt` |
| إضافة JWT/JWKS plugin | مطلوبة وغير مثبتة | نفس الملف — إلزامية لـ JWKS حسب وثائق Better Auth الرسمية |
| إمكانية الربط المُدار | جاهزة | Better Auth يدعم تسجيل عملاء OIDC عبر oidcProvider plugin (بما يتوافق مع نموذج nchat SSO الجاهز بنيويًا) |
| بنية nchat لاستقبال OIDC | جاهزة بنيويًا | ترحيل `20260207_sso_tables.sql` ينشئ `nchat_sso_connections` (بروتوكول saml أو oidc) مع RLS وقواعد owner/admin |
| نموذج per-app RBAC في nchat | جاهز | ترحيل `20260212_add_per_app_rbac.sql` — جدول apps وapp_user_roles مع صلاحيات دقيقة |
| neureed كعميل OIDC | جاهز بنيويًا | `neureed/src/lib/auth.ts` يبني مزود OIDC عام ديناميكيًا من متغيرات البيئة (OAUTH_CLIENT_ID/SECRET/AUTHORIZATION_URL/TOKEN_URL/USERINFO_URL/ISSUER) |
| umami | قرار موثق | تكامل عبر `/sso` token موقّع من البوابة — لا تعديل على طبقة مصادقة umami |
| rhex-forum | يحتاج تصميمًا | arctic يدعم OIDC لكن rhex يملك OAuth Authorization Server خاصًا — يحتاج قرار ربط مدروس |
| البوابة (portal) | مستقلة | Better Auth محلي بـ disableSignUp — لا تعارض مع IdP |

## 3. ملاحظات أمنية من القراءة الفعلية

1. **neureed `allowDangerousEmailAccountLinking: true`** على ثلاثة مزودين — خطر اختطاف حساب عبر مزود خارجي إن مُلئت متغيرات OIDC العامة. يجب مراجعته عند الربط الفعلي (خارج هذه المرحلة التقييمية) لأن إبطاله قد يكسر ربط الحسابات القائمة. سُجل كتوصية وليس تغييرًا في هذه المرحلة.
2. **قاعدة محروسة في neureed**: بريد إداري معيّن يُرفع تلقائيًا لـ ADMIN عند الدخول (`signIn`/`createUser` events). هذه قاعدة مُدمجة قائمة — لا تغيير عليها، لكن التقييم يسجل أنها ستحتاج ترحيلًا لسياسة مركزية عند مرحلة مزامنة الأدوار (ج) كي لا تظل قاعدة صلبة في شيفرة التطبيق.
3. **الشرط الصارم للمرحلة أ:** تعطل zexa يجب ألا يعطل الدخول المحلي في أي تطبيق — يُختبر في staging عند التنفيذ، وهذا شرط قبول لا يُتنازل عنه.

## 4. خطة التنفيذ للمرحلة أ (التالية بعد اعتماد هذا التقييم)

1. تجميد إصدار Better Auth في zexa (lock نسخة مثبتة).
2. إضافة `jwt` + `oidcProvider` plugins إلى zexa في staging فرع مخصص.
3. تسجيل عملاء: البوابة، nchat، neureed (عبر متغيراتها الجاهزة)، umami (توقيع /sso token من البوابة أو zexa).
4. اختبار PKCE + JWKS + token revocation في staging.
5. اختبار الفشل اللطيف: إسقاط zexa في staging → كل تطبيق يبقى قادرًا على الدخول المحلي.
6. عدم فرض أي SSO إلزامي — كل ربط اختياري ومتوازي مع المصادقة المحلية.

## 5. ما يتطلب موافقة منفصلة قبل التنفيذ

- تفعيل SSO على أي تطبيق في الإنتاج (والموافقة على هذا التقييم لا تغطيه).
- أي تعديل على `allowDangerousEmailAccountLinking` أو ترحيل الأدوار المدمجة في neureed.
- تدوير الاعتمادات أو تغييرات DNS/TLS المرافقة.

## 6. حالة التحقق

كل ما في هذا التقييم مستنبط من قراءة شيفرة فعلية في المستودع بتاريخ 2026-11-16 (zexa-auth/src/lib/auth.ts، neureed/src/lib/auth.ts، ترحيلات nchat SSO وper-app RBAC). لا نتائج اختبار مُشغَّلة — لا بيئة staging متاحة من خلال الأدوات الحالية.
