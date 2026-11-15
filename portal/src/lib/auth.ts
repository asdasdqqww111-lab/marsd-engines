import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * مصادقة HUDHUD CONTROL الإدارية — hudhud_core فقط.
 *
 * - التسجيل الذاتي معطّل: المشغل يزرع حساب admin عبر seed (المرحلة 1)
 *   ثم يدير الباقي عبر admin plugin.
 * - لا OAuth في المرحلة 1؛ المرحلة 4 تضيف OIDC عبر zexa.
 * - جلسات 8 ساعات مع تحديث كل ساعة، تسجيل IP/UA للتفتيش.
 * - حد معدل مدمج على مسارات المصادقة (20/دقيقة لكل IP).
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
    disableSignUp: true,
    requireEmailVerification: false,
  },
  rateLimit: {
    enabled: true,
    window:  "60",
    max: 20,
  },
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  plugins: [
    nextCookies(),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});
