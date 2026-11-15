import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * حماية مسارات البوابة (Next 16 proxy.ts — بديل middleware الرسمي).
 *
 * القواعد:
 * - /login و /api/auth و /api/health مسارات عامة.
 * - كل ما عدا ذلك يتطلب جلسة إدارية صالحة.
 * - لا redirect مفتوح: الوجهة دائمًا /login الثابتة.
 * 
 * ملاحظة: التحقق الفعلي من صلاحية الجلسة يتم في الصفحات/الـ routes
 * عبر auth.api.getSession (حماية دفاعية ثنائية الطبقة).
 */

const PUBLIC_PATHS = /^\/($|login|api\/auth|api\/health)(\/.*)?$/;

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.test(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
