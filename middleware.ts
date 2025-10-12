// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// 只在 /admin 和 /api/admin 下启用鉴权
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 允许登录/登出端点与登录页本身
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  // 放行静态与公共资源（防止误拦）
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/gallery") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/therapies")
  ) {
    return NextResponse.next();
  }

  // 检查登录 cookie
  const authed = req.cookies.get("admin_auth")?.value === "1";
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";

    // 如果原目标是 API，就把 next 固定回 /admin，避免登录后跳去 JSON
    const dest = pathname.startsWith("/api") ? "/admin" : pathname + (search || "");
    url.searchParams.set("next", dest);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}