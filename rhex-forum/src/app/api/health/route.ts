import { NextResponse } from "next/server"

/**
 * HUDHUD health contract — rhex-forum (loki-verify contract sibling).
 * Liveness only: no auth, no session, no database touches.
 * Response body carries techId for external verification.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    techId: "rhex-forum",
    app: "HUDHUD Community",
    timestamp: new Date().toISOString(),
  })
}
