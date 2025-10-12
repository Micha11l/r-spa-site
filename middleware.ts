// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const MAINT_ON = process.env.NEXT_PUBLIC_MAINTENANCE === "1";

// 让中间件作用于全站（排除静态产物与 favicon）
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ===== 维护模式（生产环境才生效）=====
  if (MAINT_ON && process.env.NODE_ENV === "production") {
    // 允许访问的白名单：维护页本身、后台/后台API、登录登出端点、常见静态资源
    const allow =
      pathname.startsWith("/maintenance") ||
      pathname.startsWith("/admin/login") ||
      pathname.startsWith("/api/admin/login") ||
      pathname.startsWith("/api/admin/logout") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/_next/") ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml" ||
      pathname.startsWith("/logo") ||
      pathname.startsWith("/images") ||
      pathname.startsWith("/gallery");

    if (!allow) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      const res = NextResponse.rewrite(url);
      res.headers.set("x-robots-tag", "noindex, nofollow");
      return res;
    }
  }

  // ===== 后台鉴权（仅 /admin 与 /api/admin 才处理）=====
  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  // 放行登录/登出端点与登录页本身
  if (
    isAdminArea &&
    (pathname.startsWith("/admin/login") ||
      pathname.startsWith("/api/admin/login") ||
      pathname.startsWith("/api/admin/logout"))
  ) {
    return NextResponse.next();
  }

  if (isAdminArea) {
    const authed = req.cookies.get("admin_auth")?.value === "1";
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      // 如果目标是 API，跳回 /admin；否则回原路径
      const dest = pathname.startsWith("/api")
        ? "/admin"
        : pathname + (search || "");
      url.searchParams.set("next", dest);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}