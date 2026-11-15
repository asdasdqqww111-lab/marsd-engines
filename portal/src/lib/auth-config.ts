import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * مصادقة HUDHUD CONTROL الإدارية.
 *
 * المبادئ:
 * - قاعدة hudhud_core فقط (عزل صارم عن قواعد التطبيقات).
 * - دور admin واحد يملك كل شيء (defaultRole user، adminRoles admin).
 * - لا بريد إلزامي للتحقق في المرحلة 1 (المشغل ينشئ الحساب عبر seed).
 * - لا OAuth اجتماعي في المرحلة 1 (المرحلة 4 ستضيف OIDC عبر zexa).
 * - rate limiting مدمج لكل IP على مسارات المصادقة.
 */

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Portal operators are seeded, not self-registered.
    disableSignUp: true,
    requireEmailVerification: false,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  session: {
    expiresIn: 60 * 60 * 8, // 8 hours
    updateAge: 60 * 60, // refresh every hour
  },
  plugins: [
    nextCookies(),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});
