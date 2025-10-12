import { NextResponse } from "next/server";

const COOKIE = "admin_session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // 通过设为空并 Max-Age=0 清掉会话
  res.headers.append(
    "Set-Cookie",
    `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${
      process.env.NODE_ENV === "production" ? "Secure; " : ""
    }`
  );
  return res;
}