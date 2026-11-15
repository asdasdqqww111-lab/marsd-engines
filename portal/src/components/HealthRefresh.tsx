"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

// Small client component that refreshes health data periodically.
// The fetch target is session-guarded by the server; no URLs leak here.

export function HealthRefresh() {
  const [data, setData] = useState<{
    apps: Array<{ techId: string; status: string; latencyMs: number | null }>;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const res = await fetch("/api/health/apps");
        if (res.status === 401) return;
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        if (!cancel) setData(json);
      } catch (e) {
        if (!cancel) setErr((e as Error).message);
      }
    }
    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancel = true;
      clearInterval(t);
    }
  }, []);

  if (err) return <p className="hudhud-status-error">فشل تحديث الحالة ({err})</p>;
  if (!data) return <p className="hudhud-status-loading">جارٍ الفحص…</p>;
  return null;
}
