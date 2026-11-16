import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * HUDHUD M-04 — زر عودة موحد إلى CONTROL (البوابة).
 *
 * سلوك صادق: عندما HUDHUD_CONTROL_URL غير مضبوط في البيئة، لا يُعرض
 * العنصر إطلاقًا — لا افتراض عنوان ولا رابط مكسور. عندما يضبطه المشغّل،
 * يظهر زر "عودة إلى CONTROL" في تخطيط الإدارة.
 *
 * هذا المكوّن خادمي (Server Component): العنوان يُقرأ من البيئة على
 * الخادم ولا يُمرَّر للعميل عبر props قابلة للتلاعب.
 */
export function ControlReturnLink({
  className,
  label = "عودة إلى CONTROL",
}: {
  className?: string;
  label?: string;
}) {
  const controlUrl = process.env.HUDHUD_CONTROL_URL;

  if (!controlUrl) {
    return null; // غير مضبوط → لا رابط مبتدع (سلوك صادق).
  }

  return (
    <Link
      href={controlUrl}
      className={
        className ??
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }
      aria-label={label}
    >
      <ArrowRight className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Link>
  );
}
