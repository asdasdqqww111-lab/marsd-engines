import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth, loadOidcClients } from "@/lib/auth";

/**
 * HUDHUD M-02 — admin settings API (read-only, real source of truth).
 *
 * Fills the gap left by the sidebar link to /admin/settings which previously
 * pointed at a non-existent route. This route reports the ACTUAL runtime
 * configuration state — never mock indicators and never secret values:
 *
 * - identity: whether the OIDC provider plugin is loaded, and how many clients
 *   are provisioned (count only — clientIds/secrets/redirect URIs are never exposed)
 * - providers: which social providers have credentials configured in THIS
 *   environment (configured true/false only — no values)
 * - email: whether the email provider has an API key configured (boolean only)
 *
 * Guard mirrors the C-02 standard: explicit session check inside the route,
 * anonymous -> 401, non-admin -> 403, session verification failure -> 401
 * (never 500, never leak).
 */

export async function GET() {
  // --- Auth check (fail-closed, server-side, mirrors C-02) ---
  let session: { user: { role?: string | null } | null } | null = null;
  try {
    session = (await auth.api.getSession({
      headers: await headers(),
    })) as { user: { role?: string | null } | null } | null;
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // --- Real configuration state from THIS environment (booleans/counts only) ---
  const identityEnabled = process.env.HUDHUD_IDENTITY_ENABLED === "true";
  const oidcClients = identityEnabled ? loadOidcClients() : [];

  const settings = {
    identity: {
      enabled: identityEnabled,
      issuerConfigured: Boolean(process.env.HUDHUD_OIDC_ISSUER),
      clientCount: oidcClients.length,
      // Secrets and client identifiers are never returned — count only.
    },
    providers: {
      github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    email: {
      configured: Boolean(process.env.RESEND_API_KEY),
    },
  };

  return NextResponse.json(settings);
}
