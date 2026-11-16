import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { PROVIDER_REQUIREMENTS } from "@/lib/registry";
import { SignOutButton } from "@/components/SignOutButton";

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

  return (
    <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.4rem", color: "var(--hudhud-accent)" }}>
            إدارة المزودين
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
            حالة التهيئة الفعلية من متغيرات البيئة — حضور/غياب فقط، لا قيم أسرار تُعرض
          </p>
        </div>
        <SignOutButton />
      </header>

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
                <td style={{ padding: "12px", fontFamily: "var(--hudhud-font-mono)", fontSize: "0.8rem" }}>
                  {p.techId}
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
                        }}
                      >
                        <code
                          style={{
                            fontFamily: "var(--hudhud-font-mono)",
                            background: "var(--hudhud-surface-2)",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            direction: "ltr",
                          }}
                        >
                          {e.name}
                        </code>
                        <span style={{ color: e.present ? "var(--hudhud-success)" : "var(--hudhud-danger)" }}>
                          {e.present ? "معرَّف" : "غير معرَّف"}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "12px" }}>
                  {p.configured ? (
                    <span style={{ color: "var(--hudhud-success)", fontWeight: 600 }}>مضبوط</span>
                  ) : (
                    <span style={{ color: "var(--hudhud-warning)", fontWeight: 600 }}>
                      غير مكتمل
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.8rem", marginTop: "16px" }}>
        إعداد القيم يتم عبر secret manager أو بيئة التشغيل للتطبيق المعني — البوابة تقرأ فقط
        وتعرض الحضور/الغياب، ولا تقبل إدخال أسرار عبر الواجهة أبدًا.
      </p>
    </main>
  );
}
