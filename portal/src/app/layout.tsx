import type { Metadata } from "next";
import "../../shared/design-system/hudhud-tokens.css";

export const metadata: Metadata = {
  title: "HUDHUD CONTROL — بوابة المنظومة الموحدة",
  description: "بوابة الإدارة المركزية لمنظومة HUDHUD: مراقبة التطبيقات والصحة والأحداث والإعدادات.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-hudhud-theme="true">
      <body>
        <header className="hudhud-surface" style={{ margin: "16px", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={{ fontSize: "1.25rem", color: "var(--hudhud-accent)", margin: 0 }}>هدهد · HUDHUD CONTROL</h1>
          <span style={{ color: "var(--hudhud-text-secondary)", fontSize: "0.875rem" }}>منظومة موحدة · سبعة تطبيقات مستقلة</span>
        </header>
        <main style={{ margin: "0 16px" }}>{children}</main>
      </body>
    </html>
  );
}
