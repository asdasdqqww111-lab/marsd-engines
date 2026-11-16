import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { backupRecord, restoreRecord } from "@/db/schema";
import { desc } from "drizzle-orm";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { SignOutButton } from "@/components/SignOutButton";

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
            النسخ الاحتياطي والاستعادة
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
            سجل فعلي من backup_record — {successCount} نجاح، {failureCount} فشل
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="hudhud-surface" style={{ marginBottom: "24px", padding: "16px" }}>
        <h2 style={{ fontSize: "1.05rem", margin: "0 0 8px" }}>التشغيل (من المضيف)</h2>
        <p style={{ margin: "0 0 8px", color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
          نسخة احتياطية:
          <code
            style={{
              fontFamily: "var(--hudhud-font-mono)",
              background: "var(--hudhud-surface-2)",
              padding: "2px 6px",
              borderRadius: "4px",
              margin: "0 6px",
              direction: "ltr",
              display: "inline-block",
            }}
          >
            HUDHUD_BACKUP_DIR=/backups npm run db:backup
          </code>
        </p>
        <p style={{ margin: 0, color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
          استعادة (dry-run افتراضيًا؛ --confirm يتطلب موافقة صريحة ونسخة احتياطية حديثة قبلها):
          <code
            style={{
              fontFamily: "var(--hudhud-font-mono)",
              background: "var(--hudhud-surface-2)",
              padding: "2px 6px",
              borderRadius: "4px",
              margin: "0 6px",
              direction: "ltr",
              display: "inline-block",
            }}
          >
            npm run db:restore -- --file hudhud_core_xxx.dump
          </code>
        </p>
      </div>

      <h2 style={{ fontSize: "1.05rem", marginBottom: "12px" }}>سجل النسخ الاحتياطي</h2>
      <div className="hudhud-surface" style={{ overflowX: "auto", marginBottom: "32px" }}>
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
                  <td style={{ padding: "10px", fontFamily: "var(--hudhud-font-mono)", fontSize: "0.8rem" }}>
                    {b.databaseName}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      color: b.outcome === "success" ? "var(--hudhud-success)" : "var(--hudhud-danger)",
                      fontWeight: 600,
                    }}
                  >
                    {b.outcome === "success" ? "نجاح" : "فشل"}
                  </td>
                  <td style={{ padding: "10px" }}>{b.tablesCount ?? "—"}</td>
                  <td style={{ padding: "10px" }}>{formatBytes(b.sizeBytes)}</td>
                  <td
                    style={{
                      padding: "10px",
                      fontFamily: "var(--hudhud-font-mono)",
                      fontSize: "0.75rem",
                      direction: "ltr",
                    }}
                  >
                    {b.fileName ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "1.05rem", marginBottom: "12px" }}>سجل الاستعادة</h2>
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
                  <td style={{ padding: "10px", fontFamily: "var(--hudhud-font-mono)", fontSize: "0.8rem" }}>
                    {r.databaseName}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      fontFamily: "var(--hudhud-font-mono)",
                      fontSize: "0.75rem",
                      direction: "ltr",
                    }}
                  >
                    {r.backupFileName}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      fontWeight: 600,
                      color:
                        r.outcome === "success"
                          ? "var(--hudhud-success)"
                          : r.outcome === "dry_run"
                            ? "var(--hudhud-info)"
                            : "var(--hudhud-danger)",
                    }}
                  >
                    {r.outcome === "success" ? "نجاح" : r.outcome === "dry_run" ? "تجربة (dry-run)" : "فشل"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
