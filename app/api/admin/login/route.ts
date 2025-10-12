// app/api/admin/login/route.ts
import { NextResponse } from "next/server";

const COOKIE = "admin_session";
const PASS = process.env.ADMIN_PASSCODE || ""; // 从环境变量读

export async function POST(req: Request) {
  try {
    // 读取 body，兼容 JSON 与 form 提交
    const ct = req.headers.get("content-type") || "";
    let input = "";

    if (ct.includes("application/json")) {
      const data = await req.json().catch(() => ({}));
      input = (data.passcode ?? data.pass ?? "").toString();
    } else {
      const fd = await req.formData();
      input = (
        (fd.get("passcode") ?? fd.get("pass") ?? "") as string
      ).toString();
    }

    if (!PASS) {
      return NextResponse.json(
        { error: "ADMIN_PASSCODE is not set on server" },
        { status: 500 }
      );
    }

    if (!input || input !== PASS) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    // 生成会话并种 cookie（本地不开 secure，线上自动 secure）
    const token = crypto.randomUUID();
    const maxAge = 60 * 60 * 24 * 30; // 30 天

    const res = NextResponse.json({ ok: true });
    res.headers.append(
      "Set-Cookie",
      `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${
        process.env.NODE_ENV === "production" ? "Secure; " : ""
      }`
    );
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}