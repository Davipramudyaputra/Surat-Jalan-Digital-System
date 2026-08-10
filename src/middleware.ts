import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isRoot = request.nextUrl.pathname === "/";

  // Note: we can't reliably read DB in Edge middleware without Prisma Edge Client.
  // Instead, we just check if the session cookie exists.
  // Full verification happens in Server Components / Actions.
  const hasSession = request.cookies.has("surat_jalan_session");

  if (isRoot) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Selalu izinkan /login. Cookie yang kedaluwarsa atau telah dicabut tidak
  // boleh menyebabkan loop /login -> /dashboard -> /login.
  if (!isLoginPage && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - brand (public brand assets needed by internal PDF renderer)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|render|brand|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
