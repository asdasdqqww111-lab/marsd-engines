import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import {
  aiProviderStatuses,
  BLOCKED_AI_PROVIDERS,
} from "@/lib/ai-providers";

export const dynamic = "force-dynamic";

/**
 * HUDHUD AI ENGINE — شاشة مزودي الذكاء الاصطناعي (E-01) على مسار /providers/ai.
 * الشاشة الأصلية /providers تعرض مزودي الهوية والبنية (OAuth/Resend/Redis) —
 * هذه تعرض مزودي LLM فقط، من سجل E-01 الفعلي.
 * كل حالة من فحص حضور متغير البيئة الخادمي — لا قيم ولا أسرار ولا مؤشرات وهمية.
 */
export default async function AiProvidersPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const portalRole = normalizeRole(
    (session.user as { portalRole?: string | null }).portalRole,
  );
  if (!hasPermission(portalRole, "settings.manage")) {
    redirect("/");
  }

  const statuses = aiProviderStatuses();
  const configuredCount = statuses.filter((p) => p.configured).length;

  return (
    <main>
      <div className="hudhud-page-head">
        <div>
          <h1 className="hudhud-page-title">مزودو الذكاء الاصطناعي</h1>
          <p className="hudhud-page-sub">
            حالة تهيئة فعلية — حضور فقط، لا قيم ولا أسرار. المنظومة تعمل
            بدون مفاتيح بقدرات محلية صادقة.
          </p>
        </div>
      </div>

      <section className="hudhud-kpis" aria-label="ملخص مزودي AI">
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-ok">{configuredCount}</span>
          <span className="hudhud-kpi-label">مزود مضبوط</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-warn">
            {statuses.length - configuredCount}
          </span>
          <span className="hudhud-kpi-label">بلا مفتاح — قدرة معطلة صادقة</span>
        </div>
      </section>

      <section className="hudhud-section">
        <h2 className="hudhud-section-title">حالة المزودين</h2>
        <div className="hudhud-surface" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                <th style={{ padding: "10px", textAlign: "right" }}>المزود</th>
                <th style={{ padding: "10px", textAlign: "right" }}>التطبيق</th>
                <th style={{ padding: "10px", textAlign: "right" }}>متغيرات البيئة (خادمية)</th>
                <th style={{ padding: "10px", textAlign: "right" }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((p) => (
                <tr key={p.providerKey} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                  <td style={{ padding: "10px" }}>{p.providerName}</td>
                  <td style={{ padding: "10px" }}>
                    <code className="hudhud-code">{p.techId}</code>
                  </td>
                  <td style={{ padding: "10px", fontFamily: "var(--hudhud-font-mono)", fontSize: "0.8rem" }}>
                    {p.envVarNames.join(" · ")}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {p.configured ? (
                      <span className="hudhud-badge hudhud-badge-ok">مضبوط</span>
                    ) : (
                      <span className="hudhud-badge hudhud-badge-muted">غير مضبوط</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hudhud-section">
        <h2 className="hudhud-section-title">السياسة</h2>
        <div className="hudhud-surface" style={{ padding: "16px", display: "grid", gap: "8px" }}>
          <p className="hudhud-note" style={{ margin: 0 }}>
            ١. مفاتيح AI خادمية فقط — لا متغير NEXT_PUBLIC لمفتاح ذكاء اصطناعي
            في أي تطبيق HUDHUD (سياسة E-02).
          </p>
          <p className="hudhud-note" style={{ margin: 0 }}>
            ٢. غياب المفتاح لا يكسر التطبيقات: loki يرد 503 صادقًا دون اختلاق
            نتيجة، وnchat يعود لوضعه المحلي الموجود أصلًا.
          </p>
          <p className="hudhud-note" style={{ margin: 0 }}>
            ٣. المزودون المحظورون (سياسة المنظومة):
            <br />
            <span style={{ fontFamily: "var(--hudhud-font-mono)", fontSize: "0.8rem" }}>
              {BLOCKED_AI_PROVIDERS.join(" · ")}
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
