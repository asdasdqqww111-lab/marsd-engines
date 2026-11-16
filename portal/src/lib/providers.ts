import { z } from "zod";
import { HUDHUD_APPS } from "./registry";

/**
 * إدارة المزودين — طبقة تحقق نقية قابلة للاختبار المباشر.
 *
 * قواعد أمنية:
 * - لا تُخزَّن قيم أي اعتماد أبدًا — يُخزَّن اسم متغير البيئة فقط،
 *   والبوابة تعرض حضوره/غيابه (Boolean) لا قيمته.
 * - المعرّف التقني يجب أن يكون من سجل التطبيقات الرسمي (لا اختراع).
 */

const ENV_VAR_NAME = /^[A-Z][A-Z0-9_]*$/;
const PROVIDER_KEY = /^[a-z0-9][a-z0-9._-]*$/;

export const PROVIDER_INPUT_SCHEMA = z.object({
  techId: z.string().min(1).max(64),
  providerKey: z.string().min(2).max(64).regex(PROVIDER_KEY, "invalid_provider_key"),
  displayName: z.string().min(1).max(120),
  credentialEnvVar: z
    .union([z.literal(""), z.string().max(120).regex(ENV_VAR_NAME)])
    .optional(),
  notes: z.union([z.literal(""), z.string().max(500)]).optional(),
});

export interface ProviderInput {
  techId: string;
  providerKey: string;
  displayName: string;
  credentialEnvVar: string | null;
  notes: string | null;
}

export type ProviderValidation =
  | { ok: true; value: ProviderInput }
  | { ok: false; error: string };

export function validateProviderInput(raw: unknown): ProviderValidation {
  const parsed = PROVIDER_INPUT_SCHEMA.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.path.join(".") || "invalid_payload",
    };
  }

  if (!HUDHUD_APPS.some((a) => a.techId === parsed.data.techId)) {
    return { ok: false, error: "unknown_techId" };
  }

  return {
    ok: true,
    value: {
      techId: parsed.data.techId,
      providerKey: parsed.data.providerKey,
      displayName: parsed.data.displayName,
      credentialEnvVar: parsed.data.credentialEnvVar || null,
      notes: parsed.data.notes || null,
    },
  };
}
