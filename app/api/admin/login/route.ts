// app/api/admin/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 表单提交（application/x-www-form-urlencoded）
  const contentType = req.headers.get("content-type") || "";
  let pass = "";
  let next = "/admin";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    pass = String(body?.passcode || body?.password || "");
    next = String(body?.next || "/admin");
  } else {
    const form = await req.formData();
    pass = String(form.get("passcode") || form.get("password") || "");
    next = String(form.get("next") || "/admin");
  }

  // 校验口令
  if (!process.env.ADMIN_PASSCODE || pass !== process.env.ADMIN_PASSCODE) {
    return NextResponse.json({ ok: false, error: "Invalid passcode" }, { status: 401 });
  }

  // 如果 next 指向 API，则改为 /admin（避免跳到 JSON）
  if (next.startsWith("/api")) next = "/admin";

  // 设置登录 cookie（生产环境 secure）
  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set("admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 天
  });
  return res;
}