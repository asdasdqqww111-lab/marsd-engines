import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HUDHUD_DICT, t } from "@/lib/hudhud-dictionary";

/**
 * HUDHUD M-04 + D-03 — زر عودة موحد إلى CONTROL (البوابة)، معرب من القاموس.
 *
 * سلوك صادق: عندما HUDHUD_CONTROL_URL غير مضبوط، لا يُعرض العنصر إطلاقًا.
 */
export function ControlReturnLink({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const controlUrl = process.env.HUDHUD_CONTROL_URL;

  if (!controlUrl) {
    return null; // غير مضبوط → لا رابط مبتدع (سلوك صادق).
  }

  const text = label ?? t(HUDHUD_DICT.admin.backToControl);

  return (
    <Link
      href={controlUrl}
      className={
        className ??
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }
      aria-label={text}
    >
      {/* في RTL يشير السهم لليمين (اتجاه العودة)، وفي LTR يعكسه تلقائيًا عبر flip */}
      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
      <span>{text}</span>
    </Link>
  );
}
