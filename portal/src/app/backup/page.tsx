import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { backupRecord } from "@/db/schema";
import { desc } from "drizzle-orm";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

/**
 * صفحة النسخ الاحتياطي والاستعادة — سجل فعلية من backup_record.
 * النسخ تُنفّذ عبر CLI (scripts/backup-core.ts)؛ الاستعادة عملية هادمة
 * تتطلب موافقة صريحة وتُنفّذ من المضيف مباشرة.
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
        <h2 style={{ fontSize: "1.05rem", margin: "0 0 8px" }}>التشغيل</h2>
        <p style={{ margin: 0, color: "var(--hudhud-text-secondary)", fontSize: "0.85rem" }}>
          النسخ الاحتياطي يُنفَّذ من المضيف عبر:
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
          الاستعادة عملية هادمة تتطلب موافقة صريحة موثقة قبل التنفيذ.
        </p>
      </div>

      <div className="hudhud-surface" style={{ overflowX: "auto" }}>
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
    </main>
  );
}
