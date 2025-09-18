// lib/emails.ts — Zoho SMTP 版（去重 + 清晰模板）
import nodemailer from "nodemailer";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { makeICS } from "./ics"; // 若你的 ics.ts 是命名导出：改为 `import { makeICS } from "./ics"`

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

const TZ = process.env.TIMEZONE || "America/Toronto";
const SITE_NAME = process.env.SITE_NAME || "R Spa";
const SITE_CITY = process.env.SITE_CITY || "North of HW404, Toronto";
const FROM_ADDR =
  process.env.ZOHO_FROM_EMAIL || `Rejuvenessence <${process.env.ZOHO_SMTP_USER}>`;

// 线上默认不抄送；开发环境默认抄送，方便排查
const BCC_OWNER =
  (process.env.EMAIL_BCC_OWNER ??
    (process.env.NODE_ENV !== "production" ? "true" : "false")) === "true";

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
    Math.round(
      (new Date(bISO).getTime() - new Date(aISO).getTime()) / 60000
    )
  );
}

export async function sendBookingEmails(params: BookingEmailParams) {
  const transporter = buildTransport();

  // 连接自检
  await transporter.verify();

  const owner = process.env.RESEND_OWNER_EMAIL!; // e.g. booking@nesses.ca
  const whenStr = fmtWhen(params.startISO);
  const durMin = diffMin(params.startISO, params.endISO);

  // ===== 店家邮件（不带附件，不抄送自己）=====
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
    `- 直接“回复”此邮件将回到客户邮箱（已设置 reply-to）。`,
    `- 若时间无效，复制上面信息改时间后回给客户即可。`,
  ].join("\n");

  await transporter.sendMail({
    from: FROM_ADDR,
    to: owner,
    subject: `New booking · ${params.service} · ${whenStr} · ${params.name}`,
    text: ownerText,
    replyTo: `${params.name} <${params.email}>`, // 你点“回复”就直接回客户

    envelope: {
      from: process.env.ZOHO_SMTP_USER!,
      to: [owner],
    },
  });

  // ===== 客户邮件（附 .ics；可选 bcc 给店家用于留底）=====
  const customerText = [
    `Hi ${params.name},`,
    ``,
    `Thanks for your request! Here are the details:`,
    `Service:  ${params.service}`,
    `When:     ${whenStr}  (${durMin} min)`,
    `Location: ${SITE_CITY}`,
    ``,
    `What's next`,
    `• We will review and email you a confirmation shortly.`,
    `• Exact address will be provided upon confirmation.`,
    ``,
    `If you need to change the time, just reply to this email.`,
    ``,
    `— ${SITE_NAME}`,
  ].join("\n");

  const ics = makeICS(
    params.service,         // summary
    "R Spa session",        // description
    SITE_CITY,              // location
    params.startISO,
    params.endISO
  );

  await transporter.sendMail({
    from: FROM_ADDR,
    to: params.email,
    subject: `We received your request – ${params.service} on ${whenStr}`,
    text: customerText,
    replyTo: process.env.ZOHO_SMTP_USER, // 客户回复回到你
    ...(BCC_OWNER ? { bcc: owner } : {}), // 线上默认不抄送，避免重复
    attachments: [
      {
        filename: "appointment.ics",
        content: ics,
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