import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { backupRecord, restoreRecord } from "@/db/schema";
import { desc } from "drizzle-orm";
import { hasPermission, normalizeRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * صفحة النسخ الاحتياطي والاستعادة — سجلات فعلية من backup_record وrestore_record.
 * النسخ والاستعادة تُنفَّذ عبر CLI (scripts/backup-core.ts / restore-core.ts)؛
 * الاستعادة عملية هادمة تتطلب موافقة صريحة وتُنفَّذ من المضيف مباشرة.
 */

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function BackupPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const portalRole = normalizeRole(
    (session.user as { portalRole?: string | null }).portalRole,
  );
  if (!hasPermission(portalRole, "settings.manage")) {
    redirect("/");
  }

  const backups = await db
    .select()
    .from(backupRecord)
    .orderBy(desc(backupRecord.createdAt))
    .limit(30);

  const restores = await db
    .select()
    .from(restoreRecord)
    .orderBy(desc(restoreRecord.createdAt))
    .limit(20);

  const successCount = backups.filter((b) => b.outcome === "success").length;
  const failureCount = backups.filter((b) => b.outcome === "failure").length;
  const dryRunCount = restores.filter((r) => r.outcome === "dry_run").length;

  return (
    <main>
      <div className="hudhud-page-head">
        <div>
          <h1 className="hudhud-page-title">النسخ الاحتياطي والاستعادة</h1>
          <p className="hudhud-page-sub">
            سجل فعلي من backup_record — {successCount} نجاح، {failureCount} فشل
          </p>
        </div>
      </div>

      <section className="hudhud-kpis" aria-label="ملخص النسخ والاستعادة">
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-ok">{successCount}</span>
          <span className="hudhud-kpi-label">نسخ ناجحة</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-bad">{failureCount}</span>
          <span className="hudhud-kpi-label">نسخ فاشلة</span>
        </div>
        <div className="hudhud-kpi">
          <span className="hudhud-kpi-value hudhud-warn">{dryRunCount}</span>
          <span className="hudhud-kpi-label">تجارب استعادة (dry-run)</span>
        </div>
      </section>

      <div className="hudhud-surface hudhud-section">
        <h2 className="hudhud-section-title">التشغيل (من المضيف)</h2>
        <p style={{ margin: "0 0 8px", color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
          نسخة احتياطية: <code className="hudhud-code">HUDHUD_BACKUP_DIR=/backups npm run db:backup</code>
        </p>
        <p style={{ margin: 0, color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
          استعادة (dry-run افتراضيًا؛ --confirm يتطلب موافقة صريحة ونسخة احتياطية حديثة قبلها):
          <code className="hudhud-code">npm run db:restore -- --file hudhud_core_xxx.dump</code>
        </p>
      </div>

      <section className="hudhud-section">
        <h2 className="hudhud-section-title">سجل النسخ الاحتياطي</h2>
        <div className="hudhud-surface" style={{ overflowX: "auto", marginBottom: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                <th style={{ padding: "10px", textAlign: "right" }}>الوقت</th>
                <th style={{ padding: "10px", textAlign: "right" }}>القاعدة</th>
                <th style={{ padding: "10px", textAlign: "right" }}>النتيجة</th>
                <th style={{ padding: "10px", textAlign: "right" }}>الجداول</th>
                <th style={{ padding: "10px", textAlign: "right" }}>الحجم</th>
                <th style={{ padding: "10px", textAlign: "right" }}>الملف</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "16px", color: "var(--hudhud-text-secondary)", textAlign: "center" }}>
                    لا سجلات نسخ بعد — لم تُنفَّذ أي نسخة احتياطية حتى الآن (حالة صادقة، ليست خطأ)
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                    <td style={{ padding: "10px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {new Date(b.createdAt).toISOString()}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <code className="hudhud-code">{b.databaseName}</code>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span
                        className={
                          b.outcome === "success"
                            ? "hudhud-badge hudhud-badge-ok"
                            : "hudhud-badge hudhud-badge-bad"
                        }
                      >
                        {b.outcome === "success" ? "نجاح" : "فشل"}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>{b.tablesCount ?? "—"}</td>
                    <td style={{ padding: "10px" }}>{formatBytes(b.sizeBytes)}</td>
                    <td style={{ padding: "10px", fontSize: "0.75rem" }}>
                      <code className="hudhud-code">{b.fileName ?? "—"}</code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hudhud-section">
        <h2 className="hudhud-section-title">سجل الاستعادة</h2>
        <div className="hudhud-surface" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                <th style={{ padding: "10px", textAlign: "right" }}>الوقت</th>
                <th style={{ padding: "10px", textAlign: "right" }}>القاعدة</th>
                <th style={{ padding: "10px", textAlign: "right" }}>الملف المصدر</th>
                <th style={{ padding: "10px", textAlign: "right" }}>النتيجة</th>
              </tr>
            </thead>
            <tbody>
              {restores.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "16px", color: "var(--hudhud-text-secondary)", textAlign: "center" }}>
                    لا سجلات استعادة بعد — لم تُنفَّذ أي عملية استعادة (حالة صادقة)
                  </td>
                </tr>
              ) : (
                restores.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                    <td style={{ padding: "10px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {new Date(r.createdAt).toISOString()}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <code className="hudhud-code">{r.databaseName}</code>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <code className="hudhud-code">{r.backupFileName}</code>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span
                        className={
                          r.outcome === "success"
                            ? "hudhud-badge hudhud-badge-ok"
                            : r.outcome === "dry_run"
                              ? "hudhud-badge hudhud-badge-info"
                              : "hudhud-badge hudhud-badge-bad"
                        }
                      >
                        {r.outcome === "success" ? "نجاح" : r.outcome === "dry_run" ? "تجربة (dry-run)" : "فشل"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
