import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { PROVIDER_REQUIREMENTS } from "@/lib/registry";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

export const dynamic = "force-dynamic";

/**
 * حالة مزودي الخدمات — حضور/غياب متغيرات البيئة الفعلية فقط.
 * لا قيم تُعرض أبدًا؛ لا اختبار اتصال من المتصفح (SSRF/تسريب سر).
 * المصدر: ملفات .env.example الفعلية للتطبيقات في المستودع.
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
  const rl = rateLimit(`providers:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429 },
    );
  }

  const providers = PROVIDER_REQUIREMENTS.map((p) => {
    const envs = p.envVars.map((v) => ({
      name: v,
      present: Boolean(process.env[v]),
    }));
    return {
      providerKey: p.providerKey,
      providerName: p.providerName,
      techId: p.techId,
      configured: envs.every((e) => e.present),
      envs,
    };
  });

  return NextResponse.json({ providers });
}
