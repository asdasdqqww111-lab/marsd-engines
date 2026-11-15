import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditEvent } from "@/db/schema";
import { desc } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac";
import { normalizeRole } from "@/lib/rbac";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const portalRole = normalizeRole((session.user as { portalRole?: string | null }).portalRole);
  if (!hasPermission(portalRole, "audit.read")) {
    redirect("/");
  }

  const events = await db
    .select()
    .from(auditEvent)
    .orderBy(desc(auditEvent.createdAt))
    .limit(100);

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
            سجل الأحداث الإدارية
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
            آخر 100 حدث — من فعل ماذا ومتى، مع تنقية أسرار تلقائية
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="hudhud-surface" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
              <th style={{ padding: "10px", textAlign: "right" }}>الوقت</th>
              <th style={{ padding: "10px", textAlign: "right" }}>الفاعل</th>
              <th style={{ padding: "10px", textAlign: "right" }}>الإجراء</th>
              <th style={{ padding: "10px", textAlign: "right" }}>الهدف</th>
              <th style={{ padding: "10px", textAlign: "right" }}>النتيجة</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                <td style={{ padding: "10px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  {new Date(e.createdAt).toISOString()}
                </td>
                <td style={{ padding: "10px", fontSize: "0.85rem" }}>{e.actorEmail ?? "system"}</td>
                <td style={{ padding: "10px", fontFamily: "var(--hudhud-font-mono)", fontSize: "0.8rem" }}>
                  {e.action}
                </td>
                <td style={{ padding: "10px", fontFamily: "var(--hudhud-font-mono)", fontSize: "0.8rem" }}>
                  {e.target ?? "—"}
                </td>
                <td
                  style={{
                    padding: "10px",
                    fontSize: "0.85rem",
                    color: e.outcome === "success" ? "var(--hudhud-success)" : "var(--hudhud-danger)",
                  }}
                >
                  {e.outcome === "success" ? "نجاح" : "فشل"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
