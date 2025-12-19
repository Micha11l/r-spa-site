// app/api/admin/bookings/patch/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AllowedPatch = {
  status?: "pending" | "awaiting_deposit" | "confirmed" | "cancelled";
  completed_at?: string | null;
  cancellation_reason?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, patch } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (!patch || typeof patch !== "object") {
      return NextResponse.json({ error: "patch object is required" }, { status: 400 });
    }

    // Allowlist fields
    const allowedFields = ["status", "completed_at", "cancellation_reason"];
    const updateData: AllowedPatch = {};

    for (const key of Object.keys(patch)) {
      if (!allowedFields.includes(key)) {
        return NextResponse.json(
          { error: `Field '${key}' is not allowed` },
          { status: 400 }
        );
      }
      updateData[key as keyof AllowedPatch] = patch[key];
    }

    // If status is cancelled, ensure cancellation_reason has a value
    if (updateData.status === "cancelled") {
      if (!updateData.cancellation_reason || updateData.cancellation_reason.trim() === "") {
        updateData.cancellation_reason = "Cancelled by admin";
      }
    }

    // If status is not cancelled, allow clearing cancellation_reason
    if (updateData.status && updateData.status !== "cancelled" && !("cancellation_reason" in updateData)) {
      // Optionally clear cancellation_reason when un-cancelling
      // User can explicitly pass null to clear it
    }

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[admin/bookings/patch] update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (e: any) {
    console.error("[admin/bookings/patch] error:", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}
