import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAppHealth } from "@/lib/health";
import { HUDHUD_APPS } from "@/lib/registry";
import { recordAuditEvent } from "@/lib/audit";
import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Health check for all seven apps. Session-guarded + rate-limited.
// Never returns application URLs to the client.

const MAX_PER_WINDOW = 10;
const WINDOW_MS = 60_000;

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

  await recordAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "health.check_all",
    target: "portal",
    outcome: "success",
    ip,
    userAgent: req.headers.get("user-agent") ?? null,
    metadata: {
      healthy: results.filter((r) => r.status === "healthy").length,
      degraded: results.filter((r) => r.status === "degraded").length,
      down: results.filter((r) => r.status === "down").length,
      unknown: results.filter((r) => r.status === "unknown").length,
    },
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
