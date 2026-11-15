import { HUDHUD_APPS } from "@/lib/registry";
import { checkAppHealth, type HealthResult } from "@/lib/health";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  healthy: "يعمل",
  degraded: "يعمل جزئيًا",
  down: "غير متاح",
  unknown: "غير معروف",
};

const STATUS_COLOR: Record<string, string> = {
  healthy: "var(--hudhud-success)",
  degraded: "var(--hudhud-warning)",
  down: "var(--hudhud-danger)",
  unknown: "var(--hudhud-text-secondary)",
};

export default async function DashboardPage() {
  const results: HealthResult[] = await Promise.all(
    HUDHUD_APPS.map(async (app) => {
      const baseUrl = process.env[app.baseUrlEnv];
      return checkAppHealth(app.techId, baseUrl, app.healthPath);
    }),
  );

  return (
    <section style={{ padding: "16px" }}>
      <h2 style={{ color: "var(--hudhud-text-primary)", marginTop: 0 }}>لوحة القيادة الموحدة</h2>
      <p style={{ color: "var(--hudhud-text-secondary)" }}>
        الحالة أدناه تعكس فحصًا فعليًا لحظيًا. "غير معروف" يعني أن عنوان التشغيل غير مضبوط عبر متغيرات البيئة — وليس تعطلًا.
      </p>
      <div className="hudhud-surface" style={{ padding: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
              <th style={{ padding: "8px" }}>التطبيق</n              <th style={{ padding: "8px" }}>المعرّف التقني</th>
              <th style={{ padding: "8px" }}>الحالة</th>
              <th style={{ padding: "8px" }}>زمن الاستجابة</th>
              <th style={{ padding: "8px" }}>التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {HUDHUD_APPS.map((app) => {
              const r = results.find((x) => x.techId === app.techId);
              const status = r?.status ?? "unknown";
              return (
                <tr key={app.techId} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                  <td style={{ padding: "12px 8px" }}>
                    <strong style={{ color: "var(--hudhud-accent)" }}>{app.brandName}</strong>
                    <div style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.8rem" }}>{app.description}</div>
                  </td>
                  <td style={{ padding: "12px 8px", fontFamily: "var(--hudhud-font-mono)", fontSize: "0.85rem" }}>{app.techId}</td>
                  <td style={{ padding: "12px 8px", color: STATUS_COLOR[status], fontWeight: 600 }}>
                    {STATUS_LABEL[status]}
                    {r?.httpStatus != null ? <span style={{ color: "var(--hudhud-text-secondary)", fontWeight: 400 }}> · HTTP {r.httpStatus}</span> : null}
                  </td>
                  <td style={{ padding: "12px 8px" }}>{r?.latencyMs != null ? `${r.latencyMs} ms` : "—"}</td>
                  <td style={{ padding: "12px 8px", color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>{r?.detail}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
        كل تطبيق يعمل بشكل مستقل؛ تعطل البوابة أو أي تطبيق لا يؤثر على استقلالية البقية. التنقل يتم مباشرة إلى عناوين التطبيقات دون iframes.
      </p>
    </section>
  );
}
