// app/api/admin/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") || "";
  let pass = "";
  let next = "/admin";

  if (ct.includes("application/json")) {
    const body = await req.json();
    pass = String(body?.passcode || body?.password || "");
    next = String(body?.next || "/admin");
  } else {
    const form = await req.formData();
    pass = String(form.get("passcode") || form.get("password") || "");
    next = String(form.get("next") || "/admin");
  }

  if (!process.env.ADMIN_PASSCODE || pass !== process.env.ADMIN_PASSCODE) {
    // 也可以改成重定向回登录页并带 error=1
    return NextResponse.json({ ok: false, error: "Invalid passcode" }, { status: 401 });
  }

  if (next.startsWith("/api")) next = "/admin";

  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  res.cookies.set("admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}