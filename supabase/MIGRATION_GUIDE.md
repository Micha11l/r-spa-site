# 🗄️ 数据库迁移指南

当你遇到 `column does not exist` 错误时，说明数据库已有旧表结构。按照以下步骤安全迁移。

---

## ⚠️ 重要提醒

**在运行任何 SQL 前，必须先备份数据库！**

### 备份方法：

1. 登录 https://app.supabase.com
2. 选择你的项目
3. **Database** → **Backups**
4. 点击 **Create Backup**（如果自动备份未启用）
5. 或使用 SQL 导出：
   ```sql
   -- 导出 gift_cards 表
   COPY (SELECT * FROM gift_cards) TO STDOUT WITH CSV HEADER;

   -- 导出 bookings 表
   COPY (SELECT * FROM bookings) TO STDOUT WITH CSV HEADER;
   ```

---

## 📋 迁移步骤

### 第 1 步：检查当前数据库状态

在 **Supabase Dashboard** → **SQL Editor** 中运行：

```sql
-- 复制 supabase/check-database.sql 的内容
-- 或直接运行以下命令：

SELECT tablename, rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**记录输出：**
- 有哪些表？
- RLS 是否启用？
- 有多少行数据？

---

### 第 2 步：运行安全迁移脚本

使用 `migration-safe.sql` 而不是 `schema-complete.sql`。

**在 SQL Editor 中运行：**

1. 打开 `supabase/migration-safe.sql`
2. 复制全部内容
3. 粘贴到 SQL Editor
4. 点击 **Run**

**这个脚本会：**
- ✅ 只创建不存在的表
- ✅ 只添加缺失的列
- ✅ 只创建缺失的索引
- ✅ 安全地启用 RLS
- ✅ 添加必要的策略

---

### 第 3 步：验证迁移结果

运行以下 SQL 验证：

```sql
-- 1. 检查 gift_cards 表结构
\d gift_cards;

-- 或使用：
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'gift_cards'
ORDER BY ordinal_position;

-- 2. 检查 RLS 是否启用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('bookings', 'gift_cards', 'gift_card_transactions');

-- 3. 检查策略
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. 检查数据是否完整
SELECT COUNT(*) FROM gift_cards;
SELECT COUNT(*) FROM bookings;
```

**预期结果：**
- ✅ `gift_cards` 表有所有必需的列
- ✅ RLS 显示为 `t` (true)
- ✅ 每个表至少有 2-3 条策略
- ✅ 数据行数与之前一致

---

## 🔧 常见问题修复

### 问题 1：表已存在但结构不同

**错误信息：**
```
ERROR: column "xxx" of relation "yyy" already exists
```

**解决方案：**
```sql
-- 查看现有列
SELECT column_name FROM information_schema.columns
WHERE table_name = 'gift_cards';

-- 如果缺少某列，手动添加：
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS redeem_token TEXT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
```

---

### 问题 2：外键约束冲突

**错误信息：**
```
ERROR: constraint "xxx" already exists
```

**解决方案：**
```sql
-- 检查现有约束
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'gift_card_transactions';

-- 如果外键已存在但有问题，先删除再重建：
ALTER TABLE gift_card_transactions
DROP CONSTRAINT IF EXISTS gift_card_transactions_gift_card_id_fkey;

ALTER TABLE gift_card_transactions
ADD CONSTRAINT gift_card_transactions_gift_card_id_fkey
FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE;
```

---

### 问题 3：RLS 策略冲突

**错误信息：**
```
ERROR: policy "xxx" for table "yyy" already exists
```

**解决方案：**
```sql
-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;

-- 重新创建
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (
    customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );
```

---

### 问题 4：列名冲突（start_ts vs start_at）

如果你的 bookings 表使用 `start_ts` 和 `end_ts`，但代码使用 `start_at` 和 `end_at`：

**选项 A：重命名列（推荐）**
```sql
ALTER TABLE bookings RENAME COLUMN start_ts TO start_at;
ALTER TABLE bookings RENAME COLUMN end_ts TO end_at;
```

**选项 B：修改代码**
在所有 API 路由中把 `start_at` 改为 `start_ts`

---

## 🆘 如果迁移失败

### 回滚步骤：

1. **从备份恢复**
   - Supabase Dashboard → Database → Backups
   - 选择最近的备份
   - 点击 **Restore**

2. **或手动回滚**
   ```sql
   -- 删除新创建的表（如果是全新的）
   DROP TABLE IF EXISTS gift_card_transactions CASCADE;
   DROP TABLE IF EXISTS gift_cards CASCADE;

   -- 恢复备份数据
   -- (从备份 CSV 导入)
   ```

---

## ✅ 迁移成功后

### 测试数据库功能：

```sql
-- 1. 测试插入礼品卡（使用 service_role key）
INSERT INTO gift_cards (
  code, amount, remaining_amount,
  sender_name, sender_email,
  status
) VALUES (
  'TEST-0001-0001', 10000, 10000,
  'Test User', 'test@example.com',
  'active'
) RETURNING *;

-- 2. 测试查询
SELECT * FROM gift_cards WHERE code = 'TEST-0001-0001';

-- 3. 测试交易记录
INSERT INTO gift_card_transactions (
  gift_card_id, gift_card_code,
  amount_cents, balance_before, balance_after,
  transaction_type
) VALUES (
  (SELECT id FROM gift_cards WHERE code = 'TEST-0001-0001'),
  'TEST-0001-0001',
  5000, 10000, 5000,
  'use'
) RETURNING *;

-- 4. 清理测试数据
DELETE FROM gift_card_transactions WHERE gift_card_code = 'TEST-0001-0001';
DELETE FROM gift_cards WHERE code = 'TEST-0001-0001';
```

---

## 📞 需要帮助？

如果遇到以上未提到的错误：

1. **复制完整错误信息**
2. **运行 `check-database.sql` 并保存输出**
3. **检查 Supabase Dashboard → Logs**
4. **查看 PostgreSQL 版本**
   ```sql
   SELECT version();
   ```

---

## 📚 相关文件

- `migration-safe.sql` - 安全迁移脚本（推荐使用）
- `schema-complete.sql` - 完整 schema（仅用于全新数据库）
- `check-database.sql` - 数据库状态检查
- `schema.sql` - 原始简化 schema

---

**祝迁移顺利！** 🚀

如果迁移成功，记得：
1. ✅ 验证所有功能正常
2. ✅ 测试礼品卡购买流程
3. ✅ 测试预约流程
4. ✅ 测试管理员功能
