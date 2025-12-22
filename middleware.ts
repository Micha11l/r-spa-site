// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_TOKEN = process.env.ADMIN_ENTRY_TOKEN;
const PUBLIC_SECRET_PATH = process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH || "";

const MAINT_ON = ["1", "true", "on"].includes(
  (process.env.NEXT_PUBLIC_MAINTENANCE ?? "").toLowerCase()
);

/**
 * ✅ IMPORTANT:
 * Exclude all Next internals (_next) so dev HMR + chunks never get intercepted.
 */
export const config = {
  matcher: [
    // Exclude: /_next/*, static files, and well-known routes
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml|manifest.json|logo|images|gallery).*)",
  ],
};

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ✅ Double-safety: always allow Next internals & common static routes
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  // ===== Maintenance mode (production only) =====
  if (MAINT_ON && process.env.NODE_ENV === "production") {
    const allow =
      pathname.startsWith("/maintenance") ||
      pathname.startsWith("/admin/login") ||
      pathname.startsWith("/api/admin/login") ||
      pathname.startsWith("/api/admin/logout") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/logo") ||
      pathname.startsWith("/images") ||
      pathname.startsWith("/gallery") ||
      (PUBLIC_SECRET_PATH && pathname === PUBLIC_SECRET_PATH);

    if (!allow) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      const res = NextResponse.rewrite(url);
      res.headers.set("x-robots-tag", "noindex, nofollow");
      return res;
    }
  }

  // ===== Secret entry 1: public secret path -> rewrite to /admin/login =====
  if (PUBLIC_SECRET_PATH && pathname === PUBLIC_SECRET_PATH) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.rewrite(url);
  }

  // ===== Secret entry 2: query token -> set cookie then redirect to /admin =====
  // usage: /admin/login?t=YOUR_ADMIN_ENTRY_TOKEN
  const token = req.nextUrl.searchParams.get("t");
  if (token && ADMIN_TOKEN && token === ADMIN_TOKEN) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";

    const res = NextResponse.redirect(url);
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

  // ===== Admin auth gate: only /admin & /api/admin =====
  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  // allow login/logout routes
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

      const dest = pathname.startsWith("/api")
        ? "/admin"
        : pathname + (search || "");
      url.searchParams.set("next", dest);

      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}