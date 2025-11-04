// lib/emails.ts — Zoho SMTP 版（专业 HTML 模板 + 真实地址 + logo）
import nodemailer from "nodemailer";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { makeICS } from "./ics";
import { Resend } from "resend";
import { buildEmailTemplate } from "./emailTemplates";
dayjs.extend(utc);
dayjs.extend(tz);

type BookingEmailParams = {
  service: string;
  startISO: string;
  endISO: string;
  name: string;
  email: string;   // 客户邮箱
  phone: string;
  notes?: string;
};

// === 顶部常量：把这几行替换掉 ===
const TZ = process.env.TIMEZONE || "America/Toronto";
const SITE_NAME = process.env.SITE_NAME || "Rejuvenessence";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rejuvenessence.org";
const SITE_ADDRESS = process.env.SITE_ADDRESS || "281 Parkwood Ave, Keswick, ON L4P 2X4";
// 新增：展示用邮箱（页脚），默认回落到 SMTP 用户
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.ZOHO_SMTP_USER || "booking@nesses.ca";

// 原来是硬编码 Rejuvenessence，这里改成跟 SITE_NAME 同步
const FROM_ADDR =
  process.env.ZOHO_FROM_EMAIL || `${SITE_NAME} <${process.env.ZOHO_SMTP_USER}>`;

// 线上默认不抄送；开发环境默认抄送，方便排查
const BCC_OWNER =
  (process.env.EMAIL_BCC_OWNER ??
    (process.env.NODE_ENV !== "production" ? "true" : "false")) === "true";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendDepositEmail(to: string, name: string, checkoutUrl: string) {
  const { subject, html } = buildEmailTemplate("deposit", name, { checkoutUrl });
  await resend.emails.send({
    from: `Rejuvenessence <noreply@rejuvenessence.org>`,
    to,
    subject,
    html,
  });
}

export async function sendRefuseEmail(to: string, name: string, reason?: string) {
  const { subject, html } = buildEmailTemplate("refuse", name, { reason });
  await resend.emails.send({
    from: `Rejuvenessence <noreply@rejuvenessence.org>`,
    to,
    subject,
    html,
  });
}

export async function sendPaymentSuccessEmail(
  to: string,
  name: string,
  serviceName: string,
  time: string
) {
  const { subject, html } = buildEmailTemplate("payment_success", name, {
    serviceName,
    time,
  });
  await resend.emails.send({
    from: `Rejuvenessence <noreply@rejuvenessence.org>`,
    to,
    subject,
    html,
  });
}


function buildTransport() {
  const host = process.env.ZOHO_SMTP_HOST || "smtp.zohocloud.ca";
  const port = Number(process.env.ZOHO_SMTP_PORT || 465);
  const secure = port === 465; // 465=SSL, 587=STARTTLS

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.ZOHO_SMTP_USER!, // 如 michael@nesses.ca
      pass: process.env.ZOHO_SMTP_PASS!, // Zoho App Password（12位）
    },
  });
}

function fmtWhen(iso: string) {
  const d = dayjs(iso).tz(TZ);
  return `${d.format("ddd, MMM D, YYYY")} · ${d.format("h:mm A")} (${TZ})`;
}
function diffMin(aISO: string, bISO: string) {
  return Math.max(
    0,
    Math.round((new Date(bISO).getTime() - new Date(aISO).getTime()) / 60000)
  );
}

export async function sendBookingEmails(params: BookingEmailParams) {
  const transporter = buildTransport();

  // 连接自检
  await transporter.verify();

  const owner = process.env.RESEND_OWNER_EMAIL!; // e.g. booking@nesses.ca
  const whenStr = fmtWhen(params.startISO);
  const durMin = diffMin(params.startISO, params.endISO);

  // ===== 店家邮件（纯文本，不带附件）=====
  const ownerText = [
    `New booking request`,
    ``,
    `Service:  ${params.service}`,
    `When:     ${whenStr}  (${durMin} min)`,
    ``,
    `Client:   ${params.name}`,
    `Email:    ${params.email}`,
    `Phone:    ${params.phone}`,
    `Notes:    ${params.notes || "-"}`,
    ``,
    `Tips:`,
    `- Reply to this email to contact the client directly (reply-to set).`,
  ].join("\n");

  await transporter.sendMail({
    from: FROM_ADDR,
    to: owner,
    subject: `New booking · ${params.service} · ${whenStr} · ${params.name}`,
    text: ownerText,
    replyTo: `${params.name} <${params.email}>`,
    envelope: {
      from: process.env.ZOHO_SMTP_USER!,
      to: [owner],
    },
  });

  // ===== 客户邮件（HTML + 纯文本 + .ics）=====
  const customerText = `Hi ${params.name},

Thanks for your request! Here are the details:
Service:  ${params.service}
When:     ${whenStr} (${durMin} min)
Location: ${SITE_ADDRESS}

What's next
• We'll review and email you a confirmation shortly.
• The calendar invite (.ics) is attached.

If you need to change the time, just reply to this email.

— ${SITE_NAME}
`;

  const ics = makeICS(
    `${SITE_NAME} — ${params.service}`,         // summary
    `${SITE_NAME} session`, // description
    SITE_ADDRESS,           // location
    params.startISO,
    params.endISO
  );

  const logoUrl = `${SITE_URL}/logo.png`; // 你的 /public/logo.png 会映射到 /logo.png

  const customerHtml = `
  <div style="background:#f6f7f9;padding:24px">
    <table role="presentation" cellspacing="0" cellpadding="0" align="center"
           style="width:100%;max-width:640px;background:#ffffff;border-radius:12px;
                  padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',
                  Roboto,Helvetica,Arial,sans-serif;color:#111;line-height:1.6;">
      <tr>
        <td style="text-align:center;padding-bottom:12px">
          <img src="${logoUrl}" alt="${SITE_NAME}" width="96"
               style="display:inline-block;border-radius:8px"/>
        </td>
      </tr>
      <tr>
        <td>
          <h2 style="margin:0 0 8px;font-weight:600;font-size:20px">Hi ${params.name},</h2>
          <p style="margin:0 0 16px">Thanks for your request! Here are the details:</p>

          <table role="presentation" cellspacing="0" cellpadding="0"
                 style="width:100%;border:1px solid #e5e7eb;border-radius:8px;
                        padding:12px;background:#fafafa">
            <tr>
              <td style="width:120px;color:#6b7280;padding:4px 8px">Service</td>
              <td style="padding:4px 8px;font-weight:600">${params.service}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;padding:4px 8px">When</td>
              <td style="padding:4px 8px">${whenStr} <span style="color:#6b7280">(${durMin} min)</span></td>
            </tr>
            <tr>
              <td style="color:#6b7280;padding:4px 8px">Location</td>
              <td style="padding:4px 8px">${SITE_ADDRESS}</td>
            </tr>
          </table>

          <h3 style="margin:20px 0 8px;font-size:16px">What's next</h3>
          <ul style="margin:0 0 16px;padding-left:20px">
            <li>We'll review and email you a confirmation shortly.</li>
            <li>The iCalendar (.ics) file is attached — add it to your calendar.</li>
          </ul>

          <p style="margin:0 0 16px">If you need to change the time, just reply to this email.</p>

          <p style="margin:24px 0 0;color:#6b7280;font-size:14px">— ${SITE_NAME}</p>
        </td>
      </tr>

      <tr>
        <td style="padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px">
          ${SITE_NAME} · ${SITE_ADDRESS} ·
          <a href="mailto:${CONTACT_EMAIL}"
             style="color:#6b7280;text-decoration:underline">${CONTACT_EMAIL}</a>
        </td>
      </tr>
    </table>
  </div>
  `;

  await transporter.sendMail({
    from: FROM_ADDR,
    to: params.email,
    subject: `We received your request – ${params.service} on ${whenStr}`,
    text: customerText,      // 纯文本
    html: customerHtml,      // HTML 模板
    replyTo: process.env.ZOHO_SMTP_USER,
    ...(BCC_OWNER ? { bcc: owner } : {}),
    attachments: [
      {
        filename: "appointment.ics",
        content: Buffer.from(ics),
        contentType: "text/calendar; charset=utf-8; method=REQUEST",
      },
    ],
    envelope: {
      from: process.env.ZOHO_SMTP_USER!,
      to: [params.email],
      ...(BCC_OWNER ? { bcc: owner } : {}),
    },
  });
}