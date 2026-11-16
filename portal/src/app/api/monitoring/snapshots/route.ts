import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appHealthSnapshot } from "@/db/schema";
import { desc, eq, gte, and } from "drizzle-orm";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { HUDHUD_APPS, getApp } from "@/lib/registry";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

export const dynamic = "force-dynamic";

/**
 * تاريخ صحة التطبيقات من app_health_snapshot — بيانات فعلية فقط.
 * المرحلة 3: كل حالة معروضة في CONTROL لها سجل قابل للتحقق.
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
  const rl = rateLimit(`monitoring:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429 },
    );
  }

  // المعاملات: techId اختياري، hours افتراضيًا 24 (حد 168 = أسبوع)
  const { searchParams } = req.nextUrl;
  const techId = searchParams.get("techId");
  const hours = Math.min(Math.max(Number(searchParams.get("hours")) || 24, 1), 168);
  const since = new Date(Date.now() - hours * 3_600_000);

  if (techId && !getApp(techId)) {
    return NextResponse.json({ error: "unknown_app" }, { status: 400 });
  }

  const conditions = [gte(appHealthSnapshot.checkedAt, since)];
  if (techId) conditions.push(eq(appHealthSnapshot.techId, techId));

  const rows = await db
    .select({
      techId: appHealthSnapshot.techId,
      status: appHealthSnapshot.status,
      httpStatus: appHealthSnapshot.httpStatus,
      latencyMs: appHealthSnapshot.latencyMs,
      detail: appHealthSnapshot.detail,
      checkedAt: appHealthSnapshot.checkedAt,
    })
    .from(appHealthSnapshot)
    .where(and(...conditions))
    .orderBy(desc(appHealthSnapshot.checkedAt))
    .limit(500);

  // تجميع لكل تطبيق — من البيانات الفعلية فقط
  const perApp = HUDHUD_APPS.map((app) => {
    const appRows = rows.filter((r) => r.techId === app.techId);
    const total = appRows.length;
    const healthy = appRows.filter((r) => r.status === "healthy").length;
    const degraded = appRows.filter((r) => r.status === "degraded").length;
    const down = appRows.filter((r) => r.status === "down").length;
    const unknown = appRows.filter((r) => r.status === "unknown").length;
    const latencies = appRows
      .map((r) => r.latencyMs)
      .filter((l): l is number => l != null);
    const avgLatencyMs =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null;
    const lastCheckedAt = appRows[0]?.checkedAt ?? null;

    return {
      techId: app.techId,
      brandName: app.brandName,
      total,
      healthy,
      degraded,
      down,
      unknown,
      avgLatencyMs,
      lastCheckedAt,
    };
  });

  return NextResponse.json({
    since: since.toISOString(),
    hours,
    perApp,
    samples: techId
      ? rows.filter((r) => r.techId === techId).slice(0, 100)
      : undefined,
  });
}
