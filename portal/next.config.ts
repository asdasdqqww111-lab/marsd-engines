import type { NextConfig } from "next";

/**
 * HUDHUD CONTROL — next.config.ts
 *
 * القواعد:
 * - لا iframes للبوابة (frame-ancestors none + X-Frame-Options DENY).
 * - CSP صارمة من دون unsafe-eval; الخطوط تُستضاف ذاتيًا ضمن origin
 *   (المرحلة 2 ستضيف ملفات الخط عبر @hudhud/design).
 * - فشل البوابة لا يعطل التطبيقات: هي مراقِب فقط عبر HTTP من الخادم.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self'"
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
