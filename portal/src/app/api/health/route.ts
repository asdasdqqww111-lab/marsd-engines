import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * ليفينس صادق: يستجيب فقط إذا كانت عملية البوابة حية.
 * لا يدّعي صحة أي تطبيق (تلك مسؤولية /api/health/apps المحمية).
 */
export function GET() {
  return NextResponse.json({
    status: "serving",
    scope: "process",
    component: "hudhud-portal",
    timestamp: new Date().toISOString(),
  });
}
