-- =============================================
-- 快速修复脚本 - 添加缺失的列和索引
-- =============================================
-- 专门修复 "column does not exist" 错误

-- =============================================
-- 1. 检查并修复 gift_cards 表
-- =============================================

-- 添加缺失的列（如果不存在）
DO $$
BEGIN
  -- 添加 sender_phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gift_cards' AND column_name = 'sender_phone'
  ) THEN
    ALTER TABLE gift_cards ADD COLUMN sender_phone TEXT;
  END IF;

  -- 添加 is_gift
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gift_cards' AND column_name = 'is_gift'
  ) THEN
    ALTER TABLE gift_cards ADD COLUMN is_gift BOOLEAN DEFAULT FALSE;
  END IF;

  -- 添加 updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gift_cards' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE gift_cards ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- =============================================
-- 2. 创建或修复 gift_card_transactions 表
-- =============================================

-- 先检查表是否存在
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'gift_card_transactions'
  ) THEN
    -- 表不存在，创建它
    CREATE TABLE gift_card_transactions (
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
  ELSE
    -- 表已存在，添加缺失的列

    -- 添加 gift_card_code
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'gift_card_transactions' AND column_name = 'gift_card_code'
    ) THEN
      ALTER TABLE gift_card_transactions ADD COLUMN gift_card_code TEXT;

      -- 从 gift_cards 表填充这个列（如果有关联数据）
      UPDATE gift_card_transactions t
      SET gift_card_code = g.code
      FROM gift_cards g
      WHERE t.gift_card_id = g.id AND t.gift_card_code IS NULL;

      -- 设置为 NOT NULL
      ALTER TABLE gift_card_transactions ALTER COLUMN gift_card_code SET NOT NULL;
    END IF;

    -- 添加 amount_cents（如果缺失）
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'gift_card_transactions' AND column_name = 'amount_cents'
    ) THEN
      ALTER TABLE gift_card_transactions ADD COLUMN amount_cents INT NOT NULL DEFAULT 0;
    END IF;

    -- 添加 balance_before
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'gift_card_transactions' AND column_name = 'balance_before'
    ) THEN
      ALTER TABLE gift_card_transactions ADD COLUMN balance_before INT NOT NULL DEFAULT 0;
    END IF;

    -- 添加 balance_after
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'gift_card_transactions' AND column_name = 'balance_after'
    ) THEN
      ALTER TABLE gift_card_transactions ADD COLUMN balance_after INT NOT NULL DEFAULT 0;
    END IF;

    -- 添加 transaction_type
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'gift_card_transactions' AND column_name = 'transaction_type'
    ) THEN
      ALTER TABLE gift_card_transactions ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'use';
    END IF;
  END IF;
END $$;

-- =============================================
-- 3. 添加外键约束（如果不存在）
-- =============================================

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
-- 5. 启用 RLS（如果未启用）
-- =============================================

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. 创建 RLS 策略（如果不存在）
-- =============================================

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
-- 7. 创建触发器（自动更新 updated_at）
-- =============================================

-- 创建函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 gift_cards 添加触发器
DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON gift_cards;
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 完成 - 验证结果
-- =============================================

-- 显示表结构
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('gift_cards', 'gift_card_transactions')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 显示 RLS 状态
SELECT
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('gift_cards', 'gift_card_transactions');

-- 显示策略
SELECT
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
