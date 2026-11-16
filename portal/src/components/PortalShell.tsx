"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/SignOutButton";

type NavItem = { href: string; label: string; icon: string };

/*
 * HUDHUD CONTROL — القشرة البصرية الموحدة (الهوية البصرية المرحلة 2)
 *
 * - RTL أصيل + خط IBM Plex Sans Arabic + هوية هدهد (برتقالي فاقع على خلفية ليلية).
 * - شريط جانبي متجاوب: ثابت على سطح المكتب، شريط سفلي على الهواتف.
 * - التنقل هنا للعرض فقط؛ إخفاء الروابط الحقيقية حسب الدور يبقى في كل صفحة
 *   (fail-closed في الخادم — هذه القشرة لا تحمي، بل تعرض).
 */

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    // عرض ساعة حية في الشريط — إشارة تحديث بلا بيانات حساسة.
    const update = () =>
      setNow(
        new Intl.DateTimeFormat("ar", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, []);

  const nav: NavItem[] = [
    { href: "/", label: "لوحة القيادة", icon: "◧" },
    { href: "/monitoring", label: "المراقبة", icon: "◎" },
    { href: "/audit", label: "سجل التدقيق", icon: "≡" },
    { href: "/users", label: "المستخدمون", icon: "☺" },
    { href: "/providers", label: "المزودون", icon: "⛭" },
    { href: "/backup", label: "النسخ الاحتياطي", icon: "▣" },
    { href: "/settings", label: "الإعدادات", icon: "⚙" },
  ];

  return (
    <div className="hudhud-shell">
      <aside className="hudhud-sidebar" aria-label="التنقل الرئيسي">
        <div className="hudhud-brand">
          <span className="hudhud-brand-mark" aria-hidden="true">
            هدهد
          </span>
          <div>
            <div className="hudhud-brand-name">HUDHUD CONTROL</div>
            <div className="hudhud-brand-sub">بوابة المنظومة الموحدة</div>
          </div>
        </div>

        <nav className="hudhud-nav">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={active ? "hudhud-nav-item active" : "hudhud-nav-item"}
              >
                <span className="hudhud-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hudhud-sidebar-foot">v0.4.0 — هوية المرحلة 2</div>
      </aside>

      <div className="hudhud-main-col">
        <header className="hudhud-topbar">
          <div className="hudhud-topbar-title">HUDHUD CONTROL</div>
          <div className="hudhud-topbar-actions">
            <span className="hudhud-clock" suppressHydrationWarning>
              {now || "—:—"}
            </span>
            <SignOutButton />
          </div>
        </header>
        <main className="hudhud-main">{children}</main>
        <footer className="hudhud-footer">
          الحالات المعروضة من مصادر حقيقية — لا مؤشرات وهمية · HUDHUD © 2026
        </footer>
      </div>
    </div>
  );
}
