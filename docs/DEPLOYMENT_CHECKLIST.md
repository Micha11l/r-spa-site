# 🚀 Vercel 生产部署检查清单

## 📋 部署前必读

**预计时间：** 30-45 分钟
**技术栈：** Next.js 14 + Supabase + Stripe + Vercel
**域名：** https://rejuvenessence.org

---

## ✅ 第一步：环境变量配置

### 1.1 复制环境变量模板

```bash
# 查看生产环境需要的所有变量
cat .env.production.example
```

### 1.2 在 Vercel Dashboard 配置

1. 登录 https://vercel.com
2. 进入项目 → **Settings** → **Environment Variables**
3. 逐个添加以下变量（参考 `.env.production.example`）

#### 🔴 必需变量（缺一不可）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE` | Supabase 服务密钥 | `eyJhbGciOiJIUzI1NiIs...` |
| `STRIPE_SECRET_KEY` | Stripe 生产密钥 | `sk_live_xxxxxxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 签名 | `whsec_xxxxxxxxx` |
| `RESEND_API_KEY` | Resend 邮件服务密钥 | `re_xxxxxxxxx` |
| `ADMIN_PASSCODE` | 管理员登录密码 | **强密码！** |
| `ADMIN_ENTRY_TOKEN` | 管理员 URL token | **64位随机字符串** |
| `NEXT_PUBLIC_SITE_URL` | 网站 URL | `https://rejuvenessence.org` |

#### ⚠️ 安全建议

```bash
# 生成强随机 token
openssl rand -hex 32

# 生成强密码（在终端运行）
pwgen -s 20 1
# 或手动创建：至少12位，包含大小写、数字、特殊字符
```

**强密码示例：**
```
Admin!2024$Secure#Pwd  ✅
010519                 ❌ 太简单！
```

**强 Token 示例：**
```
a7f3e8d9c2b1a6f4e7d8c3b2a9f6e5d4c8b7a3f2e1d9c6b5a4f3e2d1c9b8a7f6  ✅
very-long-secret-abc123                                           ❌ 不够随机！
```

---

## ✅ 第二步：Stripe 生产环境配置

### 2.1 切换到 Live Mode

1. 登录 https://dashboard.stripe.com
2. 右上角切换到 **"Live mode"**（不是 Test mode）
3. 进入 **Developers** → **API keys**
4. 复制：
   - **Secret key** (sk_live_xxx) → `STRIPE_SECRET_KEY`
   - **Publishable key** (pk_live_xxx) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 2.2 配置 Webhook（关键步骤）

1. 进入 **Developers** → **Webhooks**
2. 点击 **"Add endpoint"**
3. 配置：
   ```
   Endpoint URL: https://rejuvenessence.org/api/stripe/webhook
   Events to send: checkout.session.completed
   ```
4. 创建后，点击 **"Reveal"** 复制 **Signing secret** (whsec_xxx)
5. 在 Vercel 设置 `STRIPE_WEBHOOK_SECRET`

### 2.3 激活 Stripe 账户

- [ ] 完成企业信息填写
- [ ] 添加银行账户信息
- [ ] 验证身份信息
- [ ] 测试一笔交易（可以自己购买礼品卡测试）

---

## ✅ 第三步：Supabase 安全配置

### 3.1 检查 RLS 策略

1. 登录 https://app.supabase.com
2. 选择你的项目
3. 进入 **Database** → **Tables**
4. 检查每个表的 RLS 状态

**必须启用 RLS 的表：**
- [ ] `bookings` - 预约表
- [ ] `gift_cards` - 礼品卡表
- [ ] `gift_card_transactions` - 交易表
- [ ] `profiles` - 用户资料表
- [ ] `class_bookings` - 课程预约表

### 3.2 运行完整 Schema（如果是新项目）

```sql
-- 在 Supabase Dashboard → SQL Editor 运行
-- 复制 supabase/schema-complete.sql 的内容
```

**⚠️ 警告：** 如果数据库已有数据，先备份！

### 3.3 验证 RLS 策略

```sql
-- 在 SQL Editor 运行
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**应该看到：**
- `bookings` 有 3+ 条策略
- `gift_cards` 有 3+ 条策略
- `profiles` 有 3+ 条策略

### 3.4 检查必要索引

```sql
-- 检查索引
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**关键索引：**
- `gift_cards_code_idx` (UNIQUE)
- `gift_cards_stripe_session_idx`
- `gift_cards_payment_intent_idx`
- `bookings_email_idx`
- `bookings_time_idx`

---

## ✅ 第四步：邮件服务配置

### 4.1 Resend API（主要邮件服务）

1. 登录 https://resend.com
2. 进入 **API Keys**
3. 复制密钥 → Vercel 环境变量 `RESEND_API_KEY`
4. 验证域名（如果还没有）：
   - 进入 **Domains**
   - 添加 `rejuvenessence.org`
   - 配置 DNS 记录（SPF, DKIM, DMARC）

### 4.2 Zoho SMTP（备用）

确认以下环境变量：
```bash
ZOHO_SMTP_HOST=smtp.zohocloud.ca
ZOHO_SMTP_PORT=465
ZOHO_SMTP_USER=michael@nesses.ca
ZOHO_SMTP_PASS=your-app-password
```

### 4.3 测试邮件发送

部署后访问：
```
https://rejuvenessence.org/api/test-email?to=your-email@example.com
```

检查：
- [ ] 邮件送达
- [ ] 不在垃圾邮件
- [ ] PDF 附件正常
- [ ] 邮件样式正常

---

## ✅ 第五步：安全检查

### 5.1 环境变量不泄露

```bash
# 确认以下文件在 .gitignore 中
cat .gitignore | grep -E "\.env"
```

应该看到：
```
.env*
!.env.example
.env.local
```

### 5.2 修改默认密码和 Token

**检查当前值（本地）：**
```bash
# ❌ 如果密码太简单，立即修改
grep ADMIN_PASSCODE .env.local

# ❌ 如果 token 太短或简单，立即修改
grep ADMIN_ENTRY_TOKEN .env.local
```

**生成新值：**
```bash
# 强密码
openssl rand -base64 16

# 强 Token
openssl rand -hex 32
```

### 5.3 修改隐秘路径

```bash
# 当前路径（示例）
/s/very-long-secret-abc123

# 建议修改为（保密！）
/s/$(openssl rand -hex 16)
```

部署后访问：
```
https://rejuvenessence.org/s/your-new-secret-path
```

### 5.4 检查 Middleware 安全

```bash
# 确认 middleware.ts 正确保护管理员路由
cat middleware.ts | grep -A 5 "isAdminArea"
```

---

## ✅ 第六步：性能优化

### 6.1 图片优化

确认使用 Next.js Image 组件：
```tsx
import Image from 'next/image'
```

### 6.2 API 路由缓存

检查 API 路由配置：
```ts
export const runtime = "nodejs";
export const dynamic = 'force-dynamic'; // 不缓存动态数据
```

### 6.3 静态页面生成

```bash
# 检查哪些页面可以预渲染
npm run build
# 查看输出中的 Static 和 Server 标记
```

---

## ✅ 第七步：部署到 Vercel

### 7.1 通过 Git 部署（推荐）

```bash
# 1. 提交所有更改
git add .
git commit -m "Production deployment ready"

# 2. 推送到 GitHub
git push origin main
```

### 7.2 在 Vercel 创建项目

1. 访问 https://vercel.com/new
2. 选择你的 Git 仓库
3. 配置：
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```
4. 点击 **"Deploy"**

### 7.3 配置自定义域名

1. 等待初次部署完成
2. 进入 **Settings** → **Domains**
3. 添加域名：`rejuvenessence.org`
4. 按照提示配置 DNS：

**DNS 配置（在你的域名提供商）：**
```
Type    Name    Value
------  ------  -----------------------
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

5. 等待 DNS 传播（通常 5-60 分钟）
6. Vercel 会自动配置 SSL 证书

---

## ✅ 第八步：部署后测试

### 8.1 基础功能测试

- [ ] 网站能访问：https://rejuvenessence.org
- [ ] SSL 证书有效（绿锁）
- [ ] 首页加载正常
- [ ] 图片显示正常
- [ ] 导航链接工作

### 8.2 预约流程测试

1. [ ] 访问 `/booking`
2. [ ] 选择服务和时间
3. [ ] 填写客户信息
4. [ ] 支付押金（使用测试卡）
5. [ ] 收到确认邮件（客户 + 店主）
6. [ ] Admin 能看到预约

**Stripe 测试卡：**
```
Card: 4242 4242 4242 4242
Expiry: 任意未来日期
CVC: 任意3位数字
```

### 8.3 礼品卡流程测试

#### 测试场景 1：购买自用礼品卡

1. [ ] 访问 `/giftcard/purchase`
2. [ ] 选择 "For myself"
3. [ ] 输入金额：$150
4. [ ] 填写购买人信息
5. [ ] 完成支付
6. [ ] 检查：
   - [ ] Success 页面显示礼品卡
   - [ ] 购买人收到邮件（带 PDF）
   - [ ] Admin 收到通知邮件
   - [ ] Admin Dashboard 看到新礼品卡

#### 测试场景 2：购买礼物礼品卡

1. [ ] 访问 `/giftcard/purchase`
2. [ ] 选择 "As a gift"
3. [ ] 填写收件人信息 + 留言
4. [ ] 完成支付
5. [ ] 检查：
   - [ ] 收件人收到邮件（带 PDF + 留言）
   - [ ] 购买人收到确认邮件
   - [ ] Admin 收到通知（显示 1 张 gift）
   - [ ] PDF 包含个性化留言

#### 测试场景 3：管理员使用礼品卡

1. [ ] 登录 Admin Dashboard
2. [ ] 进入 Gift Cards 标签
3. [ ] 找到测试礼品卡
4. [ ] 点击 "Record Use"
5. [ ] 输入使用金额：$50
6. [ ] 检查：
   - [ ] 余额正确扣减
   - [ ] 交易记录显示
   - [ ] 状态仍为 "Active"（如果有余额）

### 8.4 管理员功能测试

1. [ ] 访问隐秘路径：`/s/your-secret-path`
2. [ ] 输入密码登录
3. [ ] 查看 Bookings 标签
4. [ ] 查看 Gift Cards 标签
5. [ ] 使用搜索功能
6. [ ] 使用过滤功能
7. [ ] 导出数据（如果有）

### 8.5 邮件送达测试

**测试邮箱类型：**
- [ ] Gmail
- [ ] Outlook
- [ ] Yahoo
- [ ] 企业邮箱

**检查项：**
- [ ] 不在垃圾邮件
- [ ] 样式正常
- [ ] PDF 附件能打开
- [ ] 链接可点击
- [ ] 移动端显示正常

---

## ✅ 第九步：监控和日志

### 9.1 启用 Vercel Analytics

1. 进入项目 → **Analytics**
2. 启用 **Speed Insights**
3. 启用 **Web Vitals**

### 9.2 查看函数日志

```
Vercel Dashboard → Deployments → 最新部署 → Functions
```

**常看日志：**
- `/api/stripe/webhook` - Stripe 回调
- `/api/giftcard/checkout` - 礼品卡购买
- `/api/book` - 预约创建

### 9.3 设置错误通知

1. 考虑集成 Sentry：
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

2. 或使用 Vercel 内置错误通知：
   ```
   Settings → Notifications → Error Notifications
   ```

---

## ✅ 第十步：性能优化建议

### 10.1 Lighthouse 测试

```bash
# 在 Chrome DevTools 运行
# 目标分数：
Performance:    > 90
Accessibility:  > 95
Best Practices: > 95
SEO:            > 90
```

### 10.2 优化建议

如果性能不达标：

**性能 < 90：**
- [ ] 优化图片（使用 WebP）
- [ ] 启用图片懒加载
- [ ] 减少 JavaScript 包大小
- [ ] 使用动态导入

**可访问性 < 95：**
- [ ] 添加 alt 文本
- [ ] 改善颜色对比度
- [ ] 添加 ARIA 标签

**SEO < 90：**
- [ ] 添加 meta 描述
- [ ] 优化标题标签
- [ ] 添加结构化数据

---

## 🚨 常见问题排查

### 问题 1：Stripe Webhook 不工作

**症状：** 支付成功但礼品卡未创建

**排查步骤：**
1. 检查 Stripe Dashboard → Webhooks → 查看请求
2. 查看 Vercel 函数日志：
   ```
   Deployments → Functions → /api/stripe/webhook
   ```
3. 确认 `STRIPE_WEBHOOK_SECRET` 正确
4. 测试 webhook：
   ```bash
   # 在 Stripe Dashboard 点击 "Send test webhook"
   ```

**常见原因：**
- ❌ Webhook URL 错误
- ❌ Webhook secret 不匹配
- ❌ 未选择 `checkout.session.completed` 事件

---

### 问题 2：邮件发送失败

**症状：** 用户未收到邮件

**排查步骤：**
1. 检查 Vercel 函数日志
2. 测试 Resend API：
   ```bash
   curl -X POST 'https://api.resend.com/emails' \
     -H 'Authorization: Bearer YOUR_API_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "from": "noreply@rejuvenessence.org",
       "to": "test@example.com",
       "subject": "Test",
       "html": "<p>Test</p>"
     }'
   ```
3. 检查 Resend Dashboard → Logs
4. 检查收件人垃圾邮件文件夹

**常见原因：**
- ❌ API 密钥错误
- ❌ 域名未验证
- ❌ SPF/DKIM 未配置
- ❌ 邮件被标记为垃圾邮件

---

### 问题 3：Admin 无法登录

**症状：** 密码正确但无法登录

**排查步骤：**
1. 清除浏览器 cookies
2. 检查 Vercel 环境变量：
   ```
   Settings → Environment Variables → ADMIN_PASSCODE
   ```
3. 检查 middleware.ts 日志
4. 尝试使用 token URL：
   ```
   https://rejuvenessence.org/admin/login?t=YOUR_TOKEN
   ```

**常见原因：**
- ❌ 环境变量未设置
- ❌ 环境变量值有空格
- ❌ Cookie 设置错误

---

### 问题 4：礼品卡未创建

**症状：** 支付成功但数据库无记录

**排查步骤：**
1. 检查 Webhook 日志：
   ```
   [webhook] Processing gift card purchase
   [webhook] Gift card created: RJ-XXXX-XXXX
   ```
2. 检查 Supabase 日志：
   ```
   Supabase Dashboard → Logs → Postgres Logs
   ```
3. 检查 RLS 策略：
   ```sql
   SELECT * FROM gift_cards; -- 使用 service_role 查询
   ```

**常见原因：**
- ❌ Webhook 未触发
- ❌ Service role key 错误
- ❌ 数据库权限问题
- ❌ RLS 策略过严

---

## 📊 监控指标

### 每天检查

- [ ] Vercel 函数调用次数
- [ ] 错误率
- [ ] 响应时间

### 每周检查

- [ ] 预约数量
- [ ] 礼品卡销售额
- [ ] 邮件送达率
- [ ] 用户增长

### 每月检查

- [ ] 数据库大小
- [ ] Stripe 交易量
- [ ] 性能指标
- [ ] 安全更新

---

## 🔒 安全最佳实践

### 定期更新

```bash
# 每月检查依赖更新
npm outdated

# 更新依赖
npm update

# 检查安全漏洞
npm audit

# 修复漏洞
npm audit fix
```

### 备份策略

1. **数据库备份**（Supabase 自动）
   - 进入 Database → Backups
   - 确认每日备份已启用

2. **手动备份**（重要更新前）
   ```sql
   -- 在 Supabase SQL Editor
   COPY (SELECT * FROM gift_cards) TO '/tmp/gift_cards_backup.csv' CSV HEADER;
   COPY (SELECT * FROM bookings) TO '/tmp/bookings_backup.csv' CSV HEADER;
   ```

3. **代码备份**
   - Git tags for releases:
     ```bash
     git tag -a v1.0.0 -m "Production release 1.0.0"
     git push origin v1.0.0
     ```

---

## ✅ 完成检查清单

### 部署前

- [ ] 所有环境变量已在 Vercel 配置
- [ ] Stripe 切换到 Live mode
- [ ] Webhook URL 已创建并配置
- [ ] Supabase RLS 策略已启用
- [ ] 数据库索引已创建
- [ ] 邮件域名已验证
- [ ] 管理员密码已修改为强密码
- [ ] Admin token 已修改为强随机值
- [ ] 隐秘路径已修改
- [ ] .env.local 已在 .gitignore

### 部署后

- [ ] 网站能正常访问
- [ ] SSL 证书有效
- [ ] 完整测试预约流程
- [ ] 完整测试礼品卡购买
- [ ] 完整测试管理员功能
- [ ] 邮件发送正常
- [ ] PDF 附件正常
- [ ] Webhook 正常工作
- [ ] Lighthouse 分数 > 90
- [ ] 错误监控已启用

---

## 📞 紧急联系

如果遇到严重问题：

1. **回滚部署**
   ```
   Vercel Dashboard → Deployments → 选择上一个稳定版本 → Promote to Production
   ```

2. **启用维护模式**
   ```
   Vercel → Environment Variables → 添加:
   NEXT_PUBLIC_MAINTENANCE=1
   ```

3. **检查日志**
   ```
   Vercel Dashboard → Functions
   Supabase Dashboard → Logs
   Stripe Dashboard → Developers → Events
   ```

---

## 🎉 部署成功后

1. **通知团队**
   - 网站已上线
   - 分享管理员访问方式
   - 分享监控链接

2. **文档更新**
   - 记录域名和访问方式
   - 更新 API 文档
   - 更新运维手册

3. **庆祝！** 🎊

---

**最后更新：** 2024-11-14
**维护者：** Rejuvenessence Dev Team
**技术支持：** Claude Code
