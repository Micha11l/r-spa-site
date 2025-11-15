// lib/emails.ts — Zoho SMTP 版（专业 HTML 模板 + 真实地址 + logo）
import nodemailer from "nodemailer";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { makeICS } from "./ics";
import { Resend } from "resend";
import { buildEmailTemplate } from "./emailTemplates";
import { renderGiftPdfBuffer } from "./gift-pdf";
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

// =====================================================
// Existing Email Functions
// =====================================================

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

// =====================================================
// Gift Card Email Functions
// =====================================================

/**
 * Send gift card email to recipient (either buyer or gift recipient)
 */
export async function sendGiftCardEmail(params: {
  code: string;
  token: string;
  amount: number;
  recipientEmail: string;
  recipientName?: string | null;
  senderName?: string | null;
  message?: string | null;
  isGift: boolean;
  expiresAt?: string | null;
  purchasedAt?: string;
}) {
  const {
    code,
    token,
    amount,
    recipientEmail,
    recipientName,
    senderName,
    message,
    isGift,
    expiresAt,
    purchasedAt,
  } = params;

  // Format amount
  const amountFormatted = `$${amount.toFixed(2)} CAD`;

  // Build redeem URL
  const redeemUrl = `${SITE_URL}/redeem/${token}`;

  // Build email template
  const { subject, html } = buildEmailTemplate("gift_card_recipient", recipientName || "there", {
    code,
    amount: amountFormatted,
    senderName: senderName || undefined,
    recipientName: recipientName || undefined,
    message: message || undefined,
    redeemUrl,
    isGift,
  });

  // Generate PDF attachment
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await renderGiftPdfBuffer({
      value: amount,
      code,
      recipient: recipientName,
      sender: senderName,
      message,
      expiresAt,
      purchasedAt,
      isGift,
    });
    console.log(`[email] PDF generated for gift card ${code}`);
  } catch (error: any) {
    console.error(`[email] Failed to generate PDF for ${code}:`, error);
    // Continue without PDF - email is more important
  }

  // Send via Zoho SMTP (more reliable delivery)
  try {
    const transporter = buildTransport();

    await transporter.sendMail({
      from: FROM_ADDR,
      to: recipientEmail,
      subject,
      html,
      replyTo: process.env.ZOHO_SMTP_USER,
      attachments: pdfBuffer
        ? [
            {
              filename: `Rejuvenessence-Gift-Card-${code}.pdf`,
              content: pdfBuffer,
            },
          ]
        : undefined,
      envelope: {
        from: process.env.ZOHO_SMTP_USER!,
        to: [recipientEmail],
      },
    });

    console.log(`[email] Gift card sent to ${recipientEmail}${pdfBuffer ? ' with PDF' : ' (no PDF)'}`);
  } catch (error: any) {
    console.error(`[email] Failed to send gift card email:`, error);
    throw error;
  }
}

/**
 * Send purchase confirmation to buyer
 */
export async function sendGiftCardPurchaseConfirmation(params: {
  senderEmail: string;
  senderName: string;
  totalAmount: number;
  cards: Array<{
    code: string;
    amount: number;
    isGift: boolean;
    recipientEmail: string;
  }>;
}) {
  const { senderEmail, senderName, totalAmount, cards } = params;

  // Format total amount
  const totalFormatted = `$${totalAmount.toFixed(2)} CAD`;

  // Build email template
  const { subject, html } = buildEmailTemplate(
    "gift_card_purchase_confirm",
    senderName,
    {
      senderName,
      totalAmount: totalFormatted,
      cardCount: cards.length,
      cards,
    }
  );

  // Send via Zoho SMTP (more reliable delivery)
  const transporter = buildTransport();

  // Send to buyer
  try {
    await transporter.sendMail({
      from: FROM_ADDR,
      to: senderEmail,
      subject,
      html,
      replyTo: process.env.ZOHO_SMTP_USER,
      envelope: {
        from: process.env.ZOHO_SMTP_USER!,
        to: [senderEmail],
      },
    });

    console.log(`[email] Purchase confirmation sent to ${senderEmail}`);
  } catch (error: any) {
    console.error(`[email] Failed to send purchase confirmation:`, error);
    throw error;
  }

  // Also notify owner via Zoho
  try {
    const owner = process.env.RESEND_OWNER_EMAIL!;

    const giftsCount = cards.filter(c => c.isGift).length;
    const selfCount = cards.length - giftsCount;

    const ownerText = [
      `New Gift Card Purchase`,
      ``,
      `Buyer:        ${senderName} (${senderEmail})`,
      `Total:        $${totalAmount.toFixed(2)} CAD`,
      `Cards:        ${cards.length}`,
      `For self:     ${selfCount}`,
      `As gifts:     ${giftsCount}`,
      ``,
      `Details:`,
      ...cards.map((card, i) =>
        `${i + 1}. ${card.code} - $${card.amount} - ${card.isGift ? `Gift to ${card.recipientEmail}` : 'For buyer'}`
      ),
      ``,
      `All gift cards have been sent to recipients.`,
    ].join("\n");

    await transporter.sendMail({
      from: `${SITE_NAME} <${process.env.ZOHO_SMTP_USER}>`,
      to: owner,
      subject: `Gift Card Purchase - ${senderName} - $${totalAmount.toFixed(2)}`,
      text: ownerText,
      replyTo: `${senderName} <${senderEmail}>`,
      envelope: {
        from: process.env.ZOHO_SMTP_USER!,
        to: [owner],
      },
    });

    console.log(`[email] Owner notification sent`);
  } catch (error: any) {
    console.error(`[email] Failed to send owner notification:`, error);
    // Don't throw - customer email is more important
  }
}
export async function sendGiftCardUseNotification(params: {
  giftCard: any;
  amountUsed: number;
  newBalance: number;
  serviceName: string;
}) {
  const { giftCard, amountUsed, newBalance, serviceName } = params;

  // Determine who to notify
  const notifyEmail = giftCard.is_gift && giftCard.recipient_email
    ? giftCard.recipient_email
    : giftCard.sender_email || giftCard.purchased_by_email;

  if (!notifyEmail) {
    console.log("[email] No email to notify for gift card use");
    return;
  }

  const notifyName = giftCard.is_gift && giftCard.recipient_name
    ? giftCard.recipient_name
    : giftCard.sender_name || "there";

  // Format amounts
  const amountUsedFormatted = `$${(amountUsed / 100).toFixed(2)}`;
  const newBalanceFormatted = `$${(newBalance / 100).toFixed(2)}`;

  // Build email
  const subject = `Gift Card Used - ${amountUsedFormatted}`;
  const html = `
    <div style="font-family:system-ui, sans-serif; background:#f6f7f9; padding:24px;">
      <table align="center" style="max-width:600px; background:#fff; padding:24px; border-radius:12px;">
        <tr>
          <td align="center">
            <img src="${SITE_URL}/logo.png" width="96" style="border-radius:8px;" />
            <h2 style="margin-top:16px;">Hi ${notifyName},</h2>
            
            <div style="background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                        padding:24px; border-radius:12px; color:white; margin:24px 0;">
              <div style="font-size:18px; opacity:0.9; margin-bottom:8px;">Transaction</div>
              <div style="font-size:42px; font-weight:700; margin:12px 0;">
                ${amountUsedFormatted}
              </div>
              <div style="font-size:14px; opacity:0.9;">was used from your gift card</div>
            </div>

            <div style="background:#f9fafb; border-radius:12px; padding:20px; margin:24px 0; text-align:left;">
              <table style="width:100%;">
                <tr>
                  <td style="padding:8px 0; color:#6b7280; font-size:14px;">Service:</td>
                  <td style="padding:8px 0; font-weight:600; text-align:right;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; color:#6b7280; font-size:14px;">Date:</td>
                  <td style="padding:8px 0; font-weight:600; text-align:right;">${new Date().toLocaleDateString()}</td>
                </tr>
                <tr style="border-top:2px solid #e5e7eb;">
                  <td style="padding:12px 0 8px; color:#374151; font-weight:600;">Remaining Balance:</td>
                  <td style="padding:12px 0 8px; font-size:20px; font-weight:700; color:#10b981; text-align:right;">
                    ${newBalanceFormatted}
                  </td>
                </tr>
              </table>
            </div>

            <p style="color:#6b7280; font-size:14px; margin:24px 0;">
              Thank you for choosing ${SITE_NAME}!
            </p>

            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="font-size:12px;color:#999;">
              ${SITE_NAME} · ${SITE_ADDRESS} ·
              <a href="mailto:${CONTACT_EMAIL}" style="color:#999;text-decoration:underline">
                ${CONTACT_EMAIL}
              </a>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  // Send email
  try {
    await resend.emails.send({
      from: `${SITE_NAME} <noreply@rejuvenessence.org>`,
      to: notifyEmail,
      subject,
      html,
    });

    console.log(`[email] Gift card use notification sent to ${notifyEmail}`);
  } catch (error: any) {
    console.error(`[email] Failed to send use notification:`, error);
    // Don't throw - this is not critical
  }
}