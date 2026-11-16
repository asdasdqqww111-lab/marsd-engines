import { NextResponse } from "next/server";

/**
 * HUDHUD health contract — zexa-auth (HUDHUD Identity).
 * Liveness only: no auth, no session, no database touches.
 * proxy.ts must keep this path public so health checks never fail on auth.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    techId: "zexa-auth",
    app: "HUDHUD Identity",
    timestamp: new Date().toISOString(),
  });
}
