import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hasPermission, normalizeRole, PORTAL_ROLES, PERMISSION_MATRIX } from "@/lib/rbac";
import { HUDHUD_APPS } from "@/lib/registry";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

// System settings — admin only. Read-only view of real runtime configuration.
// Secrets are NEVER displayed, only presence/absence booleans.
// Configuration changes happen through deployment env vars, not this page
// (writing secrets from a web page would be a security anti-pattern).

const PERMISSION_LABELS: Record<string, string> = {
  "dashboard.view": "عرض لوحة القيادة",
  "audit.read": "قراءة سجل التدقيق",
  "health.refresh": "تحديث فحص الصحة",
  "settings.manage": "إدارة الإعدادات",
  "users.manage": "إدارة المستخدمين",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

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
          gate: "12px",
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
        </h dummy
    </section>
  );
}
