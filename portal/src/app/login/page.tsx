"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        setError(error.message ?? "Login failed");
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={onSubmit}
        className="hudhud-surface"
        style={{ width: "100%", maxWidth: "400px", display: "grid", gap: "16px" }}
      >
        <h1 style={{ margin: 0, color: "var(--hudhud-accent)", textAlign: "center" }}>
          هدهد · HUDHUD CONTROL
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--hudhud-text-secondary)",
            textAlign: "center",
            fontSize: "0.875rem",
          }}
        >
          بوابة الإدارة المركزية — الدخول للمشغلين المصرح لهم فقط
        </p>
        <label style={{ display: "grid", gap: "6px", fontSize: "0.875rem" }}>
          البريد الإلكتروني
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              background: "var(--hudhud-surface-2)",
              color: "var(--hudhud-text-primary)",
              border: "1px solid var(--hudhud-border)",
              borderRadius: "var(--hudhud-radius-sm)",
              padding: "10px 12px",
            }}
          />
        </label>
        <label style={{ display: "grid", gap: "6px", fontSize: "0.875rem" }}>
          كلمة المرور
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              background: "var(--hudhud-surface-2)",
              color: "var(--hudhud-text-primary)",
              border: "1px solid var(--hudhud-border)",
              borderRadius: "var(--hudhud-radius-sm)",
              padding: "10px 12px",
            }}
          />
        </label>
        {error ? (
          <p
            role="alert"
            style={{ color: "var(--hudhud-danger)", margin: 0, fontSize: "0.875rem" }}
          >
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="hudhud-btn-primary"
          style={{ width: "100%" }}
        >
          {pending ? "جارٍ الدخول…" : "دخول"}
        </button>
      </form>
    </main>
  );
}
