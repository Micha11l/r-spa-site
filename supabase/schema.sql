-- Services (optional seed-driven; for MVP we store service_name directly in bookings)
create table if not exists services (
  id bigserial primary key,
  name text not null unique,
  duration_min int not null default 60,
  price_cents int,
  active boolean not null default true
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  start_ts timestamptz not null,
  end_ts timestamptz not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  notes text,
  status text not null default 'pending', -- pending | confirmed | cancelled | completed
  created_at timestamptz not null default now()
);

-- Basic index for overlap queries
create index if not exists bookings_time_idx on bookings (start_ts, end_ts);
create index if not exists bookings_status_idx on bookings (status);
