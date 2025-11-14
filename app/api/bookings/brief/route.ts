import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, service_name, customer_name, start_at, price_cents, deposit_cents, status")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("[api/bookings/brief] not found:", error);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...data,
    start_ts_fmt: data.start_at
      ? dayjs.utc(data.start_at).local().format("MMM D, YYYY h:mm A")
      : "",
  });
}
