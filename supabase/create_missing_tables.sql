-- ===============================================
-- 创建缺失的表和结构
-- 请按顺序运行这些 SQL 语句
-- ===============================================

-- 1. 创建 gift_redemptions 表（如果不存在）
CREATE TABLE IF NOT EXISTS gift_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL,
  by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS gift_redemptions_gift_card_id_idx ON gift_redemptions (gift_card_id);
CREATE INDEX IF NOT EXISTS gift_redemptions_by_email_idx ON gift_redemptions (by_email);
CREATE INDEX IF NOT EXISTS gift_redemptions_created_at_idx ON gift_redemptions (created_at);

-- 2. 确保 gift_cards 表有所有必需的列
DO $$
BEGIN
    -- 添加 payment_intent_id 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gift_cards' AND column_name = 'payment_intent_id'
    ) THEN
        ALTER TABLE gift_cards ADD COLUMN payment_intent_id TEXT;
        CREATE INDEX IF NOT EXISTS gift_cards_payment_intent_id_idx ON gift_cards (payment_intent_id);
    END IF;

    -- 添加 stripe_session_id 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gift_cards' AND column_name = 'stripe_session_id'
    ) THEN
        ALTER TABLE gift_cards ADD COLUMN stripe_session_id TEXT;
        CREATE INDEX IF NOT EXISTS gift_cards_stripe_session_id_idx ON gift_cards (stripe_session_id);
    END IF;

    -- 添加 sender_name 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gift_cards' AND column_name = 'sender_name'
    ) THEN
        ALTER TABLE gift_cards ADD COLUMN sender_name TEXT;
    END IF;

    -- 添加 sender_email 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gift_cards' AND column_name = 'sender_email'
    ) THEN
        ALTER TABLE gift_cards ADD COLUMN sender_email TEXT;
        CREATE INDEX IF NOT EXISTS gift_cards_sender_email_idx ON gift_cards (sender_email);
    END IF;

    -- 添加 recipient_name 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gift_cards' AND column_name = 'recipient_name'
    ) THEN
        ALTER TABLE gift_cards ADD COLUMN recipient_name TEXT;
    END IF;

    -- 添加 recipient_email 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gift_cards' AND column_name = 'recipient_email'
    ) THEN
        ALTER TABLE gift_cards ADD COLUMN recipient_email TEXT;
        CREATE INDEX IF NOT EXISTS gift_cards_recipient_email_idx ON gift_cards (recipient_email);
    END IF;

    -- 添加 message 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gift_cards' AND column_name = 'message'
    ) THEN
        ALTER TABLE gift_cards ADD COLUMN message TEXT;
    END IF;

    -- 添加 redeemed_at 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gift_cards' AND column_name = 'redeemed_at'
    ) THEN
        ALTER TABLE gift_cards ADD COLUMN redeemed_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. 创建 classes 表（如果不存在）
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_type TEXT NOT NULL,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 5,
  min_size INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'scheduled',
  coach TEXT,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS classes_type_date_idx ON classes (class_type, class_date);
CREATE INDEX IF NOT EXISTS classes_date_idx ON classes (class_date);
CREATE INDEX IF NOT EXISTS classes_status_idx ON classes (status);

-- 创建唯一约束（防止重复创建相同时间的课程）
CREATE UNIQUE INDEX IF NOT EXISTS classes_unique_slot
  ON classes (class_type, class_date, start_time);

-- 4. 确保 class_signups 表有所有必需的列
DO $$
BEGIN
    -- 添加 end_time 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'class_signups' AND column_name = 'end_time'
    ) THEN
        ALTER TABLE class_signups ADD COLUMN end_time TIME;
    END IF;

    -- 添加 status 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'class_signups' AND column_name = 'status'
    ) THEN
        ALTER TABLE class_signups ADD COLUMN status TEXT DEFAULT 'signed';
    END IF;

    -- 添加 full_name 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'class_signups' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE class_signups ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- 5. 创建管理员课程视图
CREATE OR REPLACE VIEW v_classes_admin AS
SELECT
    c.id,
    c.class_type,
    c.class_date,
    c.start_time,
    c.end_time,
    c.capacity,
    c.min_size,
    c.status,
    c.coach,
    c.room,
    COALESCE(COUNT(cs.id) FILTER (WHERE cs.status = 'signed'), 0)::INT AS signed_count
FROM classes c
LEFT JOIN class_signups cs ON
    c.class_type = cs.class_type AND
    c.class_date = cs.class_date AND
    c.start_time = cs.start_time
GROUP BY c.id, c.class_type, c.class_date, c.start_time, c.end_time,
         c.capacity, c.min_size, c.status, c.coach, c.room;

-- 6. 创建触发器自动更新 gift_card 状态
CREATE OR REPLACE FUNCTION update_gift_card_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 当 remaining_amount 更新时，自动更新状态
    IF NEW.remaining_amount = 0 THEN
        NEW.status = 'redeemed';
        IF NEW.redeemed_at IS NULL THEN
            NEW.redeemed_at = NOW();
        END IF;
    ELSIF NEW.remaining_amount < NEW.amount THEN
        NEW.status = 'partially_used';
    ELSE
        NEW.status = 'active';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS auto_update_gift_card_status ON gift_cards;
CREATE TRIGGER auto_update_gift_card_status
    BEFORE UPDATE OF remaining_amount ON gift_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_gift_card_status();

-- 7. 添加 payment_intent_id 唯一约束（生产环境强烈推荐）
-- 取消注释下面这行以启用幂等性保护
-- CREATE UNIQUE INDEX IF NOT EXISTS gift_cards_payment_intent_id_unique
--   ON gift_cards (payment_intent_id) WHERE payment_intent_id IS NOT NULL;

-- 8. 确保 bookings 表有 payment_intent_id 列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'payment_intent_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN payment_intent_id TEXT;
        CREATE INDEX IF NOT EXISTS bookings_payment_intent_id_idx ON bookings (payment_intent_id);
    END IF;

    -- 添加 deposit_cents 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'deposit_cents'
    ) THEN
        ALTER TABLE bookings ADD COLUMN deposit_cents INT;
    END IF;

    -- 添加 deposit_paid 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'deposit_paid'
    ) THEN
        ALTER TABLE bookings ADD COLUMN deposit_paid BOOLEAN DEFAULT FALSE;
    END IF;

    -- 添加 deposit_paid_at 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'deposit_paid_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN deposit_paid_at TIMESTAMPTZ;
    END IF;

    -- 添加 price_cents 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'price_cents'
    ) THEN
        ALTER TABLE bookings ADD COLUMN price_cents INT;
    END IF;

    -- 添加 refund_cents 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'refund_cents'
    ) THEN
        ALTER TABLE bookings ADD COLUMN refund_cents INT;
    END IF;

    -- 添加 refund_status 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'refund_status'
    ) THEN
        ALTER TABLE bookings ADD COLUMN refund_status TEXT;
    END IF;
END $$;

-- 9. 验证所有表都已创建
SELECT
    'gift_cards' as table_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gift_cards') as exists
UNION ALL
SELECT
    'gift_redemptions',
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gift_redemptions')
UNION ALL
SELECT
    'classes',
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'classes')
UNION ALL
SELECT
    'class_signups',
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'class_signups')
UNION ALL
SELECT
    'bookings',
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings')
UNION ALL
SELECT
    'profiles',
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles');
