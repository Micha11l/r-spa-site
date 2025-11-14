-- ==============================================
-- Rejuvenessence SPA 完整数据库 Schema
-- ==============================================
-- 包含所有表定义、索引、RLS 策略
-- 使用前请先备份现有数据库

-- ==============================================
-- 1. 服务表 (Services)
-- ==============================================

CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  duration_min INT NOT NULL DEFAULT 60,
  price_cents INT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================
-- 2. 预约表 (Bookings)
-- ==============================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Service details
  service_name TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT,

  -- Payment
  deposit_cents INT DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_paid_at TIMESTAMPTZ,
  payment_intent_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Values: pending | confirmed | cancelled | completed

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS bookings_time_idx ON bookings (start_at, end_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);
CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings (customer_email);
CREATE INDEX IF NOT EXISTS bookings_created_idx ON bookings (created_at DESC);

-- ==============================================
-- 3. 礼品卡表 (Gift Cards)
-- ==============================================

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gift card code (RJ-XXXX-XXXX)
  code TEXT NOT NULL UNIQUE,

  -- Amount
  amount INT NOT NULL, -- Original amount in cents
  remaining_amount INT NOT NULL, -- Remaining balance in cents

  -- Sender info (购买人)
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT,
  purchased_by_email TEXT, -- For tracking

  -- Recipient info (收件人 - 如果是礼物)
  recipient_name TEXT,
  recipient_email TEXT,
  message TEXT,
  is_gift BOOLEAN DEFAULT FALSE,

  -- Redemption
  redeem_token TEXT, -- For secure redemption link
  token_expires_at TIMESTAMPTZ, -- Token expires after 48h

  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  -- Values: active | used | cancelled | expired

  -- Dates
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Card expires after 2 years
  redeemed_at TIMESTAMPTZ,

  -- Payment
  payment_intent_id TEXT,
  stripe_session_id TEXT,
  session_id TEXT, -- Legacy field

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for gift_cards
CREATE UNIQUE INDEX IF NOT EXISTS gift_cards_code_idx ON gift_cards (code);
CREATE INDEX IF NOT EXISTS gift_cards_sender_email_idx ON gift_cards (sender_email);
CREATE INDEX IF NOT EXISTS gift_cards_recipient_email_idx ON gift_cards (recipient_email);
CREATE INDEX IF NOT EXISTS gift_cards_status_idx ON gift_cards (status);
CREATE INDEX IF NOT EXISTS gift_cards_payment_intent_idx ON gift_cards (payment_intent_id);
CREATE INDEX IF NOT EXISTS gift_cards_stripe_session_idx ON gift_cards (stripe_session_id);
CREATE INDEX IF NOT EXISTS gift_cards_created_idx ON gift_cards (created_at DESC);

-- ==============================================
-- 4. 礼品卡交易表 (Gift Card Transactions)
-- ==============================================

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gift card reference
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  gift_card_code TEXT NOT NULL,

  -- Transaction details
  amount_cents INT NOT NULL, -- Amount used (negative for refunds)
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,

  -- Transaction type
  transaction_type TEXT NOT NULL,
  -- Values: purchase | use | refund | cancellation

  -- Usage details (when used at spa)
  used_by_name TEXT,
  used_by_email TEXT,
  service_name TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS gift_card_trans_card_id_idx ON gift_card_transactions (gift_card_id);
CREATE INDEX IF NOT EXISTS gift_card_trans_code_idx ON gift_card_transactions (gift_card_code);
CREATE INDEX IF NOT EXISTS gift_card_trans_created_idx ON gift_card_transactions (created_at DESC);

-- ==============================================
-- 5. 用户资料表 (Profiles)
-- ==============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Personal info
  first_name TEXT,
  last_name TEXT,
  phone TEXT,

  -- Wallet balance (for redeemed gift cards)
  wallet_balance_cents INT DEFAULT 0,

  -- Preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for profiles
CREATE INDEX IF NOT EXISTS profiles_created_idx ON profiles (created_at DESC);

-- ==============================================
-- 6. 课程表 (Classes)
-- ==============================================

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Class details
  title TEXT NOT NULL,
  description TEXT,
  instructor_name TEXT,

  -- Capacity
  max_capacity INT NOT NULL DEFAULT 10,
  current_bookings INT DEFAULT 0,

  -- Timing
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  duration_min INT NOT NULL DEFAULT 60,

  -- Pricing
  price_cents INT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled',
  -- Values: scheduled | full | cancelled | completed

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for classes
CREATE INDEX IF NOT EXISTS classes_start_idx ON classes (start_at);
CREATE INDEX IF NOT EXISTS classes_status_idx ON classes (status);
CREATE INDEX IF NOT EXISTS classes_created_idx ON classes (created_at DESC);

-- ==============================================
-- 7. 课程预约表 (Class Bookings)
-- ==============================================

CREATE TABLE IF NOT EXISTS class_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Customer info (denormalized for guests)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,

  -- Payment
  payment_intent_id TEXT,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed',
  -- Values: confirmed | cancelled | attended | no_show

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for class_bookings
CREATE INDEX IF NOT EXISTS class_bookings_class_idx ON class_bookings (class_id);
CREATE INDEX IF NOT EXISTS class_bookings_user_idx ON class_bookings (user_id);
CREATE INDEX IF NOT EXISTS class_bookings_email_idx ON class_bookings (customer_email);
CREATE INDEX IF NOT EXISTS class_bookings_status_idx ON class_bookings (status);

-- ==============================================
-- 8. Row Level Security (RLS) 策略
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;

-- ========== Bookings RLS ==========

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (
    customer_email = auth.jwt()->>'email'
    OR auth.jwt()->>'role' = 'service_role' -- Admin access
  );

-- Users can insert their own bookings
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (TRUE); -- Anyone can create a booking

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (
    customer_email = auth.jwt()->>'email'
    OR auth.jwt()->>'role' = 'service_role'
  );

-- ========== Gift Cards RLS ==========

-- Users can view gift cards they purchased or received
CREATE POLICY "Users can view own gift cards"
  ON gift_cards FOR SELECT
  USING (
    sender_email = auth.jwt()->>'email'
    OR recipient_email = auth.jwt()->>'email'
    OR purchased_by_email = auth.jwt()->>'email'
    OR auth.jwt()->>'role' = 'service_role'
  );

-- Service role can insert (from webhook)
CREATE POLICY "Service role can insert gift cards"
  ON gift_cards FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Service role can update
CREATE POLICY "Service role can update gift cards"
  ON gift_cards FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- ========== Gift Card Transactions RLS ==========

-- Users can view transactions for their gift cards
CREATE POLICY "Users can view own transactions"
  ON gift_card_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gift_cards
      WHERE gift_cards.id = gift_card_transactions.gift_card_id
      AND (
        gift_cards.sender_email = auth.jwt()->>'email'
        OR gift_cards.recipient_email = auth.jwt()->>'email'
        OR gift_cards.purchased_by_email = auth.jwt()->>'email'
      )
    )
    OR auth.jwt()->>'role' = 'service_role'
  );

-- Service role can insert transactions
CREATE POLICY "Service role can insert transactions"
  ON gift_card_transactions FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========== Profiles RLS ==========

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR auth.jwt()->>'role' = 'service_role'
  );

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ========== Classes RLS ==========

-- Everyone can view active classes
CREATE POLICY "Anyone can view classes"
  ON classes FOR SELECT
  USING (TRUE);

-- Only service role can manage classes
CREATE POLICY "Service role can manage classes"
  ON classes FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ========== Class Bookings RLS ==========

-- Users can view their own class bookings
CREATE POLICY "Users can view own class bookings"
  ON class_bookings FOR SELECT
  USING (
    user_id = auth.uid()
    OR customer_email = auth.jwt()->>'email'
    OR auth.jwt()->>'role' = 'service_role'
  );

-- Users can create class bookings
CREATE POLICY "Users can create class bookings"
  ON class_bookings FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR user_id IS NULL
  );

-- Users can update their own class bookings
CREATE POLICY "Users can update own class bookings"
  ON class_bookings FOR UPDATE
  USING (
    user_id = auth.uid()
    OR auth.jwt()->>'role' = 'service_role'
  );

-- ==============================================
-- 9. 触发器 (Triggers)
-- ==============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_bookings_updated_at
  BEFORE UPDATE ON class_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 10. 数据验证函数 (Optional)
-- ==============================================

-- Function to validate gift card status transitions
CREATE OR REPLACE FUNCTION validate_gift_card_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent reactivating cancelled or used cards
  IF OLD.status IN ('cancelled', 'used') AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Cannot reactivate a cancelled or fully used gift card';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_gift_card_status
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION validate_gift_card_status();

-- ==============================================
-- 完成
-- ==============================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant access to service role (for admin/webhooks)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
