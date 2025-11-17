# 🧹 Supabase 数据库清理指南

> **生成日期**: 2025-11-17
> **目的**: 清理废弃表，添加缺失表，使数据库与代码保持一致

---

## 📊 当前数据库问题总结

### ❌ **Schema 中定义但代码未使用的废弃表**
1. `services` - 服务表（服务名现在直接存在 `bookings.service_name`）
2. `classes` - 课程表（被 `class_signups` 替代）
3. `class_bookings` - 课程预约表（被 `class_signups` 替代）

### ⚠️ **代码中使用但 Schema 缺失的表**
1. `user_wallets` - 用户钱包表（大量使用）
2. `wallet_transactions` - 钱包交易记录（大量使用）
3. `class_signups` - 课程报名表（使用中）
4. `class_capacity` - 课程容量表（使用中）

---

## 🎯 清理步骤

### **步骤 1: 备份现有数据库** ⚠️ 必须执行

#### 方法 A: 使用 Supabase Dashboard
1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击 Database → Backups
4. 点击 "Create backup now"

#### 方法 B: 使用 pg_dump（本地备份）
```bash
# 获取数据库连接信息
# 在 Supabase Dashboard → Settings → Database → Connection string

pg_dump "postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres" > backup_$(date +%Y%m%d).sql
```

---

### **步骤 2: 检查废弃表是否有数据**

登录 Supabase Dashboard，运行以下 SQL：

```sql
-- 检查 services 表
SELECT COUNT(*) as services_count FROM services;

-- 检查 classes 表
SELECT COUNT(*) as classes_count FROM classes;

-- 检查 class_bookings 表
SELECT COUNT(*) as class_bookings_count FROM class_bookings;

-- 如果有数据，导出保存
SELECT * FROM services;
SELECT * FROM classes;
SELECT * FROM class_bookings;
```

---

### **步骤 3: 删除废弃表** ⚠️ 确认无重要数据后执行

```sql
-- 删除废弃的表（包括所有依赖关系）
DROP TABLE IF EXISTS class_bookings CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- 验证删除成功
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('services', 'classes', 'class_bookings');
-- 应该返回 0 行
```

---

### **步骤 4: 创建缺失的表**

#### 方法 A: 使用完整 Schema（推荐）

在 Supabase SQL Editor 中运行整个 `schema-actual.sql` 文件：

```bash
# 文件位置: supabase/schema-actual.sql
```

#### 方法 B: 仅创建缺失的表

```sql
-- 1. 用户钱包表
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX user_wallets_user_id_idx ON user_wallets (user_id);
CREATE INDEX user_wallets_created_idx ON user_wallets (created_at DESC);

-- 2. 钱包交易表
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount_cents INT NOT NULL,
  balance_after_cents INT NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX wallet_trans_wallet_id_idx ON wallet_transactions (wallet_id);
CREATE INDEX wallet_trans_type_idx ON wallet_transactions (type);
CREATE INDEX wallet_trans_created_idx ON wallet_transactions (created_at DESC);

-- 3. 课程报名表
CREATE TABLE IF NOT EXISTS class_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  class_type TEXT NOT NULL,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX class_signups_user_id_idx ON class_signups (user_id);
CREATE INDEX class_signups_class_idx ON class_signups (class_type, class_date, start_time);
CREATE UNIQUE INDEX class_signups_unique_idx
  ON class_signups (user_id, class_type, class_date, start_time, end_time);

-- 4. 课程容量表
CREATE TABLE IF NOT EXISTS class_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_type TEXT NOT NULL,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX class_capacity_class_idx ON class_capacity (class_type, class_date, start_time);
CREATE UNIQUE INDEX class_capacity_unique_idx
  ON class_capacity (class_type, class_date, start_time, end_time);
```

---

### **步骤 5: 添加 RLS 策略**

```sql
-- Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_capacity ENABLE ROW LEVEL SECURITY;

-- User Wallets RLS
CREATE POLICY "Users can view own wallet"
  ON user_wallets FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert wallets"
  ON user_wallets FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update wallets"
  ON user_wallets FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- Wallet Transactions RLS
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

CREATE POLICY "Service role can insert wallet transactions"
  ON wallet_transactions FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Class Signups RLS
CREATE POLICY "Users can view own class signups"
  ON class_signups FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can create class signups"
  ON class_signups FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own class signups"
  ON class_signups FOR DELETE
  USING (user_id = auth.uid() OR auth.jwt()->>'role' = 'service_role');

-- Class Capacity RLS
CREATE POLICY "Anyone can view class capacity"
  ON class_capacity FOR SELECT
  USING (TRUE);

CREATE POLICY "Service role can manage class capacity"
  ON class_capacity FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

---

### **步骤 6: 更新 gift_cards 表（添加缺失字段）**

```sql
-- 添加钱包兑换相关字段（如果不存在）
ALTER TABLE gift_cards
ADD COLUMN IF NOT EXISTS redeemed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS redeemed_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS wallet_id UUID,
ADD COLUMN IF NOT EXISTS redeemed_to_wallet BOOLEAN DEFAULT FALSE;

-- 添加索引
CREATE INDEX IF NOT EXISTS gift_cards_redeemed_by_idx ON gift_cards (redeemed_by_user_id);
```

---

### **步骤 7: 验证清理结果**

```sql
-- 1. 列出所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 应该看到以下 8 个表：
-- ✓ bookings
-- ✓ class_capacity
-- ✓ class_signups
-- ✓ gift_card_transactions
-- ✓ gift_cards
-- ✓ profiles
-- ✓ user_wallets
-- ✓ wallet_transactions

-- 2. 检查每个表的行数
SELECT
  'bookings' as table_name, COUNT(*) as row_count FROM bookings
UNION ALL
SELECT 'gift_cards', COUNT(*) FROM gift_cards
UNION ALL
SELECT 'gift_card_transactions', COUNT(*) FROM gift_card_transactions
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'user_wallets', COUNT(*) FROM user_wallets
UNION ALL
SELECT 'wallet_transactions', COUNT(*) FROM wallet_transactions
UNION ALL
SELECT 'class_signups', COUNT(*) FROM class_signups
UNION ALL
SELECT 'class_capacity', COUNT(*) FROM class_capacity;
```

---

## ✅ 验证代码运行

清理完成后，测试以下功能确保一切正常：

1. **预约功能**
   - 创建新预约
   - 查看预约列表
   - 取消预约

2. **礼品卡功能**
   - 购买礼品卡
   - 兑换到钱包
   - 使用礼品卡消费

3. **钱包功能**
   - 查看钱包余额
   - 查看交易记录
   - 使用钱包支付

4. **课程功能**
   - 报名课程
   - 取消报名
   - 查看报名列表

---

## 🔧 故障排查

### 问题 1: RLS 策略冲突

如果看到 "policy already exists" 错误：

```sql
-- 先删除旧策略
DROP POLICY IF EXISTS "policy_name" ON table_name;

-- 然后重新创建
CREATE POLICY "policy_name" ON table_name ...
```

### 问题 2: 外键约束错误

如果删除表时出现外键错误：

```sql
-- 使用 CASCADE 强制删除
DROP TABLE table_name CASCADE;
```

### 问题 3: 权限不足

确保使用 **service_role key** 运行迁移 SQL，而不是 anon key。

---

## 📚 相关文件

- `schema-actual.sql` - 完整的实际使用 Schema（推荐使用）
- `schema-complete.sql` - 旧的 Schema（包含废弃表）
- `MIGRATION_GUIDE.md` - 迁移指南

---

## 🚀 快速执行（一键清理）

如果你确认备份已完成，可以运行完整的 `schema-actual.sql`：

```bash
# 在 Supabase SQL Editor 中
# 复制整个 schema-actual.sql 文件内容并执行
```

这个文件会：
- ✅ 保留现有数据
- ✅ 创建缺失的表
- ✅ 添加所有 RLS 策略
- ✅ 创建所有索引和触发器

**注意**: 需要手动删除废弃表（`services`, `classes`, `class_bookings`）

---

## ✨ 完成！

清理完成后，你的数据库将：
- 只包含代码实际使用的表
- 所有缺失的表都已创建
- RLS 策略完整配置
- 索引优化查询性能

如有问题，请查看 Supabase Dashboard 的日志或联系技术支持。
