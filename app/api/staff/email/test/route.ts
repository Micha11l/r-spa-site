// app/api/staff/email/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildEmailTemplate } from "@/lib/emailTemplates";

// 导入 sendEmailTracked (需要导出它)
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// 复制 sendEmailTracked 的简化版本用于测试
async function sendTestEmail(params: {
  eventType: string;
  to: string;
  subject: string;
  html: string;
}) {
  const { eventType, to, subject, html } = params;

  // 这里简化处理，直接调用 Zoho SMTP
  const nodemailer = require("nodemailer");

  const FROM_ADDR =
    process.env.ZOHO_FROM_EMAIL ||
    `${process.env.SITE_NAME || "Rejuvenessence"} <${process.env.ZOHO_SMTP_USER}>`;

  const transporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || "smtp.zohocloud.ca",
    port: Number(process.env.ZOHO_SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.ZOHO_SMTP_USER!,
      pass: process.env.ZOHO_SMTP_PASS!,
    },
  });

  let status = "queued";
  let messageId: string | undefined;
  let error: string | undefined;

  try {
    const info = await transporter.sendMail({
      from: FROM_ADDR,
      to,
      subject,
      html,
      envelope: {
        from: process.env.ZOHO_SMTP_USER!,
        to: [to],
      },
    });
    messageId = info.messageId;
    status = "sent";
  } catch (err: any) {
    console.error("[test] Send failed:", err.message);
    error = err.message;
    status = "failed";
  }

  // 写入 outbox
  try {
    await supabaseAdmin.from("email_outbox").insert({
      event_type: eventType,
      to_email: to,
      subject,
      provider: "zoho",
      status,
      message_id: messageId || null,
      error: error || null,
      meta: { test: true },
    });
  } catch (dbError: any) {
    console.error("[test] Failed to log:", dbError);
  }

  return { success: status === "sent", messageId, error };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, template } = body;

    if (!to || !template) {
      return NextResponse.json(
        { error: "Missing 'to' or 'template'" },
        { status: 400 }
      );
    }

    // 根据 template 生成邮件内容
    let subject = "";
    let html = "";
    let eventType = template;

    switch (template) {
      case "booking_request":
        subject = "Test Booking Request";
        html = `
          <div style="font-family:sans-serif;padding:20px;background:#f9fafb;">
            <div style="max-width:600px;margin:0 auto;background:white;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
              <h2>Test Booking Request</h2>
              <p>This is a test email for booking_request template.</p>
              <p><strong>Service:</strong> Test Service</p>
              <p><strong>Date:</strong> Jan 1, 2024 @ 10:00 AM</p>
            </div>
          </div>
        `;
        break;

      case "deposit_link":
        const depositTemplate = buildEmailTemplate("deposit", "Test User", {
          checkoutUrl: "https://example.com/test",
        });
        subject = depositTemplate.subject;
        html = depositTemplate.html;
        break;

      case "payment_success":
        const paymentTemplate = buildEmailTemplate(
          "payment_success",
          "Test User",
          {
            serviceName: "Test Service",
            time: "Jan 1, 2024 @ 10:00 AM",
          }
        );
        subject = paymentTemplate.subject;
        html = paymentTemplate.html;
        break;

      case "giftcard_recipient":
      case "giftcard_use":
        subject = "Test Gift Card Email";
        html = `
          <div style="font-family:sans-serif;padding:20px;background:#f9fafb;">
            <div style="max-width:600px;margin:0 auto;background:white;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
              <h2>Test Gift Card Email</h2>
              <p>This is a test email for ${template} template.</p>
              <p><strong>Code:</strong> GC-TEST-1234</p>
              <p><strong>Amount:</strong> $100.00 CAD</p>
            </div>
          </div>
        `;
        break;

      default:
        return NextResponse.json(
          { error: `Unknown template: ${template}` },
          { status: 400 }
        );
    }

    // 发送测试邮件
    const result = await sendTestEmail({
      eventType: `test_${template}`,
      to,
      subject: `[TEST] ${subject}`,
      html,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? "Test email sent and logged"
        : "Test email failed",
      messageId: result.messageId,
      error: result.error,
    });
  } catch (error: any) {
    console.error("[staff/email/test] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
