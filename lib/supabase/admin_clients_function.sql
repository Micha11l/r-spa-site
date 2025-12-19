-- admin_clients(): aggregated client list for admin dashboard
-- Security: only service_role can execute
-- Returns: the exact fields your /api/admin/clients expects

create or replace function public.admin_clients()
returns table (
  email text,
  name text,
  phone text,
  total_bookings bigint,
  confirmed_bookings bigint,
  visits bigint,
  last_booking_at timestamptz,
  last_visit_at timestamptz,
  ever_deposit_paid boolean,
  total_deposit_cents bigint,
  marketing_email_opt_in boolean,
  first_name text,
  last_name text,
  user_id uuid,
  cancelled_bookings bigint,
  pending_bookings bigint,
  next_booking_at timestamptz,
  last_service_name text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with booking_clients as (
    select
      lower(trim(b.customer_email)) as email,
      max(nullif(trim(b.customer_name), '')) as booking_name,
      max(nullif(trim(b.customer_phone), '')) as booking_phone,

      count(*)::bigint as total_bookings,
      count(*) filter (where b.status = 'confirmed')::bigint as confirmed_bookings,
      count(*) filter (where b.status = 'confirmed' and b.start_at < now())::bigint as visits,

      count(*) filter (where b.status = 'cancelled')::bigint as cancelled_bookings,
      count(*) filter (where b.status = 'pending')::bigint as pending_bookings,

      max(b.start_at) as last_booking_at,
      max(b.start_at) filter (where b.status = 'confirmed' and b.start_at < now()) as last_visit_at,
      min(b.start_at) filter (where b.start_at > now()) as next_booking_at,

      bool_or(coalesce(b.deposit_paid, false)) as ever_deposit_paid,
      sum(coalesce(b.deposit_cents, 0))::bigint as total_deposit_cents
    from public.bookings b
    where b.customer_email is not null and trim(b.customer_email) <> ''
    group by lower(trim(b.customer_email))
  ),
  last_booking as (
    -- pick the latest booking row per email to get last_service_name
    select distinct on (lower(trim(b.customer_email)))
      lower(trim(b.customer_email)) as email,
      b.service_name as last_service_name
    from public.bookings b
    where b.customer_email is not null and trim(b.customer_email) <> ''
    order by lower(trim(b.customer_email)), b.start_at desc nulls last, b.created_at desc nulls last
  ),
  users_by_email as (
    select u.id as user_id, lower(trim(u.email)) as email
    from auth.users u
    where u.email is not null and trim(u.email) <> ''
  )
  select
    bc.email,

    -- name priority: profiles first/last -> profiles.full_name -> booking_name -> email
    coalesce(
      nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
      nullif(trim(p.full_name), ''),
      nullif(trim(bc.booking_name), ''),
      bc.email
    ) as name,

    -- phone priority: profiles.phone -> booking_phone
    coalesce(
      nullif(trim(p.phone), ''),
      nullif(trim(bc.booking_phone), '')
    ) as phone,

    bc.total_bookings,
    bc.confirmed_bookings,
    bc.visits,
    bc.last_booking_at,
    bc.last_visit_at,
    bc.ever_deposit_paid,
    bc.total_deposit_cents,

    coalesce(p.marketing_email, true) as marketing_email_opt_in,
    p.first_name,
    p.last_name,
    u.user_id,

    bc.cancelled_bookings,
    bc.pending_bookings,
    bc.next_booking_at,
    lb.last_service_name

  from booking_clients bc
  left join users_by_email u on u.email = bc.email
  left join public.profiles p on p.id = u.user_id
  left join last_booking lb on lb.email = bc.email

  order by
    nullif(trim(p.last_name), '') nulls last,
    nullif(trim(p.first_name), '') nulls last,
    name nulls last,
    bc.email;
$$;

-- lock down permissions: ONLY service_role
revoke all on function public.admin_clients() from public;
grant execute on function public.admin_clients() to service_role;