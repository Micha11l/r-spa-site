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

-- Gift Cards table (if not exists)
create table if not exists gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- UNIQUE constraint on code
  amount int not null, -- in cents
  remaining_amount int not null,
  status text not null default 'active', -- active | partially_used | redeemed | expired
  stripe_session_id text,
  payment_intent_id text, -- UNIQUE constraint recommended for production
  sender_name text,
  sender_email text,
  recipient_name text,
  recipient_email text,
  message text,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

-- UNIQUE constraint on payment_intent_id (strongly recommended for production)
-- This ensures idempotency: same payment_intent cannot create multiple gift cards
-- Uncomment the following line in production:
-- create unique index if not exists gift_cards_payment_intent_id_unique on gift_cards (payment_intent_id) where payment_intent_id is not null;

-- Index for lookups
create index if not exists gift_cards_code_idx on gift_cards (code);
create index if not exists gift_cards_stripe_session_id_idx on gift_cards (stripe_session_id);
create index if not exists gift_cards_sender_email_idx on gift_cards (sender_email);
create index if not exists gift_cards_recipient_email_idx on gift_cards (recipient_email);

-- Gift Card Redemptions table
create table if not exists gift_redemptions (
  id uuid primary key default gen_random_uuid(),
  gift_card_id uuid not null references gift_cards(id) on delete cascade,
  amount_cents int not null,
  by_email text,
  created_at timestamptz not null default now()
);

create index if not exists gift_redemptions_gift_card_id_idx on gift_redemptions (gift_card_id);
