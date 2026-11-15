import { headers } from "next/headers";

/**
 * استخراج IP للعميل من رؤوس موثوقة فقط.
 *
 * مصدر الحقيقة هو الرأس الذي يضبطه الـ edge الخاص بنا (لا ما يكتبه العميل).
 * آخر إدخال في x-forwarded-for هو الذي أضفناه نحن (وليس أول إدخال
 * يتحكم به العميل) — نفس منطق osiris-map/getClientIp المُثبت.
 */

export function getClientIpFromHeaders(h: Headers): string {
  const get = (name: string) => h.get(name)?.trim() || "";

  const platform =
    get("cf-connecting-ip") ||
    get("x-vercel-forwarded-for") ||
    get("true-client-ip");
  if (platform && isIpLike(platform)) return platform;

  const real = get("x-real-ip");
  if (real && isIpLike(real)) return real;

  const chain = get("x-forwarded-for")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const nearest = chain[chain.length - 1];
  if (nearest && isIpLike(nearest)) return nearest;

  return "unknown";
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return getClientIpFromHeaders(h);
}

function isIpLike(value: string): boolean {
  if (!value) return false;
  const bare = value.startsWith("[") ? value.slice(1, value.indexOf("]")) : value;
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(bare) || /^[0-9a-f:]+$/i.test(bare);
}
