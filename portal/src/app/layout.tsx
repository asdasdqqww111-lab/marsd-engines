import type { Metadata } from "next";
import "../styles/hudhud-tokens.css";

export const metadata: Metadata = {
  title: "HUDHUD CONTROL",
  description: "Central management portal for the HUDHUD ecosystem",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-hudhud-theme="true">
      <body>{children}</body>
    </html>
  );
}
