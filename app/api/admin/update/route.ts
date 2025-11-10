//app/api/admin/update/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type AppIntentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "awaiting_deposit"
  | "deposit_sent"
  | "deposit_paid"
  | "refused"
  | "refunded"
  | "completed";

const DB_STATUSES = ["pending", "confirmed", "cancelled"] as const;
type DbStatus = (typeof DB_STATUSES)[number];

// 应用层意图 -> 数据库状态（满足你目前表的三态约束）
const STATUS_MAP: Record<AppIntentStatus, DbStatus> = {
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",

  awaiting_deposit: "pending",
  deposit_sent: "pending",
  deposit_paid: "confirmed",

  refused: "cancelled",
  refunded: "cancelled",

  completed: "confirmed", // 业务上“已完成”通常仍属于已确认范畴
};

// 简单 UUID 形状校验（可选）
function looksLikeUUID(v: string) {
  return /^[0-9a-fA-F-]{36}$/.test(v);
}

export async function POST(req: Request) {
  try {
    const { id, status, reason } = (await req.json()) as {
      id?: string;
      status?: string;
      reason?: string;
    };

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }
    if (!looksLikeUUID(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // 允许的“应用层意图状态”
    const intent = status as AppIntentStatus;
    if (!(intent in STATUS_MAP)) {
      return NextResponse.json(
        { error: `Unsupported status: ${status}` },
        { status: 400 }
      );
    }

    const dbStatus = STATUS_MAP[intent];

    // 构造要更新的列（只包含你表里确实存在的列）
    const updates: Record<string, any> = { status: dbStatus };

    // 语义性附带字段
    if (intent === "deposit_paid") {
      updates.deposit_paid = true;
      updates.deposit_paid_at = new Date().toISOString();
    }

    // 如果是拒绝/取消，允许记录原因（可选）
    if (intent === "refused" || intent === "cancelled") {
      if (typeof reason === "string" && reason.trim()) {
        updates.cancellation_reason = reason.trim().slice(0, 500);
      } else {
        updates.cancellation_reason = null;
      }
      // 是否要强制回滚 deposit_paid，取决于你的业务：
      // updates.deposit_paid = false;
      // updates.deposit_paid_at = null;
    }

    // “refunded” 仅做状态映射到 cancelled，具体退款金额/状态请走专门退款流程接口
    // “completed” 映射到 confirmed；若你将来新增 completed_at，可在此顺便写入时间戳：
    if (intent === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select(
        "id, status, deposit_paid, deposit_paid_at, cancellation_reason, completed_at"
      )
      .single();

    if (error) {
      console.error("[admin/update] supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // 返回“规范化后的状态”，方便前端刷新
    return NextResponse.json({
      success: true,
      normalizedStatus: dbStatus,
      data,
    });
  } catch (err: any) {
    console.error("[admin/update] exception:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}