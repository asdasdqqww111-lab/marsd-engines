import type { Metadata } from "next";
import "../styles/hudhud-tokens.css";
import "../styles/hudhud-shell.css";
import { PortalShell } from "@/components/PortalShell";

export const metadata: Metadata = {
  title: "HUDHUD CONTROL",
  description: "Central management portal for the HUDHUD ecosystem",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-hudhud-theme="true">
      <body>
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
