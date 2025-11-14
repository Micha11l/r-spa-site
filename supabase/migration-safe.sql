-- =============================================
-- 安全数据库迁移脚本 - 增量更新
-- =============================================
-- 这个脚本会检查现有表，只添加缺失的部分
-- 适合在已有数据的数据库上运行

-- =============================================
-- 1. 检查并创建 gift_cards 表（如果不存在）
-- =============================================

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  amount INT NOT NULL,
  remaining_amount INT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT,
  purchased_by_email TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  message TEXT,
  is_gift BOOLEAN DEFAULT FALSE,
  redeem_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  payment_intent_id TEXT,
  stripe_session_id TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. 检查并创建 gift_card_transactions 表（如果不存在）
-- =============================================

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL,
  gift_card_code TEXT NOT NULL,
  amount_cents INT NOT NULL,
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  transaction_type TEXT NOT NULL,
  used_by_name TEXT,
  used_by_email TEXT,
  service_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. 添加外键约束（如果不存在）
-- =============================================

-- 检查外键是否已存在，如果不存在则添加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'gift_card_transactions_gift_card_id_fkey'
  ) THEN
    ALTER TABLE gift_card_transactions
      ADD CONSTRAINT gift_card_transactions_gift_card_id_fkey
      FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================
-- 4. 创建索引（如果不存在）
-- =============================================

-- Gift cards 索引
CREATE UNIQUE INDEX IF NOT EXISTS gift_cards_code_idx ON gift_cards (code);
CREATE INDEX IF NOT EXISTS gift_cards_sender_email_idx ON gift_cards (sender_email);
CREATE INDEX IF NOT EXISTS gift_cards_recipient_email_idx ON gift_cards (recipient_email);
CREATE INDEX IF NOT EXISTS gift_cards_status_idx ON gift_cards (status);
CREATE INDEX IF NOT EXISTS gift_cards_payment_intent_idx ON gift_cards (payment_intent_id);
CREATE INDEX IF NOT EXISTS gift_cards_stripe_session_idx ON gift_cards (stripe_session_id);
CREATE INDEX IF NOT EXISTS gift_cards_created_idx ON gift_cards (created_at DESC);

-- Gift card transactions 索引
CREATE INDEX IF NOT EXISTS gift_card_trans_card_id_idx ON gift_card_transactions (gift_card_id);
CREATE INDEX IF NOT EXISTS gift_card_trans_code_idx ON gift_card_transactions (gift_card_code);
CREATE INDEX IF NOT EXISTS gift_card_trans_created_idx ON gift_card_transactions (created_at DESC);

-- =============================================
-- 5. 更新 bookings 表（添加缺失的列）
-- =============================================

-- 添加 start_at 列（如果只有 start_ts）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'start_at'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'start_ts'
  ) THEN
    ALTER TABLE bookings RENAME COLUMN start_ts TO start_at;
  END IF;
END $$;

-- 添加 end_at 列（如果只有 end_ts）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'end_at'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'end_ts'
  ) THEN
    ALTER TABLE bookings RENAME COLUMN end_ts TO end_at;
  END IF;
END $$;

-- 添加缺失的支付相关列
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_cents'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_cents INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_paid'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_paid BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_paid_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_paid_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_intent_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Bookings 索引
CREATE INDEX IF NOT EXISTS bookings_time_idx ON bookings (start_at, end_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);
CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings (customer_email);
CREATE INDEX IF NOT EXISTS bookings_created_idx ON bookings (created_at DESC);

-- =============================================
-- 6. 启用 Row Level Security（RLS）
-- =============================================

-- 启用 RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. 创建 RLS 策略（如果不存在）
-- =============================================

-- Bookings 策略
DO $$
BEGIN
  -- 查看自己的预约
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Users can view own bookings'
  ) THEN
    CREATE POLICY "Users can view own bookings"
      ON bookings FOR SELECT
      USING (
        customer_email = current_setting('request.jwt.claims', true)::json->>'email'
        OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
      );
  END IF;

  -- 创建预约
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Users can create bookings'
  ) THEN
    CREATE POLICY "Users can create bookings"
      ON bookings FOR INSERT
      WITH CHECK (TRUE);
  END IF;

  -- 更新自己的预约
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Users can update own bookings'
  ) THEN
    CREATE POLICY "Users can update own bookings"
      ON bookings FOR UPDATE
      USING (
        customer_email = current_setting('request.jwt.claims', true)::json->>'email'
        OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
      );
  END IF;
END $$;

-- Gift Cards 策略
DO $$
BEGIN
  -- 查看自己的礼品卡
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gift_cards' AND policyname = 'Users can view own gift cards'
  ) THEN
    CREATE POLICY "Users can view own gift cards"
      ON gift_cards FOR SELECT
      USING (
        sender_email = current_setting('request.jwt.claims', true)::json->>'email'
        OR recipient_email = current_setting('request.jwt.claims', true)::json->>'email'
        OR purchased_by_email = current_setting('request.jwt.claims', true)::json->>'email'
        OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
      );
  END IF;

  -- Service role 可以插入
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gift_cards' AND policyname = 'Service role can insert gift cards'
  ) THEN
    CREATE POLICY "Service role can insert gift cards"
      ON gift_cards FOR INSERT
      WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
  END IF;

  -- Service role 可以更新
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gift_cards' AND policyname = 'Service role can update gift cards'
  ) THEN
    CREATE POLICY "Service role can update gift cards"
      ON gift_cards FOR UPDATE
      USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
  END IF;
END $$;

-- Gift Card Transactions 策略
DO $$
BEGIN
  -- 查看自己礼品卡的交易
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gift_card_transactions' AND policyname = 'Users can view own transactions'
  ) THEN
    CREATE POLICY "Users can view own transactions"
      ON gift_card_transactions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM gift_cards
          WHERE gift_cards.id = gift_card_transactions.gift_card_id
          AND (
            gift_cards.sender_email = current_setting('request.jwt.claims', true)::json->>'email'
            OR gift_cards.recipient_email = current_setting('request.jwt.claims', true)::json->>'email'
            OR gift_cards.purchased_by_email = current_setting('request.jwt.claims', true)::json->>'email'
          )
        )
        OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
      );
  END IF;

  -- Service role 可以插入交易
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gift_card_transactions' AND policyname = 'Service role can insert transactions'
  ) THEN
    CREATE POLICY "Service role can insert transactions"
      ON gift_card_transactions FOR INSERT
      WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
  END IF;
END $$;

-- =============================================
-- 8. 创建触发器（自动更新 updated_at）
-- =============================================

-- 创建函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 bookings 添加触发器
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 gift_cards 添加触发器
DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON gift_cards;
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. 授权
-- =============================================

-- 授权给 authenticated 用户
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 授权给 service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================
-- 完成
-- =============================================

-- 验证表结构
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
