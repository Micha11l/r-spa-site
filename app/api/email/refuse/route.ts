import { NextResponse } from "next/server";
import { sendRefuseEmail } from "@/lib/emails";

export async function POST(req: Request) {
  try {
    const { to, name, reason } = await req.json();
    if (!to) return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });

    await sendRefuseEmail(to, name, reason);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Refuse email error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send refusal email" },
      { status: 500 }
    );
  }
}
