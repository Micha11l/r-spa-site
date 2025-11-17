-- ==============================================
-- 数据库状态检查脚本
-- ==============================================
-- 运行此脚本以检查你当前数据库的状态
-- 了解哪些表存在、哪些表缺失
-- ==============================================

-- 1. 列出所有表
SELECT
  '📋 所有表列表' as info;

SELECT
  table_name,
  CASE
    WHEN table_name IN ('bookings', 'gift_cards', 'gift_card_transactions', 'profiles') THEN '✅ 保留'
    WHEN table_name IN ('user_wallets', 'wallet_transactions', 'class_signups', 'class_capacity') THEN '🆕 新表（如已存在说明之前已创建）'
    WHEN table_name IN ('services', 'classes', 'class_bookings') THEN '🗑️ 废弃表（建议删除）'
    ELSE '❓ 未知表'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY
  CASE
    WHEN table_name IN ('bookings', 'gift_cards', 'gift_card_transactions', 'profiles') THEN 1
    WHEN table_name IN ('user_wallets', 'wallet_transactions', 'class_signups', 'class_capacity') THEN 2
    WHEN table_name IN ('services', 'classes', 'class_bookings') THEN 3
    ELSE 4
  END,
  table_name;

-- ==============================================

-- 2. 检查每个表的行数
SELECT
  '📊 表数据统计' as info;

SELECT
  'bookings' as table_name,
  COUNT(*) as row_count,
  '✅ 保留' as status
FROM bookings
UNION ALL
SELECT 'gift_cards', COUNT(*), '✅ 保留' FROM gift_cards
UNION ALL
SELECT 'gift_card_transactions', COUNT(*), '✅ 保留' FROM gift_card_transactions
UNION ALL
SELECT 'profiles', COUNT(*), '✅ 保留' FROM profiles
UNION ALL
SELECT 'user_wallets', COUNT(*), '🆕 需要' FROM user_wallets WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_wallets')
UNION ALL
SELECT 'wallet_transactions', COUNT(*), '🆕 需要' FROM wallet_transactions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions')
UNION ALL
SELECT 'class_signups', COUNT(*), '🆕 需要' FROM class_signups WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_signups')
UNION ALL
SELECT 'class_capacity', COUNT(*), '🆕 需要' FROM class_capacity WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_capacity')
UNION ALL
SELECT 'services', COUNT(*), '🗑️ 废弃' FROM services WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services')
UNION ALL
SELECT 'classes', COUNT(*), '🗑️ 废弃' FROM classes WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes')
UNION ALL
SELECT 'class_bookings', COUNT(*), '🗑️ 废弃' FROM class_bookings WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_bookings')
ORDER BY status, table_name;

-- ==============================================

-- 3. 检查缺失的表
SELECT
  '⚠️ 缺失的表（需要创建）' as info;

SELECT
  needed_table as table_name,
  '❌ 缺失，需要创建' as status
FROM (
  SELECT 'user_wallets' as needed_table
  UNION SELECT 'wallet_transactions'
  UNION SELECT 'class_signups'
  UNION SELECT 'class_capacity'
) AS needed
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = needed.needed_table
);

-- ==============================================

-- 4. 检查废弃的表
SELECT
  '🗑️ 废弃的表（建议删除）' as info;

SELECT
  table_name,
  '⚠️ 建议删除' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('services', 'classes', 'class_bookings');

-- ==============================================

-- 5. 检查 gift_cards 表是否有缺失字段
SELECT
  '🔍 检查 gift_cards 表字段' as info;

SELECT
  column_name,
  data_type,
  CASE
    WHEN column_name IN ('id', 'code', 'amount', 'remaining_amount', 'sender_name', 'sender_email', 'status', 'created_at') THEN '✅ 核心字段'
    WHEN column_name IN ('redeemed', 'redeemed_by_user_id', 'wallet_id', 'redeemed_to_wallet') THEN '🆕 钱包兑换字段'
    ELSE '📌 其他字段'
  END as field_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gift_cards'
ORDER BY
  CASE
    WHEN column_name IN ('id', 'code', 'amount', 'remaining_amount') THEN 1
    WHEN column_name IN ('sender_name', 'sender_email', 'status') THEN 2
    WHEN column_name IN ('redeemed', 'redeemed_by_user_id', 'wallet_id', 'redeemed_to_wallet') THEN 3
    ELSE 4
  END,
  column_name;

-- 检查是否缺失钱包相关字段
SELECT
  '⚠️ gift_cards 表缺失的钱包字段' as info;

SELECT
  needed_column as column_name,
  '❌ 缺失，需要添加' as status
FROM (
  SELECT 'redeemed' as needed_column
  UNION SELECT 'redeemed_by_user_id'
  UNION SELECT 'wallet_id'
  UNION SELECT 'redeemed_to_wallet'
) AS needed
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'gift_cards'
    AND column_name = needed.needed_column
);

-- ==============================================

-- 6. 检查 RLS 策略
SELECT
  '🔒 RLS 策略检查' as info;

SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN tablename IN ('user_wallets', 'wallet_transactions', 'class_signups', 'class_capacity')
    THEN '🆕 新表策略'
    ELSE '✅ 现有策略'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==============================================

-- 7. 检查索引
SELECT
  '📇 索引检查' as info;

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'bookings', 'gift_cards', 'gift_card_transactions', 'profiles',
    'user_wallets', 'wallet_transactions', 'class_signups', 'class_capacity'
  )
ORDER BY tablename, indexname;

-- ==============================================

-- 8. 总结报告
SELECT
  '📋 总结报告' as info;

SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_type = 'BASE TABLE') as total_tables,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('bookings', 'gift_cards', 'gift_card_transactions', 'profiles')) as required_tables,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('user_wallets', 'wallet_transactions', 'class_signups', 'class_capacity')) as new_tables,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('services', 'classes', 'class_bookings')) as deprecated_tables;

-- ==============================================

SELECT '✅ 检查完成！' as info;
SELECT '请查看以上结果，了解你的数据库当前状态' as next_step;
