import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { db } from "@/db";
import { appHealthSnapshot } from "@/db/schema";
import { desc, gte } from "drizzle-orm";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { HUDHUD_APPS } from "@/lib/registry";

export const dynamic = "force-dynamic";

const L: Record<string, string> = {
  healthy: "يعمل",
  degraded: "جزئي",
  down: "متوقف",
  unknown: "غير معروف",
};

const B: Record<string, string> = {
  healthy: "hudhud-badge hudhud-badge-ok",
  degraded: "hudhud-badge hudhud-badge-warn",
  down: "hudhud-badge hudhud-badge-bad",
  unknown: "hudhud-badge hudhud-badge-muted",
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

  const allRecent = await db
    .select()
    .from(appHealthSnapshot)
    .where(gte(appHealthSnapshot.checkedAt, since24h))
    .orderBy(desc(appHealthSnapshot.checkedAt))
    .limit(2000);

  const lastPerApp = new Map<string, (typeof allRecent)[number]>();
  for (const row of allRecent) {
    if (!lastPerApp.has(row.techId)) lastPerApp.set(row.techId, row);
  }

  const counts = { healthy: 0, degraded: 0, down: 0, unknown: 0 };
  for (const row of lastPerApp.values()) {
    counts[(row.status as keyof typeof counts) ?? "unknown"] += 1;
  }

  return (
    <main>
      <div className="hudhud-page-head">
        <div>
          <h1 className="hudhud-page-title">المراقبة — آخر 24 ساعة</h1>
          <p className="hudhud-page-sub">
            تاريخ لقطات الصحة الفعلية من hudhud_core — كل رقم قابل للتحقق
          </p>
        </div>
      </div>

      <section className="hudhud-kpis" aria-label="ملخص آخر حالة لكل تطبيق">
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-ok">{counts.healthy}</span>
          <span className="hudhud-kpi-label">يعمل</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-warn">{counts.degraded}</span>
          <span className="hudhud-kpi-label">جزئي</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-bad">{counts.down}</span>
          <span className="hudhud-kpi-label">متوقف</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value">{counts.unknown}</span>
          <span className="hudhud-kpi-label">غير معروف</span>
        </div>
      </section>

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
              const status = last?.status ?? "unknown";
              return (
                <tr key={app.techId} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                  <td style={{ padding: "12px" }}>
                    <strong style={{ color: "var(--hudhud-accent)" }}>{app.brandName}</strong>
                    <div style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.8rem" }}>
                      {app.techId}
                    </div>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span className={B[status]}>{L[status]}</span>
                    {last?.httpStatus != null ? (
                      <span style={{ color: "var(--hudhud-text-secondary)", fontWeight: 400, fontSize: "0.8rem", marginInlineStart: "6px" }}>
                        · HTTP {last.httpStatus}
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

      <p className="hudhud-note">
        البيانات من جدول app_health_snapshot. «لا لقطات بعد» تعني عدم وجود فحص مسجل — وليس أن التطبيق معطل.
      </p>
    </main>
  );
}
