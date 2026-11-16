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
        setError(error.message ?? "فشل تسجيل الدخول");
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("فشل تسجيل الدخول");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="hudhud-login-wrap">
      <form onSubmit={onSubmit} className="hudhud-surface hudhud-login-card">
        <div className="hudhud-login-brand">
          <span className="hudhud-brand-mark" aria-hidden="true">
            هدهد
          </span>
          <h1 className="hudhud-login-title">HUDHUD CONTROL</h1>
          <p className="hudhud-login-sub">
            بوابة الإدارة المركزية — الدخول للمشغلين المصرح لهم فقط
          </p>
        </div>

        <label className="hudhud-field">
          البريد الإلكتروني
          <input
            type="email"
            required
            autoComplete="email"
            className="hudhud-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="hudhud-field">
          كلمة المرور
          <input
            type="password"
            required
            autoComplete="current-password"
            className="hudhud-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? (
          <p role="alert" className="hudhud-login-error">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="hudhud-btn-primary hudhud-login-btn"
        >
          {pending ? "جارٍ الدخول…" : "دخول"}
        </button>
      </form>
    </main>
  );
}
