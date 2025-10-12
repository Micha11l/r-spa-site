import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const COOKIE = "admin_session";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 放行静态资源
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // 是否是需要鉴权的路径
  const needsAuth =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  // 显式放行登录页与登录 API，避免循环
  const isLogin =
    pathname === "/admin/login" || pathname === "/api/admin/login";

  if (!needsAuth || isLogin) return NextResponse.next();

  // 检查会话
  const session = req.cookies.get(COOKIE)?.value;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // 只拦截 admin 与 api/admin
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};