-- Recommended indexes for performance optimization
-- Run these in Supabase SQL Editor when ready

-- Index for faster client aggregation by email
-- Improves performance of /api/admin/clients queries
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email_lower
ON public.bookings (lower(trim(customer_email)));

-- Index for filtering by booking status
CREATE INDEX IF NOT EXISTS idx_bookings_status
ON public.bookings (status);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_bookings_start_at
ON public.bookings (start_at);

-- Composite index for common queries (status + date)
CREATE INDEX IF NOT EXISTS idx_bookings_status_start_at
ON public.bookings (status, start_at);
