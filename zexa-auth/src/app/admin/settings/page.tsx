import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth, loadOidcClients } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings | Admin Dashboard",
  description: "Runtime configuration status of the HUDHUD Identity service",
};

/**
 * HUDHUD M-02 — admin settings screen (read-only, real state).
 *
 * Previously the admin sidebar linked to /admin/settings which did not exist.
 * This page reports the ACTUAL runtime configuration — read directly from the
 * same sources the running service uses (env + the same loadOidcClients the
 * auth config loads). No mock indicators, no secret values: every row is a
 * boolean/count derived from the real environment.
 *
 * The page itself is protected by the admin layout guard (admin layout already
 * requires session + admin role server-side, C-02 standard), and the data it
 * renders contains nothing privileged — only configured/not-configured states.
 */

function StatusBadge({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <Badge variant={on ? "default" : "secondary"}>
      {on ? onLabel : offLabel}
    </Badge>
  );
}

function SettingRow({
  label,
  description,
  badge,
}: {
  label: string;
  description: string;
  badge: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      {badge}
    </div>
  );
}

export default async function AdminSettingsPage() {
  // Real state from the running environment — same sources the service uses.
  const identityEnabled = process.env.HUDHUD_IDENTITY_ENABLED === "true";
  const oidcClients = identityEnabled ? loadOidcClients() : [];
  const issuerConfigured = Boolean(process.env.HUDHUD_OIDC_ISSUER);
  const githubConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);

  // Session count is a real, verifiable database fact — no secrets in it.
  let activeSessionCount = 0;
  let sessionCountError = false;
  try {
    const { db } = await import("@/db");
    const sessions = await db.query.session.findMany({ columns: { id: true } });
    activeSessionCount = sessions.length;
  } catch {
    sessionCountError = true;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Runtime configuration status — read directly from this environment. Values shown are
          states only (configured / not configured); secrets are never displayed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>HUDHUD Identity (OIDC provider)</CardTitle>
          <CardDescription>
            Central identity authority for the HUDHUD ecosystem. Opt-in; disabled services keep
            their local authentication unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <SettingRow
            label="Identity provider"
            description={
              identityEnabled
                ? "The OIDC provider plugin is loaded in this environment (staging opt-in)."
                : "HUDHUD_IDENTITY_ENABLED is not set to true — the service runs with local sessions only, exactly as before."
            }
            badge={
              <StatusBadge
                on={identityEnabled}
                onLabel="Enabled (opt-in)"
                offLabel="Disabled (default)"
              />
            }
          />
          <SettingRow
            label="OIDC issuer URL"
            description={
              issuerConfigured
                ? "HUDHUD_OIDC_ISSUER is set in this environment."
                : "HUDHUD_OIDC_ISSUER is not set. Required before enabling the provider."
            }
            badge={
              <StatusBadge on={issuerConfigured} onLabel="Configured" offLabel="Not configured" />
            }
          />
          <SettingRow
            label="OIDC clients"
            description={
              identityEnabled
                ? `${oidcClients.length} client${oidcClients.length === 1 ? "" : "s"} provisioned from HUDHUD_OIDC_CLIENTS. Client identifiers are not displayed.`
                : "Not applicable while the identity provider is disabled."
            }
            badge={
              <Badge variant="outline">
                {identityEnabled ? `${oidcClients.length} configured` : "N/A"}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social providers</CardTitle>
          <CardDescription>
            Whether provider credentials are present in this environment (state only, never values).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <SettingRow
            label="GitHub"
            description="GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET configured."
            badge={
              <StatusBadge on={githubConfigured} onLabel="Configured" offLabel="Not configured" />
            }
          />
          <SettingRow
            label="Google"
            description="GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET configured."
            badge={
              <StatusBadge on={googleConfigured} onLabel="Configured" offLabel="Not configured" />
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>
            Transactional email provider used for verification and password resets.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <SettingRow
            label="Resend"
            description="RESEND_API_KEY configured in this environment."
            badge={
              <StatusBadge on={emailConfigured} onLabel="Configured" offLabel="Not configured" />
            }
          />
          <SettingRow
            label="Active sessions"
            description={
              sessionCountError
                ? "Could not read the session table — check the database connection."
                : "Total rows in the session table of this environment (real count)."
            }
            badge={
              sessionCountError ? (
                <Badge variant="destructive">Error</Badge>
              ) : (
                <Badge variant="outline">{activeSessionCount}</Badge>
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
