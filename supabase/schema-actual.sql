-- ==============================================
-- Rejuvenessence SPA 实际使用的数据库 Schema
-- ==============================================
-- 此文件包含代码中实际使用的所有表
-- 生成日期: 2025-11-17
-- 使用前请先备份现有数据库
-- ==============================================

-- ==============================================
-- 1. 预约表 (Bookings)
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
-- 2. 礼品卡表 (Gift Cards)
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

  -- Redemption (兑换到钱包)
  redeem_token TEXT, -- For secure redemption link
  token_expires_at TIMESTAMPTZ, -- Token expires after 48h
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_id UUID, -- 关联到 user_wallets
  redeemed_to_wallet BOOLEAN DEFAULT FALSE,

  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  -- Values: unused | active | partially_used | used | redeemed | expired | cancelled

  -- Dates
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Card expires after 2 years

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
CREATE INDEX IF NOT EXISTS gift_cards_redeem_token_idx ON gift_cards (redeem_token);
CREATE INDEX IF NOT EXISTS gift_cards_redeemed_by_idx ON gift_cards (redeemed_by_user_id);
CREATE INDEX IF NOT EXISTS gift_cards_created_idx ON gift_cards (created_at DESC);

-- ==============================================
-- 3. 礼品卡交易表 (Gift Card Transactions)
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
  -- Values: purchase | use | refund | cancel

  -- Usage details (when used at spa)
  used_by_name TEXT,
  used_by_email TEXT,
  service_name TEXT,
  notes TEXT,
  created_by TEXT, -- Staff member ID

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS gift_card_trans_card_id_idx ON gift_card_transactions (gift_card_id);
CREATE INDEX IF NOT EXISTS gift_card_trans_code_idx ON gift_card_transactions (gift_card_code);
CREATE INDEX IF NOT EXISTS gift_card_trans_type_idx ON gift_card_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS gift_card_trans_created_idx ON gift_card_transactions (created_at DESC);

-- ==============================================
-- 4. 用户资料表 (Profiles)
-- ==============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Personal info
  first_name TEXT,
  last_name TEXT,
  phone TEXT,

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
-- 5. 用户钱包表 (User Wallets) ⭐ 新增
-- ==============================================

CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Balance
  balance_cents INT NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user_wallets
CREATE UNIQUE INDEX IF NOT EXISTS user_wallets_user_id_idx ON user_wallets (user_id);
CREATE INDEX IF NOT EXISTS user_wallets_created_idx ON user_wallets (created_at DESC);

-- ==============================================
-- 6. 钱包交易表 (Wallet Transactions) ⭐ 新增
-- ==============================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Wallet reference
  wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,

  -- Transaction details
  type TEXT NOT NULL, -- 'credit' | 'debit'
  amount_cents INT NOT NULL,
  balance_after_cents INT NOT NULL,
  description TEXT,

  -- Reference (what caused this transaction)
  reference_type TEXT, -- 'gift_card' | 'booking' | 'refund'
  reference_id UUID, -- ID of the gift_card or booking

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS wallet_trans_wallet_id_idx ON wallet_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS wallet_trans_type_idx ON wallet_transactions (type);
CREATE INDEX IF NOT EXISTS wallet_trans_reference_idx ON wallet_transactions (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS wallet_trans_created_idx ON wallet_transactions (created_at DESC);

-- ==============================================
-- 7. 课程报名表 (Class Signups) ⭐ 新增
-- ==============================================

CREATE TABLE IF NOT EXISTS class_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User info
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,

  -- Class details
  class_type TEXT NOT NULL, -- 'yoga' | 'meditation' | etc
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for class_signups
CREATE INDEX IF NOT EXISTS class_signups_user_id_idx ON class_signups (user_id);
CREATE INDEX IF NOT EXISTS class_signups_email_idx ON class_signups (email);
CREATE INDEX IF NOT EXISTS class_signups_class_idx ON class_signups (class_type, class_date, start_time);
CREATE INDEX IF NOT EXISTS class_signups_date_idx ON class_signups (class_date);
CREATE INDEX IF NOT EXISTS class_signups_created_idx ON class_signups (created_at DESC);

-- Unique constraint: one user can't signup for the same class twice
CREATE UNIQUE INDEX IF NOT EXISTS class_signups_unique_idx
  ON class_signups (user_id, class_type, class_date, start_time, end_time);

-- ==============================================
-- 8. 课程容量表 (Class Capacity) ⭐ 新增
-- ==============================================

CREATE TABLE IF NOT EXISTS class_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Class details
  class_type TEXT NOT NULL,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Capacity
  max_capacity INT NOT NULL DEFAULT 5,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for class_capacity
CREATE INDEX IF NOT EXISTS class_capacity_class_idx ON class_capacity (class_type, class_date, start_time);
CREATE INDEX IF NOT EXISTS class_capacity_date_idx ON class_capacity (class_date);

-- Unique constraint: one capacity setting per class slot
CREATE UNIQUE INDEX IF NOT EXISTS class_capacity_unique_idx
  ON class_capacity (class_type, class_date, start_time, end_time);

-- ==============================================
-- 9. Row Level Security (RLS) 策略
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_capacity ENABLE ROW LEVEL SECURITY;

-- ========== Bookings RLS ==========

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (
    customer_email = auth.jwt()->>'email'
    OR auth.jwt()->>'role' = 'service_role'
  );

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (
    customer_email = auth.jwt()->>'email'
    OR auth.jwt()->>'role' = 'service_role'
  );

-- ========== Gift Cards RLS ==========

DROP POLICY IF EXISTS "Users can view own gift cards" ON gift_cards;
CREATE POLICY "Users can view own gift cards"
  ON gift_cards FOR SELECT
  USING (
    sender_email = auth.jwt()->>'email'
    OR recipient_email = auth.jwt()->>'email'
    OR purchased_by_email = auth.jwt()->>'email'
    OR auth.jwt()->>'role' = 'service_role'
  );

DROP POLICY IF EXISTS "Service role can insert gift cards" ON gift_cards;
CREATE POLICY "Service role can insert gift cards"
  ON gift_cards FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can update gift cards" ON gift_cards;
CREATE POLICY "Service role can update gift cards"
  ON gift_cards FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- ========== Gift Card Transactions RLS ==========

DROP POLICY IF EXISTS "Users can view own transactions" ON gift_card_transactions;
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

DROP POLICY IF EXISTS "Service role can insert transactions" ON gift_card_transactions;
CREATE POLICY "Service role can insert transactions"
  ON gift_card_transactions FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========== Profiles RLS ==========

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR auth.jwt()->>'role' = 'service_role'
  );

DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ========== User Wallets RLS ==========

DROP POLICY IF EXISTS "Users can view own wallet" ON user_wallets;
CREATE POLICY "Users can view own wallet"
  ON user_wallets FOR SELECT
  USING (
    user_id = auth.uid()
    OR auth.jwt()->>'role' = 'service_role'
  );

DROP POLICY IF EXISTS "Service role can insert wallets" ON user_wallets;
CREATE POLICY "Service role can insert wallets"
  ON user_wallets FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can update wallets" ON user_wallets;
CREATE POLICY "Service role can update wallets"
  ON user_wallets FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- ========== Wallet Transactions RLS ==========

DROP POLICY IF EXISTS "Users can view own wallet transactions" ON wallet_transactions;
CREATE POLICY "Users can view own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_wallets
      WHERE user_wallets.id = wallet_transactions.wallet_id
      AND user_wallets.user_id = auth.uid()
    )
    OR auth.jwt()->>'role' = 'service_role'
  );

DROP POLICY IF EXISTS "Service role can insert wallet transactions" ON wallet_transactions;
CREATE POLICY "Service role can insert wallet transactions"
  ON wallet_transactions FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========== Class Signups RLS ==========

DROP POLICY IF EXISTS "Users can view own class signups" ON class_signups;
CREATE POLICY "Users can view own class signups"
  ON class_signups FOR SELECT
  USING (
    user_id = auth.uid()
    OR email = auth.jwt()->>'email'
    OR auth.jwt()->>'role' = 'service_role'
  );

DROP POLICY IF EXISTS "Users can create class signups" ON class_signups;
CREATE POLICY "Users can create class signups"
  ON class_signups FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own class signups" ON class_signups;
CREATE POLICY "Users can delete own class signups"
  ON class_signups FOR DELETE
  USING (
    user_id = auth.uid()
    OR auth.jwt()->>'role' = 'service_role'
  );

-- ========== Class Capacity RLS ==========

DROP POLICY IF EXISTS "Anyone can view class capacity" ON class_capacity;
CREATE POLICY "Anyone can view class capacity"
  ON class_capacity FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Service role can manage class capacity" ON class_capacity;
CREATE POLICY "Service role can manage class capacity"
  ON class_capacity FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================
-- 10. 触发器 (Triggers)
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
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON gift_cards;
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON user_wallets;
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_capacity_updated_at ON class_capacity;
CREATE TRIGGER update_class_capacity_updated_at
  BEFORE UPDATE ON class_capacity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 11. 数据验证函数
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

DROP TRIGGER IF EXISTS check_gift_card_status ON gift_cards;
CREATE TRIGGER check_gift_card_status
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION validate_gift_card_status();

-- ==============================================
-- 12. 权限设置
-- ==============================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant access to service role (for admin/webhooks)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant access to anon (for public endpoints)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON bookings TO anon;
GRANT INSERT ON bookings TO anon;

-- ==============================================
-- 完成 ✅
-- ==============================================

-- 此 schema 包含所有代码中实际使用的表
-- 移除了废弃的 services, classes, class_bookings 表
-- 添加了缺失的 user_wallets, wallet_transactions, class_signups, class_capacity 表
