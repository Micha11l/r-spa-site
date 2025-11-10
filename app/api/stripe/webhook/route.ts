// app/api/stripe/webhook/route.ts
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";
import { renderGiftPdfBuffer } from "@/lib/gift-pdf";
import { generateGiftCode } from "@/lib/gift";

export const dynamic = "force-dynamic";
// App Router 用 raw body，不需要 bodyParser，这行对 App Router 无效：
// export const config = { api: { bodyParser: false } };
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig!, endpointSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    // 处理 checkout.session.completed 事件（主要事件）
    // 注意：payment_intent.succeeded 等其他事件也可能到达，但由于幂等保护，不会重复处理
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};

      // 检查是否是礼品卡：根据 metadata.kind === 'giftcard' 分支
      const isGiftCard = metadata.kind === "giftcard";

      if (isGiftCard) {
        // 幂等保护：检查是否已经处理过这个 session
        const { data: existingCard } = await supabaseAdmin
          .from("gift_cards")
          .select("id,code")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (existingCard) {
          console.log(`Gift card already processed for session ${session.id}`);
          return new Response("Already processed", { status: 200 });
        }

        // 也检查 payment_intent_id（如果存在）
        const pi = session.payment_intent as string | Stripe.PaymentIntent | null;
        const paymentIntentId = typeof pi === "string" ? pi : pi?.id ?? null;
        
        if (paymentIntentId) {
          const { data: existingByPI } = await supabaseAdmin
            .from("gift_cards")
            .select("id,code")
            .eq("payment_intent_id", paymentIntentId)
            .maybeSingle();

          if (existingByPI) {
            console.log(`Gift card already processed for payment_intent ${paymentIntentId}`);
            return new Response("Already processed", { status: 200 });
          }
        }

        // 礼品卡处理分支
        const sender_name = metadata.sender_name || "";
        const sender_email = metadata.sender_email || "";
        const recipient_name = metadata.recipient_name || "";
        const recipient_email = metadata.recipient_email || "";
        const message = metadata.message || "";
        const amountStr = metadata.amount || String((session.amount_total ?? 0) / 100);
        const amountNum = parseFloat(amountStr);

        // 生成或使用已有的礼品卡 code
        const code = metadata.code || generateGiftCode();

        // 落库：写入 gift_cards 表
        let giftCardId: string | null = null;
        try {
          // 构建插入数据，如果 payment_intent_id 列不存在则忽略
          const insertData: any = {
            code,
            amount: Math.round(amountNum * 100), // 转换为 cents
            remaining_amount: Math.round(amountNum * 100),
            status: "active",
            stripe_session_id: session.id,
            sender_name: sender_name || null,
            sender_email: sender_email || null,
            recipient_name: recipient_name || null,
            recipient_email: recipient_email || null,
            message: message || null,
            created_at: new Date().toISOString(),
          };
          
          // 只有当 payment_intent_id 存在时才添加（如果列不存在会报错）
          if (paymentIntentId) {
            insertData.payment_intent_id = paymentIntentId;
          }

          const { data: insertedCard, error: dbErr } = await supabaseAdmin
            .from("gift_cards")
            .insert(insertData)
            .select("id")
            .single();

          if (dbErr) {
            console.error("Gift card DB insert error:", dbErr);
            // 如果是列不存在的错误，尝试不包含 payment_intent_id 重新插入
            if (dbErr?.code === "PGRST204" && dbErr?.message?.includes("payment_intent_id")) {
              console.log("Retrying insert without payment_intent_id column");
              const { data: retryCard, error: retryErr } = await supabaseAdmin
                .from("gift_cards")
                .insert({
                  code,
                  amount: Math.round(amountNum * 100),
                  remaining_amount: Math.round(amountNum * 100),
                  status: "active",
                  stripe_session_id: session.id,
                  sender_name: sender_name || null,
                  sender_email: sender_email || null,
                  recipient_name: recipient_name || null,
                  recipient_email: recipient_email || null,
                  message: message || null,
                  created_at: new Date().toISOString(),
                })
                .select("id")
                .single();
              
              if (retryErr) {
                throw retryErr;
              }
              giftCardId = retryCard?.id || null;
            } else {
              throw dbErr;
            }
          } else {
            giftCardId = insertedCard?.id || null;
          }
        } catch (dbErr: any) {
          console.error("Gift card DB insert error:", dbErr);
          // 如果是重复键错误，说明已经处理过，返回成功
          if (dbErr?.code === "23505" || dbErr?.message?.includes("duplicate") || dbErr?.message?.includes("unique")) {
            return new Response("Already processed", { status: 200 });
          }
          return new Response(`Database error: ${dbErr.message}`, { status: 500 });
        }

        // 生成 PDF
        let pdfBuffer: Buffer;
        try {
          const buf = await renderGiftPdfBuffer({
            value: Math.round(amountNum), // 传递数字，不是字符串
            code,
            recipient: recipient_name || null,
            sender: sender_name || null,
            message: message || null,
          });
          // @react-pdf/renderer 的 toBuffer() 返回 Buffer，但类型定义可能不准确
          pdfBuffer = buf as any as Buffer;
        } catch (pdfErr) {
          console.error("PDF generation error:", pdfErr);
          return new Response(`PDF generation failed: ${pdfErr}`, { status: 500 });
        }

        // 通过 Resend 把 PDF 同时发给收件人与送礼人（都填就都发）
        const emailsToSend: string[] = [];
        if (recipient_email) emailsToSend.push(recipient_email);
        if (sender_email && sender_email !== recipient_email) emailsToSend.push(sender_email);

        if (emailsToSend.length > 0) {
          try {
            await resend.emails.send({
              from: "Rejuvenessence <noreply@rejuvenessence.org>",
              to: emailsToSend,
              subject: "Your Rejuvenessence Gift Certificate",
              html: `
                <p>${recipient_name ? `Hi ${recipient_name},` : "Hi,"}</p>
                <p>${sender_name ? `${sender_name} has sent you a gift certificate!` : "You have received a gift certificate!"}</p>
                ${message ? `<p>Message: ${message}</p>` : ""}
                <p>Please find your gift certificate attached.</p>
                <p>Code: <strong>${code}</strong></p>
                <p>Value: <strong>CAD $${amountNum.toFixed(2)}</strong></p>
                <p>No expiry · Single or multiple redemptions</p>
                <p>Best regards,<br>Rejuvenessence</p>
              `,
              attachments: [
                {
                  filename: `gift-certificate-${code}.pdf`,
                  content: pdfBuffer.toString("base64"),
                },
              ],
            });
          } catch (emailErr) {
            console.error("Resend email error:", emailErr);
            // 即使邮件发送失败，也返回成功，因为礼品卡已创建
          }
        }

        // 礼品卡处理完直接返回，不会落到订金分支
        return new Response("ok", { status: 200 });
      }

      // 原有的订金/booking逻辑
      const bookingId =
        (session.client_reference_id as string) ||
        (metadata.booking_id as string);

      if (!bookingId) return new Response("No booking id", { status: 200 });

      const { data: row, error } = await supabaseAdmin
        .from("bookings")
        .select("id,status,deposit_paid,customer_email,customer_name")
        .eq("id", bookingId)
        .single();

      if (error || !row) return new Response("Booking not found", { status: 200 });
      if (row.deposit_paid) return new Response("Already processed", { status: 200 });

      const pi = session.payment_intent as string | Stripe.PaymentIntent | null;
      const paymentIntentId = typeof pi === "string" ? pi : pi?.id ?? null;
      const amount = session.amount_total ?? session.amount_subtotal ?? undefined;

      const { error: upErr } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "confirmed",
          deposit_paid: true,
          deposit_paid_at: new Date().toISOString(),
          payment_intent_id: paymentIntentId ?? undefined,
          deposit_cents: amount,
        })
        .eq("id", bookingId);

      if (upErr) console.error("Supabase update error:", upErr);

      if (row.customer_email) {
        try {
          await resend.emails.send({
            from: "Rejuvenessence <noreply@rejuvenessence.org>",
            to: row.customer_email,
            subject: "Deposit received — your booking is confirmed",
            text: `Hi ${row.customer_name ?? ""},\n\nWe’ve received your deposit. Your booking (${bookingId}) is now confirmed.\n\nSee you soon!\nRejuvenessence`,
          });
        } catch (e) {
          console.error("Resend error:", e);
        }
      }
    }

    // 其他事件类型（如 payment_intent.succeeded）可以安全忽略
    // 因为我们已经通过 checkout.session.completed 处理了所有逻辑
    // 幂等保护确保即使这些事件到达也不会重复处理
    if (event.type !== "checkout.session.completed") {
      console.log(`Received event type: ${event.type} (ignored, handled via checkout.session.completed)`);
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("Webhook handler error:", e);
    return new Response("server error", { status: 500 });
  }
}