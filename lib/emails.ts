import { Resend } from "resend";
import { makeICS } from "./ics";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function sendBookingEmails(params: {
  service: string;
  startISO: string;
  endISO: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL || "R Spa <noreply@example.com>";
  const owner = process.env.RESEND_OWNER_EMAIL || "owner@example.com";
  const location = process.env.SITE_CITY || "North of HW404, Toronto";
  const subject = `Booking request: ${params.service} – ${params.name}`;
  const lines = [
    `Service: ${params.service}`,
    `Start: ${params.startISO}`,
    `End: ${params.endISO}`,
    `Client: ${params.name}`,
    `Email: ${params.email}`,
    `Phone: ${params.phone}`,
    params.notes ? `Notes: ${params.notes}` : ""
  ].filter(Boolean).join("\n");

  const ics = makeICS(params.service, "R Spa session", location, params.startISO, params.endISO);
  const attachments = [{
    filename: "appointment.ics",
    content: Buffer.from(ics).toString("base64"),
    contentType: "text/calendar"
  }];

  // Owner email
  await resend.emails.send({
    from, to: owner, subject,
    text: lines
  });

  // Client email with ICS
  await resend.emails.send({
    from, to: params.email, subject: "Your R Spa booking request",
    text: `Thank you ${params.name}! We received your request.\n\n${lines}\n\nWe will confirm shortly.\nLocation provided upon confirmation.`,
    attachments
  });
}
