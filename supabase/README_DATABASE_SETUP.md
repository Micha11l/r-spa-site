# 数据库设置和修复指南

## 问题概述

1. **PDF 下载问题** - Buffer 类型不匹配 ✅ 已修复
2. **数据库表缺失** - `gift_redemptions` 表不存在

---

## 📋 修复步骤

### 步骤 1: 检查当前数据库结构

在 Supabase SQL Editor 中运行：

```bash
supabase/check_database_structure.sql
```

这个文件包含多个查询，会显示：
- 所有表名
- 每个表的列和数据类型
- 所有索引
- 所有外键约束
- 所有视图

**运行方法：**
1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧 "SQL Editor"
4. 点击 "New query"
5. 复制粘贴 `check_database_structure.sql` 的内容
6. 点击 "Run" 或按 Ctrl/Cmd + Enter
7. **保存查询结果发给我**，这样我可以看到你的确切数据库结构

---

### 步骤 2: 创建缺失的表和结构

在 Supabase SQL Editor 中运行：

```bash
supabase/create_missing_tables.sql
```

这个文件会：
- ✅ 创建 `gift_redemptions` 表
- ✅ 创建 `classes` 表（如果不存在）
- ✅ 添加缺失的列到现有表
- ✅ 创建必要的索引
- ✅ 创建 `v_classes_admin` 视图
- ✅ 创建自动更新礼品卡状态的触发器
- ✅ 验证所有表已正确创建

**重要提示：**
- 这个脚本是**幂等的**（可以多次运行而不会出错）
- 它使用 `IF NOT EXISTS` 确保不会覆盖现有数据
- 它会检查列是否存在后再添加

---

### 步骤 3: 运行礼品卡查询和修复

在 Supabase SQL Editor 中运行：

```bash
supabase/gift_card_queries.sql
```

这个文件包含多个有用的查询：

1. **查看所有礼品卡状态** - 检查哪些卡需要修复
2. **修复状态不一致** - 自动更新错误的状态
3. **查看特定用户的卡** - 按邮箱查询
4. **查看兑换历史** - 完整的兑换记录
5. **统计报表** - 销售和兑换统计
6. **检查数据一致性** - 发现余额错误

**使用方法：**
- 你可以单独运行每个查询（用 `;` 分隔）
- 或者全部运行看所有结果
- 有些查询需要修改邮箱/code 参数

---

## 🔍 如何向我提供数据库结构信息

请运行 `check_database_structure.sql` 中的**第一个查询**：

```sql
-- 1. 查看所有表
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

把结果截图或复制粘贴发给我，格式类似：

```
schemaname | tablename      | tableowner
-----------+----------------+-----------
public     | bookings       | postgres
public     | class_signups  | postgres
public     | profiles       | postgres
public     | gift_cards     | postgres
```

然后运行**每个表的列查询**，例如：

```sql
-- gift_cards 表
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'gift_cards'
ORDER BY ordinal_position;
```

---

## ✅ PDF 下载问题修复详情

已修复的文件：
1. `lib/gift-pdf.tsx` - 改为返回 `Buffer` 而不是 `ArrayBuffer`
2. `app/api/stripe/webhook/route.ts` - 移除了不必要的类型转换

**测试方法：**
1. 购买一张测试礼品卡
2. 在 `/api/giftcard/pdf?code=YOUR-CODE` 下载 PDF
3. 应该能正常下载

---

## 🚨 注意事项

### 生产环境部署前必须做：

1. **启用 payment_intent_id 唯一约束**
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS gift_cards_payment_intent_id_unique
     ON gift_cards (payment_intent_id) WHERE payment_intent_id IS NOT NULL;
   ```

2. **备份数据库**
   - 在 Supabase Dashboard → Database → Backups

3. **测试所有礼品卡功能**
   - 购买
   - 查看
   - 兑换
   - PDF 下载

---

## 📝 常见问题

### Q1: 运行 SQL 时提示 "relation does not exist"
**A:** 表还没有创建，先运行 `create_missing_tables.sql`

### Q2: 礼品卡余额不对
**A:** 运行 `gift_card_queries.sql` 中的查询 7 和 8 来检查和修复

### Q3: PDF 下载返回 500 错误
**A:** 检查服务器日志，确保 `@react-pdf/renderer` 包已安装：
```bash
npm install @react-pdf/renderer
```

### Q4: Webhook 没有创建礼品卡
**A:** 检查：
- Stripe webhook secret 是否正确
- 日志中是否有错误
- `gift_cards` 表是否有必要的列

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. `check_database_structure.sql` 的第一个查询结果
2. 具体的错误消息
3. Supabase 或服务器日志

我会帮你定制修复方案！
