// app/api/packages/purchase-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "missing_session_id" },
        { status: 400 }
      );
    }

    // Extract access token from Authorization header or cookies
    let accessToken: string | null = null;

    // Primary: Bearer token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      accessToken = authHeader.slice(7);
    }

    // Fallback: Extract from cookies
    if (!accessToken) {
      const cookieStore = cookies();
      const allCookies = cookieStore.getAll();

      // Try direct cookie keys first
      const directToken = cookieStore.get("sb-access-token")?.value ||
                          cookieStore.get("supabase-auth-token")?.value;

      if (directToken) {
        accessToken = directToken;
      } else {
        // Look for pattern sb-*-auth-token
        for (const cookie of allCookies) {
          if (/^sb-.*-auth-token/.test(cookie.name)) {
            try {
              let value = cookie.value;

              // Try to decode if URL encoded
              if (value.includes("%")) {
                try {
                  value = decodeURIComponent(value);
                } catch (e) {
                  // Ignore decode errors
                }
              }

              // Try to parse as JSON (could be array format)
              try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  accessToken = parsed[0];
                } else if (typeof parsed === "object" && parsed.access_token) {
                  // Handle object with access_token field
                  accessToken = parsed.access_token;
                } else if (typeof parsed === "string") {
                  accessToken = parsed;
                }
              } catch (e) {
                // Not JSON, use raw value
                accessToken = value;
              }

              if (accessToken) break;
            } catch (e) {
              continue;
            }
          }
        }
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Get user from access token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Query package_purchases
    const { data: purchases, error: queryError } = await supabaseAdmin
      .from("package_purchases")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .limit(1);

    if (queryError) {
      console.error("[purchase-status] Query error:", queryError);
      return NextResponse.json({ status: "pending" }, { status: 200 });
    }

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ status: "pending" }, { status: 200 });
    }

    const purchase = purchases[0];

    if (purchase.buyer_user_id !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    return NextResponse.json({ status: "paid", purchase }, { status: 200 });
  } catch (error: any) {
    console.error("[purchase-status] Error:", error);
    return NextResponse.json({ status: "pending" }, { status: 200 });
  }
}
