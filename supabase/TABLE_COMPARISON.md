# 📊 数据库表对照表

> 对比 `schema-complete.sql` 与实际代码使用情况

---

## 表结构对照

| 表名 | schema-complete.sql | 代码中使用 | 操作建议 | 优先级 |
|------|---------------------|-----------|---------|--------|
| **bookings** | ✅ 已定义 | ✅ 大量使用 | ✅ 保留 | 🔴 必须 |
| **gift_cards** | ✅ 已定义 | ✅ 大量使用 | ⚠️ 保留 + 添加字段 | 🔴 必须 |
| **gift_card_transactions** | ✅ 已定义 | ✅ 使用中 | ✅ 保留 | 🔴 必须 |
| **profiles** | ✅ 已定义 | ✅ 使用中 | ✅ 保留 | 🔴 必须 |
| **user_wallets** | ❌ 未定义 | ✅ 大量使用 | 🆕 需要创建 | 🔴 必须 |
| **wallet_transactions** | ❌ 未定义 | ✅ 大量使用 | 🆕 需要创建 | 🔴 必须 |
| **class_signups** | ❌ 未定义 | ✅ 使用中 | 🆕 需要创建 | 🟡 重要 |
| **class_capacity** | ❌ 未定义 | ✅ 使用中 | 🆕 需要创建 | 🟡 重要 |
| **services** | ✅ 已定义 | ❌ 未使用 | 🗑️ 删除 | 🟢 可选 |
| **classes** | ✅ 已定义 | ❌ 未使用 | 🗑️ 删除 | 🟢 可选 |
| **class_bookings** | ✅ 已定义 | ❌ 未使用 | 🗑️ 删除 | 🟢 可选 |

---

## 详细说明

### ✅ **保留的表**（4个）

#### 1. `bookings` - 预约表
- **状态**: 完全匹配
- **操作**: 无需修改
- **使用频率**: 🔥🔥🔥 极高

#### 2. `gift_cards` - 礼品卡表
- **状态**: 需要添加字段
- **缺失字段**:
  - `redeemed` (BOOLEAN)
  - `redeemed_by_user_id` (UUID)
  - `wallet_id` (UUID)
  - `redeemed_to_wallet` (BOOLEAN)
- **操作**: 运行 ALTER TABLE 添加字段
- **使用频率**: 🔥🔥🔥 极高

#### 3. `gift_card_transactions` - 礼品卡交易
- **状态**: 基本匹配
- **操作**: 无需修改（可能需要添加 `created_by` 字段）
- **使用频率**: 🔥🔥 高

#### 4. `profiles` - 用户资料
- **状态**: 完全匹配
- **注意**: 不再包含 `wallet_balance_cents`，改用 `user_wallets` 表
- **使用频率**: 🔥🔥 高

---

### 🆕 **需要创建的表**（4个）

#### 5. `user_wallets` - 用户钱包
- **原因**: 代码中大量使用，用于存储礼品卡兑换余额
- **字段**:
  ```sql
  id UUID PRIMARY KEY
  user_id UUID UNIQUE (FK to auth.users)
  balance_cents INT
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
  ```
- **使用频率**: 🔥🔥🔥 极高
- **优先级**: 🔴 必须创建

#### 6. `wallet_transactions` - 钱包交易记录
- **原因**: 记录所有钱包余额变动
- **字段**:
  ```sql
  id UUID PRIMARY KEY
  wallet_id UUID (FK to user_wallets)
  type TEXT ('credit' | 'debit')
  amount_cents INT
  balance_after_cents INT
  description TEXT
  reference_type TEXT ('gift_card' | 'booking')
  reference_id UUID
  created_at TIMESTAMPTZ
  ```
- **使用频率**: 🔥🔥 高
- **优先级**: 🔴 必须创建

#### 7. `class_signups` - 课程报名
- **原因**: 替代了旧的 `classes` 和 `class_bookings` 表
- **字段**:
  ```sql
  id UUID PRIMARY KEY
  user_id UUID (FK to auth.users)
  email TEXT
  full_name TEXT
  class_type TEXT ('yoga' | 'meditation')
  class_date DATE
  start_time TIME
  end_time TIME
  created_at TIMESTAMPTZ
  ```
- **使用频率**: 🔥 中等
- **优先级**: 🟡 重要

#### 8. `class_capacity` - 课程容量
- **原因**: 管理每个课程时段的最大容量
- **字段**:
  ```sql
  id UUID PRIMARY KEY
  class_type TEXT
  class_date DATE
  start_time TIME
  end_time TIME
  max_capacity INT (默认5)
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
  ```
- **使用频率**: 🔥 中等
- **优先级**: 🟡 重要

---

### 🗑️ **需要删除的表**（3个）

#### 9. `services` - 服务表
- **原因**: 服务名称现在直接存储在 `bookings.service_name`
- **代码使用**: ❌ 无
- **操作**:
  1. 检查是否有数据
  2. 如有数据，导出保存
  3. DROP TABLE services CASCADE
- **优先级**: 🟢 可选（不影响功能）

#### 10. `classes` - 课程表
- **原因**: 被 `class_signups` 替代
- **代码使用**: ❌ 无
- **操作**: DROP TABLE classes CASCADE
- **优先级**: 🟢 可选

#### 11. `class_bookings` - 课程预约表
- **原因**: 被 `class_signups` 替代
- **代码使用**: ❌ 无
- **操作**: DROP TABLE class_bookings CASCADE
- **优先级**: 🟢 可选

---

## 数据迁移影响分析

### 🔴 **高风险操作**（需要备份）
- 删除 `services`, `classes`, `class_bookings` 表
- 修改 `gift_cards` 表结构（添加字段）

### 🟡 **中风险操作**
- 创建新表和 RLS 策略

### 🟢 **低风险操作**
- 添加索引
- 创建触发器

---

## 代码文件使用情况

### `user_wallets` 表使用的文件：
```
✓ components/account/WalletCard.tsx (查询钱包余额)
✓ components/booking/WalletPayment.tsx (钱包支付)
✓ lib/giftcard/redeem-utils.ts (兑换礼品卡到钱包)
✓ app/account/page.tsx (账户页面)
```

### `wallet_transactions` 表使用的文件：
```
✓ components/account/WalletCard.tsx (显示交易记录)
✓ lib/giftcard/redeem-utils.ts (创建交易记录)
```

### `class_signups` 表使用的文件：
```
✓ app/api/classes/signup/route.ts (课程报名/取消)
✓ app/api/classes/slots/route.ts (查询报名情况)
✓ app/api/classes/manage/route.ts (管理报名)
```

### `class_capacity` 表使用的文件：
```
✓ app/api/classes/signup/route.ts (检查容量)
```

### 未使用的表：
```
✗ services - 无文件引用
✗ classes - 无文件引用
✗ class_bookings - 无文件引用
```

---

## 推荐执行顺序

### Phase 1: 准备工作（必须）
1. ✅ 备份数据库
2. ✅ 检查废弃表数据
3. ✅ 导出重要数据

### Phase 2: 创建新表（必须）
1. 🆕 创建 `user_wallets`
2. 🆕 创建 `wallet_transactions`
3. 🆕 创建 `class_signups`
4. 🆕 创建 `class_capacity`

### Phase 3: 更新现有表（必须）
1. ⚠️ 添加 `gift_cards` 缺失字段

### Phase 4: 配置安全（必须）
1. 🔒 添加 RLS 策略
2. 🔒 配置权限

### Phase 5: 清理废弃表（可选）
1. 🗑️ 删除 `services`
2. 🗑️ 删除 `classes`
3. 🗑️ 删除 `class_bookings`

### Phase 6: 验证（必须）
1. ✅ 测试所有功能
2. ✅ 检查 RLS 策略
3. ✅ 验证数据完整性

---

## 总结

- **总表数**: 8 个（删除 3 个废弃表，添加 4 个新表）
- **必须创建**: 4 个新表
- **必须保留**: 4 个现有表
- **可以删除**: 3 个废弃表
- **需要修改**: 1 个表（gift_cards 添加字段）

**预计执行时间**: 10-15 分钟
**风险等级**: 🟡 中等（有完整备份后风险低）
