// lib/emailTemplates.ts
export type EmailTemplateType = "deposit" | "refuse" | "payment_success";

export function buildEmailTemplate(
  type: EmailTemplateType,
  name: string,
  data: { checkoutUrl?: string; reason?: string; serviceName?: string; time?: string }
) {
  const SITE_NAME = "Rejuvenessence";
  const logoUrl = "https://rejuvenessence.org/logo.png";

  const commonHeader = `
    <div style="font-family:system-ui, sans-serif; background:#f6f7f9; padding:24px;">
      <table align="center" style="max-width:600px; background:#fff; padding:24px; border-radius:12px;">
        <tr>
          <td align="center">
            <img src="${logoUrl}" width="96" style="border-radius:8px;" />
            <h2 style="margin-top:16px;">Hi ${name},</h2>
  `;

  const commonFooter = `
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="font-size:12px;color:#999;">
              ${SITE_NAME} · 281 Parkwood Ave, Keswick, ON ·
              <a href="mailto:booking@nesses.ca" style="color:#999;text-decoration:underline">
                booking@nesses.ca
              </a>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  // 💰 Deposit email
  if (type === "deposit") {
    const { checkoutUrl } = data;
    return {
      subject: "Confirm your booking with deposit",
      html: `
        ${commonHeader}
        <p>Your appointment has been approved! Please confirm your booking by paying the deposit below:</p>
        <p style="text-align:center; margin:32px 0;">
          <a href="${checkoutUrl}" 
            style="background:#10b981; color:#fff; padding:14px 28px;
            border-radius:8px; text-decoration:none; font-weight:600;">
            Pay CA$50 Deposit
          </a>
        </p>
        <p style="color:#666;">This deposit is refundable up to 48h before your appointment.</p>
        <p style="margin-top:32px; font-size:14px; color:#888;">— ${SITE_NAME}</p>
        ${commonFooter}
      `,
    };
  }

  // 🚫 Refuse email
  if (type === "refuse") {
    const { reason } = data;
    return {
      subject: "Booking Update – Request Unavailable",
      html: `
        ${commonHeader}
        <p>Thank you for your interest in <strong>${SITE_NAME}</strong>.</p>
        <p>Unfortunately, we’re unable to accommodate your requested time.</p>
        ${
          reason
            ? `<p style="color:#444;margin:12px 0;"><b>Reason:</b> ${reason}</p>`
            : ""
        }
        <p>You can choose another available time:</p>
        <p style="text-align:center; margin:24px 0;">
          <a href="https://rejuvenessence.org/booking"
            style="background:#e11d48; color:#fff; padding:12px 24px;
            border-radius:8px; text-decoration:none; font-weight:600;">
            Book Another Time
          </a>
        </p>
        <p style="margin-top:24px; font-size:14px; color:#888;">— ${SITE_NAME}</p>
        ${commonFooter}
      `,
    };
  }

  // ✅ Payment Success email
  if (type === "payment_success") {
    const { serviceName, time } = data;
    return {
      subject: "Your booking is confirmed 🎉",
      html: `
        ${commonHeader}
        <p>Thank you for completing your deposit payment!</p>
        <p>Your booking is now <strong>confirmed</strong>.</p>
        ${
          serviceName
            ? `<p style="margin:12px 0 4px;font-weight:600;">Service:</p><p>${serviceName}</p>`
            : ""
        }
        ${
          time
            ? `<p style="margin:12px 0 4px;font-weight:600;">Time:</p><p>${time}</p>`
            : ""
        }
        <p style="margin:24px 0 8px;">We look forward to seeing you soon at:</p>
        <p style="font-weight:500;">281 Parkwood Ave, Keswick, ON</p>
        <p style="margin-top:32px; font-size:14px; color:#888;">— ${SITE_NAME}</p>
        ${commonFooter}
      `,
    };
  }

  throw new Error("Unknown email template type");
}
