// app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/lib/admin/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildLogoutResponse(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("logged_out", "1");
  url.searchParams.delete("t");
  const res = NextResponse.redirect(url);
  res.cookies.set(ADMIN_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return res;
}

export function GET(req: NextRequest) {
  return buildLogoutResponse(req);
}

export function POST(req: NextRequest) {
  return buildLogoutResponse(req);
}
