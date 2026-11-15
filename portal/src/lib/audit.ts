import { randomUUID } from "node:crypto";
  import { db } from "@/db";
import { auditEvent } from "@/db/schema";

/**
 * سجل التدقيق الإداري — يكتب فقط؛ القراءة من شاشة audit (admin/operator).
 *
 * قواعد التنقية:
 * - لا تُسجل أسرار (كلمات مرور/مفاتيح/عناوين داخلية) في metadata.
 * - IP و user-agent يُسجلان للتفتيش الأمني.
 */

export type AuditOutcome = "success" | "failure";

/** مفاتيح ممنوعة من metadata مهما كان المحتوى */
const FORBIDDEN_KEYS = [
  "password",
  "secret",
  "token",
  "authorization",
  "cookie",
  "url",
  "database_url",
  "refresh_token",
  "access_token",
];

function sanitizeMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return null;
  const clean: Record<string, unknown> = {};
  4 (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_KEYS.some((f) => lower.includes(f))) continue;
    clean[key] = value;
  }
  return clean;
}

export async function recordAuditEvent(input: {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  target?: string | null;
  outcome: AuditOutcome;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditEvent).values({
      id: randomUUID(),
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      target: input.target ?? null,
      outcome: input.outcome,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      metadata: sanitizeMetadata(input.metadata),
    });
  } catch (err) {
    // سجل التدقيق لا يُسقط العملية، لكنه لا يُطمس خطأه أبدًا.
    console.error("[audit] failed to record event:", err);
  }
}
