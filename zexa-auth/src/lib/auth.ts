import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { betterAuth } from "better-auth";
import { admin, jwt, oidcProvider } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

/**
 * HUDHUD Identity — Phase A (opt-in, staging first)
 *
 * Adds an OIDC provider (authorization code + PKCE) and JWKS to zexa-auth so it can act
 * as the central identity authority for the HUDHUD ecosystem, WITHOUT forcing SSO:
 *
 * - When HUDHUD_IDENTITY_ENABLED is not "true", no OIDC plugin is loaded and zexa-auth
 *   behaves exactly as before (local sessions, social login, admin).
 * - OIDC clients are provisioned exclusively from the HUDHUD_OIDC_CLIENTS environment
 *   variable — never hardcoded. No client secrets are ever stored in this repository.
 * - Production activation requires a separate explicit approval (see
 *   docs/HUDHUD-IDENTITY-EVALUATION-2026-11-16.md).
 */

const identityEnabled = process.env.HUDHUD_IDENTITY_ENABLED === "true";
const issuerUrl = process.env.HUDHUD_OIDC_ISSUER ?? "";

type OidcClient = {
  clientId: string;
  clientSecret: string;
  redirectURIs: string[];
  metadata?: Record<string, unknown>;
};

/**
 * HUDHUD_OIDC_CLIENTS format (JSON array):
 * [{"clientId":"...","clientSecret":"...","redirectURIs":["https://app.example/callback"],"metadata":{...}}]
 *
 * Values come from the operator's secret store; the environment is the only source.
 *
 * Exported (HUDHUD M-02) so the admin settings screen can report the client count
 * from the exact same source the runtime loads — never the contents, only the count.
 */
export function loadOidcClients(): OidcClient[] {
  const raw = process.env.HUDHUD_OIDC_CLIENTS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is OidcClient =>
        typeof c?.clientId === "string" &&
        typeof c?.clientSecret === "string" &&
        Array.isArray(c?.redirectURIs) &&
        c.redirectURIs.every((u) => typeof u === "string")
    );
  } catch {
    // Malformed configuration must fail loudly in logs, but never leak secrets.
    console.error(
      "[hudhud-identity] HUDHUD_OIDC_CLIENTS is not valid JSON — OIDC clients not loaded"
    );
    return [];
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.user,
    },
  }),
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    nextCookies(),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    ...(identityEnabled
      ? [
          // OIDC endpoints live under /api/oidc/* (discovery, authorize, token, userinfo, revocation)
          oidcProvider({
            issuer: issuerUrl,
            clients: loadOidcClients(),
          }),
          // JWKS at /api/oidc/jwks for token verification by relying parties
          jwt({
            jwks: {
              keyGenerationConfig: {
                // RS256 per Better Auth docs; crv is required by the type but unused for RSA
                alg: "RS256",
                crv: "P-256",
              },
            },
          }),
        ]
      : []),
  ],
});
