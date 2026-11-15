"use client";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  return (
    <button
      onClick={() => authClient.signOut()}
      style={{
        background: "transparent",
        border: "1px solid var(--hudhud-border)",
        color: "var(--hudhud-text-secondary)",
        borderRadius: "var(--hudhud-radius-sm)",
        padding: "6px 14px",
        fontSize: "0.85rem",
        cursor: "pointer",
      }}
    >
      خروج
    </button>
  );
}
