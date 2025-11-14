-- =============================================
-- 数据库状态检查脚本
-- =============================================
-- 在运行迁移前，先运行这个脚本查看当前状态

-- =============================================
-- 1. 检查所有表
-- =============================================
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- 2. 检查 gift_cards 表结构
-- =============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'gift_cards'
ORDER BY ordinal_position;

-- =============================================
-- 3. 检查 gift_card_transactions 表结构
-- =============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'gift_card_transactions'
ORDER BY ordinal_position;

-- =============================================
-- 4. 检查 bookings 表结构
-- =============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- =============================================
-- 5. 检查所有索引
-- =============================================
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================
-- 6. 检查 RLS 策略
-- =============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================
-- 7. 检查外键约束
-- =============================================
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =============================================
-- 8. 检查触发器
-- =============================================
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =============================================
-- 9. 统计数据
-- =============================================
SELECT
  'bookings' as table_name,
  COUNT(*) as row_count
FROM bookings
UNION ALL
SELECT
  'gift_cards' as table_name,
  COUNT(*) as row_count
FROM gift_cards
UNION ALL
SELECT
  'gift_card_transactions' as table_name,
  COUNT(*) as row_count
FROM gift_card_transactions;
