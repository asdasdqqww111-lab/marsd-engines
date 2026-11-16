import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { checkAppHealth } from "@/lib/health";
import { HUDHUD_APPS } from "@/lib/registry";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { SignOutButton } from "@/components/SignOutButton";
import { HealthRefresh } from "@/components/HealthRefresh";

export const dynamic = "force-dynamic";

const L: Record<string, string> = {
  healthy: "يعمل",
  degraded: "يعمل جزئيًا",
  down: "غير متاح",
  unknown: "غير معروف",
};

const C: Record<string, string> = {
  healthy: "var(--hudhud-success)",
  degraded: "var(--hudhud-warning)",
  down: "var(--hudhud-danger)",
  unknown: "var(--hudhud-text-secondary)",
};

export default async function DashboardPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const portalRole = normalizeRole(
    (session.user as { portalRole?: string | null }).portalRole,
  );

  const results = await Promise.all(
    HUDHUD_APPS.map(async (app) => {
      const baseUrl = process.env[app.baseUrlEnv];
      return checkAppHealth(app.techId, baseUrl, app.healthPath);
    }),
  );

  const navLinks = [
    { href: "/", label: "لوحة القيادة", visible: hasPermission(portalRole, "dashboard.view") },
    { href: "/monitoring", label: "المراقبة", visible: hasPermission(portalRole, "monitoring.view") },
    { href: "/audit", label: "سجل التدقيق", visible: hasPermission(portalRole, "audit.read") },
    { href: "/users", label: "المستخدمون", visible: hasPermission(portalRole, "users.manage") },
    { href: "/providers", label: "المزودون", visible: hasPermission(portalRole, "settings.manage") },
    { href: "/backup", label: "النسخ الاحتياطي", visible: hasPermission(portalRole, "settings.manage") },
    { href: "/settings", label: "الإعدادات", visible: hasPermission(portalRole, "settings.manage") },
  ].filter((l) => l.visible);

  return (
    <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.4rem", color: "var(--hudhud-accent)" }}>
            هدهد · HUDHUD CONTROL
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
            لوحة القيادة الموحدة — الحالات أدناه فحص فعلي لحظي
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        {navLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            style={{
              color: "var(--hudhud-text-primary)",
              background: "var(--hudhud-surface-2)",
              border: "1px solid var(--hudhud-border)",
              borderRadius: "var(--hudhud-radius-sm)",
              padding: "6px 14px",
              fontSize: "0.85rem",
              textDecoration: "none",
            }}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <HealthRefresh />

      <div className="hudhud-surface" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
              <th style={{ padding: "12px", textAlign: "right" }}>التطبيق</th>
              <th style={{ padding: "12px", textAlign: "right" }}>المعرّف التقني</th>
              <th style={{ padding: "12px", textAlign: "right" }}>الحالة</th>
              <th style={{ padding: "12px", textAlign: "right" }}>زمن الاستجابة</th>
              <th style={{ padding: "12px", textAlign: "right" }}>التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {HUDHUD_APPS.map((app) => {
              const r = results.find((x) => x.techId === app.techId);
              const status = r?.status ?? "unknown";
              return (
                <tr key={app.techId} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                  <td style={{ padding: "12px" }}>
                    <strong style={{ color: "var(--hudhud-accent)" }}>{app.brandName}</strong>
                    <div style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.8rem" }}>
                      {app.description}
                    </div>
                  </td>
                  <td style={{ padding: "12px", fontFamily: "var(--hudhud-font-mono)", fontSize: "0.8rem" }}>
                    {app.techId}
                  </td>
                  <td style={{ padding: "12px", fontWeight: 600, color: C[status] }}>
                    {L[status]}
                    {r?.httpStatus != null ? (
                      <span style={{ color: "var(--hudhud-text-secondary)", fontWeight: 400, fontSize: "0.8rem" }}>
                        {" "}· HTTP {r.httpStatus}
                      </span>
                    ) : null}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {r?.latencyMs != null ? `${r.latencyMs} ms` : "—"}
                  </td>
                  <td style={{ padding: "12px", color: "var(--hudhud-text-secondary)", fontSize: "0.8rem" }}>
                    {r?.detail}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.8rem", marginTop: "16px" }}>
        «غير معروف» تعني أن عنوان التشغيل غير مضبوط — وليس تعطلًا. تعطل البوابة لا يؤثر على التطبيقات؛
        التنقل إليها مباشر دون iframes.
      </p>
    </main>
  );
}
