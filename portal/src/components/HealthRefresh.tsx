"use client";

import { useEffect, useState } from "react";

// Polls the session-guarded health endpoint. No URLs leak to the client.

export function HealthRefresh() {
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;

    async function load() {
      try {
        const res = await fetch("/api/health/apps");
        if (res.status === 401) return;
        if (!res.ok) throw new Error(String(res.status));
      } catch (e) {
        if (!cancel) setErr((e as Error).message);
      }
    }

    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancel = true;
      clearInterval(t);
    };
  }, []);

  if (err) return <p className="hudhud-status-error">فشل تحديث الحالة ({err})</p>;
  return null;
}
