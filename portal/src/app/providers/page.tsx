import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { PROVIDER_REQUIREMENTS } from "@/lib/registry";

export const dynamic = "force-dynamic";

/**
 * صفحة إدارة المزودين — حضور/غياب متغيرات البيئة الفعلية فقط.
 * لا قيم تُعرض أبدًا (لا سر يصل إلى المتصفح).
 * المصدر: ملفات .env.example الفعلية للتطبيقات في المستودع.
 */

export default async function ProvidersPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const portalRole = normalizeRole(
    (session.user as { portalRole?: string | null }).portalRole,
  );
  if (!hasPermission(portalRole, "settings.manage")) {
    redirect("/");
  }

  const providers = PROVIDER_REQUIREMENTS.map((p) => {
    const envs = p.envVars.map((v) => ({
      name: v,
      present: Boolean(process.env[v]),
    }));
    return { ...p, envs, configured: envs.every((e) => e.present) };
  });

  const configuredCount = providers.filter((p) => p.configured).length;

  return (
    <main>
      <div className="hudhud-page-head">
        <div>
          <h1 className="hudhud-page-title">إدارة المزودين</h1>
          <p className="hudhud-page-sub">
            حالة التهيئة الفعلية من متغيرات البيئة — حضور/غياب فقط، لا قيم أسرار تُعرض
          </p>
        </div>
      </div>

      <section className="hudhud-kpis" aria-label="ملخص تهيئة المزودين">
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-ok">{configuredCount}</span>
          <span className="hudhud-kpi-label">مضبوط</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-warn">{providers.length - configuredCount}</span>
          <span className="hudhud-kpi-label">غير مكتمل</span>
        </div>
      </section>

      <div className="hudhud-surface" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
              <th style={{ padding: "12px", textAlign: "right" }}>المزود</th>
              <th style={{ padding: "12px", textAlign: "right" }}>التطبيق</th>
              <th style={{ padding: "12px", textAlign: "right" }}>المتغيرات المطلوبة</th>
              <th style={{ padding: "12px", textAlign: "right" }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.providerKey} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                <td style={{ padding: "12px" }}>
                  <strong>{p.providerName}</strong>
                </td>
                <td style={{ padding: "12px" }}>
                  <code className="hudhud-code">{p.techId}</code>
                </td>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "grid", gap: "4px" }}>
                    {p.envs.map((e) => (
                      <div
                        key={e.name}
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          fontSize: "0.8rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <code className="hudhud-code">{e.name}</code>
                        <span
                          className={
                            e.present
                              ? "hudhud-badge hudhud-badge-ok"
                              : "hudhud-badge hudhud-badge-bad"
                          }
                        >
                          {e.present ? "معرَّف" : "غير معرَّف"}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "12px" }}>
                  {p.configured ? (
                    <span className="hudhud-badge hudhud-badge-ok">مضبوط</span>
                  ) : (
                    <span className="hudhud-badge hudhud-badge-warn">غير مكتمل</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="hudhud-note">
        إعداد القيم يتم عبر secret manager أو بيئة التشغيل للتطبيق المعني — البوابة تقرأ فقط
        وتعرض الحضور/الغياب، ولا تقبل إدخال أسرار عبر الواجهة أبدًا.
      </p>
    </main>
  );
}
