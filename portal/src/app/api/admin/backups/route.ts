import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { backupRecord } from "@/db/schema";
import { desc } from "drizzle-orm";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { recordAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * عرض سجل النسخ الاحتياطي الفعلي من backup_record — قراءة فقط.
 * النسخ نفسها تُنفّذ عبر سكربت CLI (scripts/backup-core.ts) على المضيف؛
 * البوابة تعرض السجل الصادق ولا تنفّذ عمليات نسخ من المتصفح.
 */

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const role = normalizeRole(
    (session.user as { portalRole?: string | null }).portalRole,
  );
  if (!hasPermission(role, "settings.manage")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = await clientIp();
  const rl = rateLimit(`backups:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429 },
    );
  }

  const rows = await db
    .select()
    .from(backupRecord)
    .orderBy(desc(backupRecord.createdAt))
    .limit(50);

  await recordAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "backup.history_view",
    target: "hudhud_core",
    outcome: "success",
    ip,
    userAgent: req.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({
    backups: rows.map((r) => ({
      id: r.id,
      databaseName: r.databaseName,
      trigger: r.trigger,
      outcome: r.outcome,
      tablesCount: r.tablesCount,
      sizeBytes: r.sizeBytes,
      fileName: r.fileName,
      errorDetail: r.errorDetail,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      createdAt: r.createdAt,
    })),
  });
}
