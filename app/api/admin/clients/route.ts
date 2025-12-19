// app/api/admin/clients/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Get all bookings and aggregate by email
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from("bookings")
      .select("customer_email, customer_name, customer_phone, status, start_at, deposit_paid, deposit_cents")
      .not("customer_email", "is", null);

    if (bookingsError) {
      console.error("[admin/clients] bookings error:", bookingsError);
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, phone, email_notifications");

    if (profilesError) {
      console.error("[admin/clients] profiles error:", profilesError);
      // Non-fatal, continue without profiles
    }

    // Get auth users to map email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("[admin/clients] auth users error:", authError);
      // Non-fatal, continue without auth data
    }

    const authUsers = authData?.users || [];

    // Create email -> user_id map
    const emailToUserId = new Map<string, string>();
    authUsers.forEach(user => {
      if (user.email) {
        emailToUserId.set(user.email.toLowerCase().trim(), user.id);
      }
    });

    // Create user_id -> profile map
    const userIdToProfile = new Map<string, any>();
    (profiles || []).forEach(profile => {
      userIdToProfile.set(profile.id, profile);
    });

    // Aggregate bookings by email
    const clientsMap = new Map<string, any>();

    (bookings || []).forEach(booking => {
      const email = booking.customer_email?.toLowerCase().trim();
      if (!email) return;

      if (!clientsMap.has(email)) {
        const userId = emailToUserId.get(email);
        const profile = userId ? userIdToProfile.get(userId) : null;

        clientsMap.set(email, {
          email,
          booking_name: booking.customer_name,
          booking_phone: booking.customer_phone,
          total_bookings: 0,
          confirmed_bookings: 0,
          visits: 0,
          last_booking_at: null,
          last_visit_at: null,
          ever_deposit_paid: false,
          total_deposit_cents: 0,
          user_id: userId || null,
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          profile_phone: profile?.phone || null,
          marketing_email_opt_in: profile?.email_notifications ?? true,
        });
      }

      const client = clientsMap.get(email);
      client.total_bookings++;

      if (booking.status === "confirmed") {
        client.confirmed_bookings++;
        const startAt = new Date(booking.start_at);
        if (startAt < new Date()) {
          client.visits++;
          if (!client.last_visit_at || startAt > new Date(client.last_visit_at)) {
            client.last_visit_at = booking.start_at;
          }
        }
      }

      const bookingDate = new Date(booking.start_at);
      if (!client.last_booking_at || bookingDate > new Date(client.last_booking_at)) {
        client.last_booking_at = booking.start_at;
        client.booking_name = booking.customer_name; // Update to most recent
        client.booking_phone = booking.customer_phone;
      }

      if (booking.deposit_paid) {
        client.ever_deposit_paid = true;
      }
      client.total_deposit_cents += booking.deposit_cents || 0;
    });

    // Convert to array and format
    const clients = Array.from(clientsMap.values()).map(c => {
      const firstName = c.first_name?.trim() || "";
      const lastName = c.last_name?.trim() || "";
      const profileName = firstName || lastName ? `${firstName} ${lastName}`.trim() : "";

      return {
        email: c.email,
        name: profileName || c.booking_name?.trim() || "",
        phone: c.profile_phone?.trim() || c.booking_phone?.trim() || "",
        total_bookings: c.total_bookings,
        confirmed_bookings: c.confirmed_bookings,
        visits: c.visits,
        last_booking_at: c.last_booking_at,
        last_visit_at: c.last_visit_at,
        ever_deposit_paid: c.ever_deposit_paid,
        total_deposit_cents: c.total_deposit_cents,
        marketing_email_opt_in: c.marketing_email_opt_in,
        first_name: c.first_name,
        last_name: c.last_name,
        user_id: c.user_id,
      };
    });

    // Sort alphabetically by last name, then name, then email
    clients.sort((a, b) => {
      const aLast = a.last_name?.toLowerCase() || "";
      const bLast = b.last_name?.toLowerCase() || "";
      if (aLast && bLast && aLast !== bLast) return aLast.localeCompare(bLast);

      const aName = a.name?.toLowerCase() || "";
      const bName = b.name?.toLowerCase() || "";
      if (aName !== bName) return aName.localeCompare(bName);

      return a.email.localeCompare(b.email);
    });

    return NextResponse.json(clients);
  } catch (e: any) {
    console.error("[admin/clients] error:", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}
