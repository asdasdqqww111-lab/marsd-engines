import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { SignOutButton } from "@/components/SignOutButton";
import { UserRoleSelect } from "@/components/UserRoleSelect";

export const dynamic = "force-dynamic";

// Real users from hudhud_core — no fabricated data. Admin only.

export default async function UsersPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const portalRole = normalizeRole(
    (session.user as { portalRole?: string | null }).portalRole,
  );
  if (!hasPermission(portalRole, "users.manage")) {
    redirect("/");
  }

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      portalRole: user.portalRole,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(user.createdAt);

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
            مستخدمو البوابة
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
            مشغّلو HUDHUD CONTROL — الأدوار فعلية من قاعدة hudhud_core، وكل تغيير يُسجَّل في التدقيق
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="hudhud-surface" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
              <th style={{ padding: "10px", textAlign: "right" }}>الاسم</th>
              <th style={{ padding: "10px", textAlign: "right" }}>البريد</th>
              <th style={{ padding: "10px", textAlign: "right" }}>الدور</th>
              <th style={{ padding: "10px", textAlign: "right" }}>الحالة</th>
              <th style={{ padding: "10px", textAlign: "right" }}>الإنشاء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                <td style={{ padding: "10px" }}>{u.name}</td>
                <td style={{ padding: "10px", fontFamily: "var(--hudhud-font-mono)", fontSize: "0.8rem" }}>
                  {u.email}
                </td>
                <td style={{ padding: "10px" }}>
                  <UserRoleSelect userId={u.id} currentRole={u.portalRole} />
                </td>
                <td style={{ padding: "10px" }}>
                  {u.banned ? (
                    <span style={{ color: "var(--hudhud-danger)" }}>محظور</span>
                  ) : (
                    <span style={{ color: "var(--hudhud-success)" }}>نشط</span>
                  )}
                </td>
                <td style={{ padding: "10px", fontSize: "0.8rem", color: "var(--hudhud-text-secondary)" }}>
                  {new Date(u.createdAt).toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "16px", textAlign: "center", color: "var(--hudhud-text-secondary)" }}>
                  لا يوجد مستخدمون — أنشئ حساب المشغّل الأول عبر seed-admin
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.8rem", marginTop: "16px" }}>
        إنشاء الحسابات يتم عبر السكربت المصرح به فقط (disableSignUp)؛ لوحة البوابة تعدّل الأدوار لا كلمات المرور.
      </p>
    </main>
  );
}
