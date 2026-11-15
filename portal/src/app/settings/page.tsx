import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hasPermission, normalizeRole, PERMISSION_MATRIX } from "@/lib/rbac";
import { HUDHUD_APPS } from "@/lib/registry";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

// System settings — admin only. Read-only view of real runtime configuration.
// Secrets are NEVER displayed, only presence/absence booleans.
// Configuration changes happen through deployment env vars, not this page
// (writing secrets from a web page would be a security anti-pattern).

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير",
  operator: "مشغّل",
  viewer: "مشاهد",
};

const PERMISSION_LABELS: Record<string, string> = {
  "dashboard.view": "عرض لوحة القيادة",
  "audit.read": "قراءة سجل التدقيق",
  "health.refresh": "تحديث فحص الصحة",
  "settings.manage": "إدارة الإعدادات",
  "users.manage": "إدارة المستخدمين",
};

export default async function SettingsPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const portalRole = normalizeRole(
    (session.user as { portalRole?: string | null }).portalRole,
  );
  if (!hasPermission(portalRole, "settings.manage")) {
    redirect("/");
  }

  // Presence booleans only — never values.
  const envPresence = {
    databaseUrl: Boolean(process.env.DATABASE_URL),
    betterAuthSecret: Boolean(process.env.BETTER_AUTH_SECRET),
    betterAuthUrl: Boolean(process.env.BETTER_AUTH_URL),
  };

  const appUrls = HUDHUD_APPS.map((app) => ({
    brandName: app.brandName,
    techId: app.techId,
    configured: Boolean(process.env[app.baseUrlEnv]),
  }));

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
            إعدادات النظام
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
            عرض للتهيئة الفعلية — القيم الحساسة تظهر كمُعرَّفة/غير مُعرَّفة فقط، ولا تُعدَّل من الواجهة
          </p>
        </div>
        <SignOutButton />
      </header>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.05rem", color: "var(--hudhud-text-primary)", marginBottom: "12px" }}>
          تهيئة البوابة
        </h2>
        <div className="hudhud-surface" style={{ padding: "16px", display: "grid", gap: "10px" }}>
          <EnvRow label="قاعدة بيانات hudhud_core" present={envPresence.databaseUrl} />
          <EnvRow label="سر المصادقة BETTER_AUTH_SECRET" present={envPresence.betterAuthSecret} />
          <EnvRow label="عنوان البوابة BETTER_AUTH_URL" present={envPresence.betterAuthUrl} />
        </div>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.05rem", color: "var(--hudhud-text-primary)", marginBottom: "12px" }}>
          عناوين التشغيل للتطبيقات (لأغراض فحص الصحة فقط)
        </h2>
        <div className="hudhud-surface" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                <th style={{ padding: "10px", textAlign: "right" }}>التطبيق</th>
                <th style={{ padding: "10px", textAlign: "right" }}>المعرّف التقني</th>
                <th style={{ padding: "10px", textAlign: "right" }}>العنوان مضبوط؟</th>
              </tr>
            </thead>
            <tbody>
              {appUrls.map((a) => (
                <tr key={a.techId} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                  <td style={{ padding: "10px" }}>{a.brandName}</td>
                  <td style={{ padding: "10px", fontFamily: "var(--hudhud-font-mono)", fontSize: "0.8rem" }}>
                    {a.techId}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {a.configured ? (
                      <span style={{ color: "var(--hudhud-success)" }}>مضبوط</span>
                    ) : (
                      <span style={{ color: "var(--hudhud-text-secondary)" }}>غير مضبوط — الحالة ستظهر «غير معروف»</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.05rem", color: "var(--hudhud-text-primary)", marginBottom: "12px" }}>
          مصفوفة الأدوار والصلاحيات
        </h2>
        <div className="hudhud-surface" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                <th style={{ padding: "10px", textAlign: "right" }}>الصلاحية</th>
                <th style={{ padding: "10px", textAlign: "right" }}>مدير</th>
                <th style={{ padding: "10px", textAlign: "right" }}>مشغّل</th>
                <th style={{ padding: "10px", textAlign: "right" }}>مشاهد</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(PERMISSION_LABELS).map((perm) => (
                <tr key={perm} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                  <td style={{ padding: "10px" }}>{PERMISSION_LABELS[perm]}</td>
                  <td style={{ padding: "10px" }}>{PERMISSION_MATRIX.admin.includes(perm as never) ? "✔" : "—"}</td>
                  <td style={{ padding: "10px" }}>{PERMISSION_MATRIX.operator.includes(perm as never) ? "✔" : "—"}</td>
                  <td style={{ padding: "10px" }}>{PERMISSION_MATRIX.viewer.includes(perm as never) ? "✔" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function EnvRow({ label, present }: { label: string; present: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
      <span>{label}</span>
      <span style={{ color: present ? "var(--hudhud-success)" : "var(--hudhud-danger)" }}>
        {present ? "معرَّفة" : "غير معرَّفة — راجع .env.example"}
      </span>
    </div>
  );
}
