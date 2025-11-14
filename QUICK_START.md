# ⚡ 快速开始 - 部署前必读

> 5分钟快速检查清单，确保安全部署到生产环境

---

## 🚨 立即执行（部署前）

### 1️⃣ 生成新的安全凭证

```bash
# 运行凭证生成工具
node scripts/generate-secrets.js

# 📋 复制输出的三个值：
# ADMIN_PASSCODE=...
# ADMIN_ENTRY_TOKEN=...
# NEXT_PUBLIC_ADMIN_SECRET_PATH=/s/...

# 💾 保存到密码管理器（1Password/Bitwarden）
```

**重要：** 不要使用任何简单或默认的密码！

---

### 2️⃣ 配置 Vercel 环境变量

登录 https://vercel.com → 你的项目 → Settings → Environment Variables

**必需的变量（复制 `.env.production.example`）：**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE=eyJhbGc...

# Stripe（⚠️ 必须使用 Live mode 密钥）
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# Admin（使用第1步生成的值）
ADMIN_PASSCODE=<刚生成的强密码>
ADMIN_ENTRY_TOKEN=<刚生成的token>
NEXT_PUBLIC_ADMIN_SECRET_PATH=<刚生成的路径>

# Site
NEXT_PUBLIC_SITE_URL=https://rejuvenessence.org
```

---

### 3️⃣ 配置 Stripe Webhook

1. 登录 https://dashboard.stripe.com
2. 切换到 **Live mode**（右上角）
3. Developers → Webhooks → Add endpoint
4. 配置：
   ```
   URL: https://rejuvenessence.org/api/stripe/webhook
   Events: checkout.session.completed
   ```
5. 复制 **Signing secret** → Vercel 环境变量 `STRIPE_WEBHOOK_SECRET`

---

### 4️⃣ 配置数据库 RLS

1. 登录 https://app.supabase.com
2. 进入你的项目
3. **Database** → **SQL Editor**
4. 打开 `supabase/schema-complete.sql`
5. 复制内容并运行（⚠️ 先备份数据！）

**验证 RLS 已启用：**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- rowsecurity 应该为 't' (true)
```

---

### 5️⃣ 运行环境检查

```bash
# 检查所有环境变量
npm run check-env

# 应该看到：
# ✅ 所有必需变量都配置正确
# ✅ 没有安全警告
```

如果有 ❌ 或 ⚠️，立即修复！

---

## 🚀 部署

### 方法 1：Git 推送（推荐）

```bash
# 推送代码
git push origin main

# Vercel 自动部署
# 访问 https://vercel.com/deployments 查看进度
```

### 方法 2：Vercel CLI

```bash
# 安装 CLI
npm i -g vercel

# 部署
vercel --prod
```

---

## ✅ 部署后测试

### 必须测试的功能

1. **基础访问**
   - [ ] https://rejuvenessence.org 能访问
   - [ ] SSL 证书有效（绿锁）
   - [ ] 所有页面加载正常

2. **预约流程**
   - [ ] 选择服务和时间
   - [ ] 填写信息
   - [ ] 支付成功（使用 4242 4242 4242 4242）
   - [ ] 收到邮件

3. **礼品卡购买**
   - [ ] 购买自用卡（For myself）
   - [ ] 购买礼物卡（As a gift）
   - [ ] 收件人收到邮件（带 PDF）
   - [ ] Admin 收到通知

4. **管理员功能**
   - [ ] 访问 `https://rejuvenessence.org/s/你的隐秘路径`
   - [ ] 使用新密码登录
   - [ ] 查看预约和礼品卡
   - [ ] 使用礼品卡（扣款）

---

## 🔍 快速故障排查

### ❌ Webhook 不工作

```bash
# 1. Stripe Dashboard → Webhooks → 查看请求日志
# 2. Vercel Dashboard → Functions → /api/stripe/webhook
# 3. 检查 STRIPE_WEBHOOK_SECRET 是否正确
```

### ❌ 邮件未收到

```bash
# 1. 检查 Vercel Functions 日志
# 2. 检查垃圾邮件文件夹
# 3. Resend Dashboard → Logs
```

### ❌ Admin 无法登录

```bash
# 1. 清除浏览器 cookies
# 2. 确认 ADMIN_PASSCODE 在 Vercel 设置正确
# 3. 尝试 token URL: /admin/login?t=YOUR_TOKEN
```

---

## 📚 详细文档

- **完整部署指南** → `DEPLOYMENT_CHECKLIST.md`
- **安全配置** → `SECURITY_FIXES.md`
- **改进总结** → `IMPROVEMENTS_SUMMARY.md`
- **环境变量模板** → `.env.production.example`
- **数据库 Schema** → `supabase/schema-complete.sql`

---

## 🛠️ 有用的命令

```bash
# 检查环境变量
npm run check-env

# 生成新凭证
node scripts/generate-secrets.js

# 部署前完整检查
npm run predeployment

# 部署到生产
npm run deploy
```

---

## ⚠️ 安全提醒

- ❌ 不要在 Git 中提交真实凭证
- ❌ 不要在 Slack/Email 明文分享密码
- ✅ 使用密码管理器保存凭证
- ✅ 启用所有服务的 2FA
- ✅ 每 3 个月轮换一次凭证

---

## 🆘 需要帮助？

1. 查看详细文档（上方链接）
2. 检查 Vercel/Stripe/Supabase 控制台日志
3. 回滚到上一个稳定版本（Vercel → Deployments）

---

**准备好了吗？开始部署！** 🚀

✅ 已生成凭证
✅ 已配置环境变量
✅ 已设置 Stripe Webhook
✅ 已配置数据库 RLS
✅ 已通过环境检查

→ **执行：** `git push origin main`
