// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_TOKEN = process.env.ADMIN_ENTRY_TOKEN;
const PUBLIC_SECRET_PATH = process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH || "";

const MAINT_ON = ["1", "true", "on"].includes(
  (process.env.NEXT_PUBLIC_MAINTENANCE ?? "").toLowerCase(),
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

function isAuthedAdmin(req: NextRequest) {
  return Boolean(req.cookies.get("admin_auth")?.value);
}

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
  const tokenValid = Boolean(
    token &&
      ADMIN_TOKEN &&
      token === ADMIN_TOKEN,
  );

  if (
    tokenValid &&
    !req.nextUrl.pathname.startsWith("/api/admin/login")
  ) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/api/admin/login";
    loginUrl.searchParams.set("t", token!);

    const params = new URLSearchParams(req.nextUrl.searchParams);
    params.delete("t");
    const remaining = params.toString();
    const nextPath = remaining ? `${req.nextUrl.pathname}?${remaining}` : req.nextUrl.pathname;

    loginUrl.searchParams.set("next", nextPath || "/admin");
    return NextResponse.redirect(loginUrl);
  }

  // ===== Admin auth gate: only /admin & /api/admin =====
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminArea = isAdminPage || isAdminApi;

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
    const authed = isAuthedAdmin(req);

    if (!authed) {
      // ✅ API：别重定向，直接 401 JSON（否则前端 fetch 会被塞 HTML）
      if (isAdminApi) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }

      // ✅ 页面：重定向到 admin login，并带 next
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";

      const dest = pathname + (search || "");
      url.searchParams.set("next", dest);

      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
