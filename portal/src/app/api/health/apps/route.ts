import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { checkAppHealth } from "@/lib/health";
import { HUDHUD_APPS, type AppStatus } from "@/lib/registry";
import { recordAuditEvent } from "@/lib/audit";
import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/db";
import { appHealthSnapshot } from "@/db/schema";

export const dynamic = "force-dynamic";

// Health check for all seven apps. Session-guarded + rate-limited.
// M-08: five-state model — status column is free text, no migration needed
// (healthy | degraded | starting | down | unknown — see src/lib/registry.ts).
// Results are persisted as append-only snapshots (app_health_snapshot)
// so history is verifiable from real data, not fabricated.
// Never returns application URLs to the client.

const MAX_PER_WINDOW = 10;
const WINDOW_MS = 60_000;

const STATUS_KEYS: AppStatus[] = ["healthy", "degraded", "starting", "down", "unknown"];

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ip = await clientIp();
  const rl = rateLimit(`health:${ip}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429 },
    );
  }

  const results = await Promise.all(
    HUDHUD_APPS.map(async (app) => {
      const baseUrl = process.env[app.baseUrlEnv];
      return checkAppHealth(app.techId, baseUrl, app.healthPath);
    }),
  );

  // Persist snapshots — insert-only by design; failures never block the response.
  try {
    await db.insert(appHealthSnapshot).values(
      results.map((r) => ({
        id: randomUUID(),
        techId: r.techId,
        status: r.status,
        httpStatus: r.httpStatus,
        latencyMs: r.latencyMs,
        detail: r.detail,
      })),
    );
  } catch (err) {
    console.error("[health] snapshot persistence failed:", err);
  }

  // Five-state counts for audit metadata (M-08)
  const counts: Record<AppStatus, number> = {
    healthy: 0,
    degraded: 0,
    starting: 0,
    down: 0,
    unknown: 0,
  };
  for (const r of results) {
    counts[r.status] += 1;
  }

  await recordAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "health.check_all",
    target: "portal",
    outcome: "success",
    ip,
    userAgent: req.headers.get("user-agent") ?? null,
    metadata: Object.fromEntries(
      STATUS_KEYS.map((k) => [k, counts[k]]),
    ),
  });

  const safe = results.map((r) => ({
    techId: r.techId,
    status: r.status,
    httpStatus: r.httpStatus,
    latencyMs: r.latencyMs,
    checkedAt: r.checkedAt,
    detail: r.detail,
  }));

  return NextResponse.json({ checkedAt: new Date().toISOString(), apps: safe });
}
