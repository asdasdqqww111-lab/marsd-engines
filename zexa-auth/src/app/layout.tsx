import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import {
  HUDHUD_DEFAULT_LOCALE,
  dirFor,
} from "@/lib/hudhud-dictionary";

/**
 * HUDHUD D-02 — التعريب الافتراضي للهوية.
 * - lang وdir مشتقان من HUDHUD_LOCALE (الافتراضي ar/rtl — هوية HUDHUD عربية).
 * - IBM Plex Sans Arabic للنصوص العربية مع Inter لاتيني كخلفية — لا كسر
 *   للأخطاط الأصلية؛ الخطان متعايشان.
 * - العنوان والوصف يظهران بهوية HUDHUD.
 */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const locale = HUDHUD_DEFAULT_LOCALE;
const dir = dirFor(locale);

export const metadata: Metadata = {
  title: "هوية هدهد | HUDHUD Identity",
  description:
    "المصادقة وإدارة الحسابات والأدوار لمنظومة هدهد — The identity service of the HUDHUD ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${inter.variable} ${plexArabic.variable} antialiased bg-background`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
