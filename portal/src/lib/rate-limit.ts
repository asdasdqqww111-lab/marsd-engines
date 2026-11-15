/**
 * حد معدل بسيط في الذاكرة لحماية مسارات البوابة الحساسة.
 *
 * ملاحظة تصميمية: في نشر متعدد النسخ يجب استخدام مخزن مشترك
 * (Redis) بدلًا من الذاكرة؛ المرحلة 7 تراجع ذلك عند نشر الإنتاج.
 * هذه الطبقة تحمي النسخة الواحدة وتُبقي البوابة مستقلة عن خدمات إضافية.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();
const MAX_KEYS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_KEYS * 0.9) return;
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
  };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, retryAfterSec: 0 };
}
