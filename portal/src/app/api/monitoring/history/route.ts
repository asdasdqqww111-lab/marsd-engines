import { NextRequest, NextResponse } from "next/server";
import { desc, eq, gte, and, type SQL } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appHealthSnapshot } from "@/db/schema";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

export const dynamic = "force-dynamic";

/**
 * سجل الأحداث المهمة لصحة التطبيقات — المرحلة 4 (رصد).
 *
 * بيانات فعلية فقط من app_health_snapshot:
 * - آخر 3 لقطات لكل تطبيق (سجل زمني قابل للتحقق).
 * - إجمالي اللقطات والفحوص المتوقعة خلال النافذة — لا تقدير وهمي.
 *
 * الجلسة + monitoring.view + rate limit — نفس نمط مسارات البوابة.
 */

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const role = normalizeRole(
    (session.user as { portalRole?: string | null }).portalRole,
  );
  if (!hasPermission(role, "monitoring.view")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = await clientIp();
  const rl = rateLimit(`health-history:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429 },
    );
  }

  const hours = Math.min(Math.max(Number(req.nextUrl.searchParams.get("hours")) || 24, 1), 168);
  const since = new Date(Date.now() - hours * 3_600_000);

  const conditions: SQL[] = [gte(appHealthSnapshot.checkedAt, since)];
  const techId = req.nextUrl.searchParams.get("techId");
  if (techId) {
    conditions.push(eq(appHealthSnapshot.techId, techId));
  }

  const rows = await db
    .select()
    .from(appHealthSnapshot)
    .where(and(...conditions))
    .orderBy(desc(appHealthSnapshot.checkedAt))
    .limit(500);

  // آخر 3 لقطات لكل تطبيق — سجل زمني فعلي، لا تقدير.
  const latest3PerApp = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = latest3PerApp.get(row.techId) ?? [];
    if (list.length < 3) {
      list.push(row);
      latest3PerApp.set(row.techId, list);
    }
  }

  const events = Array.from(latest3PerApp.entries()).flatMap(([id, snaps]) =>
    snaps.map((s) => ({
      techId: id,
      status: s.status,
      httpStatus: s.httpStatus,
      latencyMs: s.latencyMs,
      checkedAt: s.checkedAt,
      detail: s.detail,
    })),
  );

  return NextResponse.json({
    since: since.toISOString(),
    hours,
    totalSnapshots: rows.length,
    events,
  });
}
