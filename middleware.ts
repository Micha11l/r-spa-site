// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ⚠️ 变量名修正：你写成了 ADMIN__ENTRY_TOKEN（双下划线）
// 建议统一用 ADMIN_ENTRY_TOKEN（单下划线）
const ADMIN_TOKEN = process.env.ADMIN_ENTRY_TOKEN; // 服务端 token（只在服务端用）
const PUBLIC_SECRET_PATH =
  process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH || ""; // 公开“隐秘路径”（可渲染在前端）

// 维护模式：值是 "1" / "true" / "on" 时生效（仅生产环境）
const MAINT_ON = ["1", "true", "on"].includes(
  (process.env.NEXT_PUBLIC_MAINTENANCE ?? "").toLowerCase()
);

// 让中间件作用于全站（排除静态产物与 favicon）
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ===== 维护模式（生产环境才生效）=====
  if (MAINT_ON && process.env.NODE_ENV === "production") {
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
      pathname.startsWith("/gallery") ||
      // 允许隐秘入口在维护期也能打开登录页
      (PUBLIC_SECRET_PATH && pathname === PUBLIC_SECRET_PATH);

    if (!allow) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      const res = NextResponse.rewrite(url);
      res.headers.set("x-robots-tag", "noindex, nofollow");
      return res;
    }
  }

  // ===== 隐秘入口 1：公开路径 -> 重写到 /admin/login =====
  if (PUBLIC_SECRET_PATH && pathname === PUBLIC_SECRET_PATH) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.rewrite(url);
  }

  // ===== 隐秘入口 2：query token -> 设置短期 cookie 并跳转到 /admin（可选）=====
  // 用法：/admin/login?t=YOUR_ADMIN_ENTRY_TOKEN
  const token = req.nextUrl.searchParams.get("t");
  if (token && ADMIN_TOKEN && token === ADMIN_TOKEN) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    const res = NextResponse.redirect(url);
    // 短期登录态（30 分钟）
    res.cookies.set({
      name: "admin_auth",
      value: "1",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 30,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
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