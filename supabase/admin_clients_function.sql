-- Admin clients aggregation function
-- Run this in Supabase SQL Editor to create the function

CREATE OR REPLACE FUNCTION public.admin_clients()
RETURNS TABLE (
  email text,
  name text,
  phone text,
  total_bookings bigint,
  confirmed_bookings bigint,
  cancelled_bookings bigint,
  pending_bookings bigint,
  visits bigint,
  last_booking_at timestamptz,
  last_visit_at timestamptz,
  next_booking_at timestamptz,
  last_service_name text,
  ever_deposit_paid boolean,
  total_deposit_cents bigint,
  marketing_email_opt_in boolean,
  first_name text,
  last_name text,
  user_id uuid
)
SECURITY DEFINER
LANGUAGE SQL
AS $$
  WITH booking_clients AS (
    SELECT
      lower(trim(customer_email)) as email,
      max(customer_name) as booking_name,
      max(customer_phone) as booking_phone,
      count(*) as total_bookings,
      count(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
      count(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
      count(*) FILTER (WHERE status = 'pending') as pending_bookings,
      count(*) FILTER (WHERE status = 'confirmed' AND start_at < now()) as visits,
      max(start_at) as last_booking_at,
      max(start_at) FILTER (WHERE status = 'confirmed' AND start_at < now()) as last_visit_at,
      min(start_at) FILTER (WHERE start_at > now()) as next_booking_at,
      bool_or(COALESCE(deposit_paid, false)) as ever_deposit_paid,
      sum(COALESCE(deposit_cents, 0)) as total_deposit_cents,
      (
        SELECT service_name
        FROM public.bookings b2
        WHERE lower(trim(b2.customer_email)) = lower(trim(b.customer_email))
        ORDER BY b2.start_at DESC
        LIMIT 1
      ) as last_service_name
    FROM public.bookings b
    WHERE customer_email IS NOT NULL
      AND trim(customer_email) <> ''
    GROUP BY lower(trim(customer_email))
  ),
  users_by_email AS (
    SELECT
      id as user_id,
      lower(trim(email)) as email
    FROM auth.users
    WHERE email IS NOT NULL
  )
  SELECT
    bc.email,
    COALESCE(
      NULLIF(trim(p.first_name || ' ' || p.last_name), ''),
      NULLIF(trim(bc.booking_name), ''),
      ''
    ) as name,
    COALESCE(
      NULLIF(trim(p.phone), ''),
      NULLIF(trim(bc.booking_phone), ''),
      ''
    ) as phone,
    bc.total_bookings,
    bc.confirmed_bookings,
    bc.cancelled_bookings,
    bc.pending_bookings,
    bc.visits,
    bc.last_booking_at,
    bc.last_visit_at,
    bc.next_booking_at,
    bc.last_service_name,
    bc.ever_deposit_paid,
    bc.total_deposit_cents,
    COALESCE(p.email_notifications, true) as marketing_email_opt_in,
    p.first_name,
    p.last_name,
    u.user_id
  FROM booking_clients bc
  LEFT JOIN users_by_email u ON u.email = bc.email
  LEFT JOIN public.profiles p ON p.id = u.user_id
  ORDER BY
    NULLIF(trim(p.last_name), '') NULLS LAST,
    COALESCE(
      NULLIF(trim(p.first_name || ' ' || p.last_name), ''),
      NULLIF(trim(bc.booking_name), '')
    ) NULLS LAST,
    bc.email;
$$;

-- Grant execute permission to service_role only
REVOKE ALL ON FUNCTION public.admin_clients() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_clients() TO service_role;

-- Optional: Add comment
COMMENT ON FUNCTION public.admin_clients() IS 'Admin-only function to aggregate client data from bookings and profiles';
