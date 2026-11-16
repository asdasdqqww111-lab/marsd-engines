import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { checkAppHealth } from "@/lib/health";
import { HUDHUD_APPS, type AppStatus } from "@/lib/registry";
import { normalizeRole } from "@/lib/rbac";
import { HealthRefresh } from "@/components/HealthRefresh";

export const dynamic = "force-dynamic";

const L: Record<AppStatus, string> = {
  healthy: "يعمل",
  degraded: "يعمل جزئيًا",
  starting: "قيد التهيئة",
  down: "غير متاح",
  unknown: "غير معروف",
};

const C: Record<AppStatus, string> = {
  healthy: "var(--hudhud-success)",
  degraded: "var(--hudhud-warning)",
  starting: "var(--hudhud-warning)",
  down: "var(--hudhud-danger)",
  unknown: "var(--hudhud-text-secondary)",
};

export default async function DashboardPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const results = await Promise.all(
    HUDHUD_APPS.map(async (app) => {
      const baseUrl = process.env[app.baseUrlEnv];
      return checkAppHealth(app.techId, baseUrl, app.healthPath);
    }),
  );

  const counts: Record<AppStatus, number> = {
    healthy: 0,
    degraded: 0,
    starting: 0,
    down: 0,
    unknown: 0,
  };
  for (const r of results) {
    counts[(r?.status ?? "unknown") as AppStatus] += 1;
  }

  return (
    <main>
      <div className="hudhud-page-head">
        <div>
          <h1 className="hudhud-page-title">لوحة القيادة</h1>
          <p className="hudhud-page-sub">
            الحالات أدناه فحص فعلي لحظي — لا مؤشرات وهمية
          </p>
        </div>
        <HealthRefresh />
      </div>

      <section className="hudhud-kpis" aria-label="ملخص صحة التطبيقات">
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-ok">{counts.healthy}</span>
          <span className="hudhud-kpi-label">يعمل</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-warn">{counts.degraded}</span>
          <span className="hudhud-kpi-label">يعمل جزئيًا</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-warn">{counts.starting}</span>
          <span className="hudhud-kpi-label">قيد التهيئة</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-bad">{counts.down}</span>
          <span className="hudhud-kpi-label">غير متاح</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value">{counts.unknown}</span>
          <span className="hudhud-kpi-label">غير معروف</span>
        </div>
      </section>

      <div className="hudhud-surface" style={{ overflowX: "auto", padding: 0 }}>
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
              const status: AppStatus = r?.status ?? "unknown";
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

      <p className="hudhud-note">
        «غير معروف» تعني أن عنوان التشغيل غير مضبوط — وليس تعطلًا. «قيد التهيئة» تعني أن
        العملية قائمة لكن الخدمة أبلغت بجاهزية not_ready. تعطل البوابة لا يؤثر على التطبيقات؛
        التنقل إليها مباشر دون iframes.
      </p>
    </main>
  );
}
