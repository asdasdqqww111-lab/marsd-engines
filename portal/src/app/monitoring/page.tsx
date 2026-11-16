import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appHealthSnapshot } from "@/db/schema";
import { desc, eq, gte, sql } from "drizzle-orm";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { HUDHUD_APPS } from "@/lib/registry";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

const L: Record<string, string> = {
  healthy: "يعمل",
  degraded: "جزئي",
  down: "متوقف",
  unknown: "غير معروف",
};

const C: Record<string, string> = {
  healthy: "var(--hudhud-success)",
  degraded: "var(--hudhud-warning)",
  down: "var(--hudhud-danger)",
  unknown: "var(--hudhud-text-secondary)",
};

/**
 * صفحة المراقبة — بيانات فعلية من app_health_snapshot فقط.
 * كل رقم معروض مأخوذ من استعلام حقيقي؛ لا مؤشرات وهمية.
 */
export default async function MonitoringPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const portalRole = normalizeRole(
    (session.user as { portalRole?: string | null }).portalRole,
  );
  if (!hasPermission(portalRole, "monitoring.view")) {
    redirect("/");
  }

  const since24h = new Date(Date.now() - 24 * 3_600_000);

  // آخر لقطة لكل تطبيق (المزيد تكرارًا = الأحدث أولًا ثم خذ الأولى لكل techId)
  const allRecent = await db
    .select()
    .from(appHealthSnapshot)
    .where(gte(appHealthSnapshot.checkedAt, since24h))
    .orderBy(desc(appHealthSnapshot.checkedAt))
    .limit(2000);

  const lastPerApp = new Map<string, typeof allRecent[number]>();
  for (const row of allRecent) {
    if (!lastPerApp.has(row.techId)) lastPerApp.set(row.techId, row);
  }

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
            المراقبة — آخر 24 ساعة
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
            تاريخ لقطات الصحة الفعلية من hudhud_core — كل رقم قابل للتحقق
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="hudhud-surface" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
              <th style={{ padding: "12px", textAlign: "right" }}>التطبيق</th>
              <th style={{ padding: "12px", textAlign: "right" }}>آخر حالة</th>
              <th style={{ padding: "12px", textAlign: "right" }}>آخر فحص</th>
              <th style={{ padding: "12px", textAlign: "right" }}>عدد اللقطات (24س)</th>
            </tr>
          </thead>
          <tbody>
            {HUDHUD_APPS.map((app) => {
              const rows = allRecent.filter((r) => r.techId === app.techId);
              const last = lastPerApp.get(app.techId);
              return (
                <tr key={app.techId} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                  <td style={{ padding: "12px" }}>
                    <strong style={{ color: "var(--hudhud-accent)" }}>{app.brandName}</strong>
                    <div style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.8rem" }}>
                      {app.techId}
                    </div>
                  </td>
                  <td style={{ padding: "12px", fontWeight: 600, color: C[last?.status ?? "unknown"] }}>
                    {L[last?.status ?? "unknown"]}
                    {last?.httpStatus != null ? (
                      <span style={{ color: "var(--hudhud-text-secondary)", fontWeight: 400, fontSize: "0.8rem" }}>
                        {" "}· HTTP {last.httpStatus}
                      </span>
                    ) : null}
                  </td>
                  <td style={{ padding: "12px", fontSize: "0.8rem", color: "var(--hudhud-text-secondary)" }}>
                    {last ? new Date(last.checkedAt).toISOString() : "—"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {rows.length === 0 ? (
                      <span style={{ color: "var(--hudhud-text-secondary)" }}>
                        لا لقطات بعد — شغّل فحص الصحة
                      </span>
                    ) : (
                      rows.length
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.8rem", marginTop: "16px" }}>
        البيانات من جدول app_health_snapshot. &quot;لا لقطات بعد&quot; تعني عدم وجود فحص مسجل — وليس أن التطبيق معطل.
      </p>
    </main>
  );
}
