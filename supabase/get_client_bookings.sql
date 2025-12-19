-- Function to get client bookings using indexed email lookup
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_client_bookings(client_email text)
RETURNS TABLE (
  id uuid,
  service_name text,
  start_at timestamptz,
  end_at timestamptz,
  status text,
  deposit_paid boolean,
  deposit_cents bigint,
  price_cents bigint,
  notes text,
  created_at timestamptz,
  payment_intent_id text
)
SECURITY DEFINER
LANGUAGE SQL
AS $$
  SELECT
    id,
    service_name,
    start_at,
    end_at,
    status,
    deposit_paid,
    deposit_cents,
    price_cents,
    notes,
    created_at,
    payment_intent_id
  FROM public.bookings
  WHERE lower(trim(customer_email)) = lower(trim(client_email))
  ORDER BY start_at DESC
  LIMIT 30;
$$;

-- Grant execute to service_role
REVOKE ALL ON FUNCTION public.get_client_bookings(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_client_bookings(text) TO service_role;

COMMENT ON FUNCTION public.get_client_bookings(text) IS 'Get recent bookings for a client by email (uses idx_bookings_customer_email_lower)';
