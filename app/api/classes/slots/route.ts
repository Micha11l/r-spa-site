// /app/api/classes/slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * This endpoint returns:
 * - slots: list of classes for the given date (+ signed_count computed from class_signups)
 * - mine:  current user's non-withdrawn signups for the date (if an auth bearer token is provided)
 *
 * It is resilient to schemas with or without `class_id` in `class_signups`.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const type = searchParams.get("type"); // "stretching" | "yoga" | "pilates" | "all"

    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    // 1) Fetch classes for the day (optionally filtered by type)
    let q = supabaseAdmin
      .from("classes")
      .select("id,class_type,class_date,start_time,end_time,capacity,min_size,status,coach,room")
      .eq("class_date", date)
      .order("start_time", { ascending: true });

    if (type && type !== "all") q = q.eq("class_type", type);

    const { data: rows, error } = await q;
    if (error) throw error;

    // Helper: robustly count signed signups even if class_signups doesn't have class_id
    async function countSignedForRow(r: {
      id: string;
      class_type: string;
      class_date: string;
      start_time: string;
      end_time: string;
    }): Promise<number> {
      // First try by class_id (preferred)
      try {
        const { count, error: cErr } = await supabaseAdmin
          .from("class_signups")
          .select("id", { head: true, count: "exact" })
          .eq("class_id", r.id)
          .eq("status", "signed");

        if (cErr) throw cErr;
        return count ?? 0;
      } catch (e: any) {
        // Fallback: composite keys (works when class_id column does not exist)
        const { count, error: fErr } = await supabaseAdmin
          .from("class_signups")
          .select("id", { head: true, count: "exact" })
          .eq("class_type", r.class_type)
          .eq("class_date", r.class_date)
          .eq("start_time", r.start_time)
          .eq("end_time", r.end_time)
          .eq("status", "signed");

        if (fErr) {
          // As a last resort, don't crash the whole endpoint; log and return 0
          console.error("[classes/slots] count fallback error:", fErr);
          return 0;
        }
        return count ?? 0;
      }
    }

    // 2) Compute per-class signed_count
    const slots = await Promise.all(
      (rows ?? []).map(async (r) => {
        const signed_count = await countSignedForRow(r as any);
        return {
          ...r,
          capacity: r.capacity ?? 5,
          min_size: r.min_size ?? 1,
          signed_count,
        };
      })
    );

    // 3) Mine (optional, if Authorization: Bearer &lt;access_token&gt; is provided)
    const auth = req.headers.get("authorization") ?? "";
    let mine: any[] = [];
    if (auth.toLowerCase().startsWith("bearer ")) {
      try {
        const token = auth.replace(/^bearer\s+/i, "");
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);

        if (user?.email) {
          // Attempt select including class_id; if it fails (42703), retry without class_id
          try {
            const { data: mineRows, error: mErr } = await supabaseAdmin
              .from("class_signups")
              .select("id,class_id,class_type,class_date,start_time,end_time,status,created_at")
              .eq("email", user.email)
              .eq("class_date", date)
              .neq("status", "withdrawn");

            if (mErr) throw mErr;
            mine = mineRows ?? [];
          } catch (selErr: any) {
            // Fallback without class_id column
            const { data: mineRows2, error: mErr2 } = await supabaseAdmin
              .from("class_signups")
              .select("id,class_type,class_date,start_time,end_time,status,created_at")
              .eq("email", user.email)
              .eq("class_date", date)
              .neq("status", "withdrawn");

            if (mErr2) {
              console.error("[classes/slots] mine fallback error:", mErr2);
            }
            mine = mineRows2 ?? [];
          }
        }
      } catch (authErr) {
        // Do not fail the endpoint because of auth parsing; just omit `mine`
        console.error("[classes/slots] auth getUser error:", authErr);
      }
    }

    return NextResponse.json({ slots, mine }, { status: 200 });
  } catch (e: any) {
    console.error("[classes/slots]", e);
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}
