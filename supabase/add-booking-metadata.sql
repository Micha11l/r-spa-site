-- Add structured metadata fields to bookings table
-- For tracking holiday offers, packages, and add-ons

-- Add offer_code column (e.g., "hydro-upgrade", "giftcard-bonus", "refer-friend")
alter table bookings add column if not exists offer_code text;

-- Add package_code column (e.g., "winter_glow", "couples_retreat")
alter table bookings add column if not exists package_code text;

-- Add addons array (e.g., ["sauna", "hot_tub"])
alter table bookings add column if not exists addons text[];

-- Optional: Add index for querying by package_code
create index if not exists bookings_package_code_idx on bookings (package_code) where package_code is not null;

-- Optional: Add index for querying by offer_code
create index if not exists bookings_offer_code_idx on bookings (offer_code) where offer_code is not null;
