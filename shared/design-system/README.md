# HUDHUD Design System — نظام التصميم الموحد

توكنز ومكونات مشتركة لمنظومة HUDHUD (البوابة + التطبيقات السبعة).

## الاستهلاك

1. انسخ أو استورد `hudhud-tokens.css` في نقطة دخول الأنماط (مثل `app/globals.css`):
   ```css
   @import "../../shared/design-system/hudhud-tokens.css";
   ```
2. أضف `data-hudhud-theme="true"` على عنصر `<html>` لتفعيل الأساس الموحد.
3. استخدم فئات `hudhud-*` للمكونات المشتركة.

## القواعد

- لا تغيير لمعرفات التطبيق التقنية أو أسماء حزمه أو مسارات APIs.
- لا إجبار على إطار عمل واحد؛ التوكنز CSS خالص تعمل مع Tailwind وأي نظام آخر.
- الألوان: خلفية `#0C0E12`، سطوح `#16181D`، تمييز `#F5A623`.
- الخط: IBM Plex Sans Arabic مع RTL كامل وmobile-first.
