"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * تغيير دور مشغّل بوابة — POST إلى /api/admin/users (PATCH).
 * لا يعرض أي أسرار؛ الاستجابة إما نجاح أو خطأ مرمّز.
 */

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير",
  operator: "مشغّل",
  viewer: "مشاهد",
};

export function UserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(nextRole: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, portalRole: nextRole }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? String(res.status));
      }
      setRole(nextRole);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setRole(currentRole);
    } finally {
      setPending(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <select
        value={role}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "var(--hudhud-surface-2)",
          color: "var(--hudhud-text-primary)",
          border: "1px solid var(--hudhud-border)",
          borderRadius: "var(--hudhud-radius-sm)",
          padding: "4px 8px",
        }}
      >
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {pending ? (
        <span style={{ color: "var(--hudhud-info)", fontSize: "0.8rem" }}>جارٍ الحفظ…</span>
      ) : null}
      {error ? (
        <span style={{ color: "var(--hudhud-danger)", fontSize: "0.8rem" }} role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}