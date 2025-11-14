# 🚀 Vercel 部署完整指南

## 📋 前置准备

在开始之前，确保你已经：
- ✅ 获取了 Stripe 生产密钥（3 个）
- ✅ 填写了 `STRIPE_PRODUCTION_KEYS.txt`
- ✅ 代码已推送到 GitHub

---

## 🎯 步骤 1：登录 Vercel 并创建项目

### 1.1 访问 Vercel
```
https://vercel.com
```

### 1.2 连接 GitHub（如果还没有）
1. 点击右上角头像 → **Settings**
2. 左侧菜单 → **Git**
3. 连接你的 GitHub 账户

### 1.3 创建新项目
1. 点击 **"Add New..."** → **"Project"**
2. 选择你的 Git 仓库：`r-spa-site`
3. 点击 **"Import"**

### 1.4 配置项目设置

**Framework Preset:** Next.js（自动检测）

**Root Directory:** `./`（默认）

**Build Settings:**
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**⚠️ 暂时不要点击 Deploy！** 我们需要先设置环境变量。

---

## 🎯 步骤 2：配置环境变量

### 2.1 进入环境变量页面

在 Vercel 项目配置页面：
1. 点击 **"Environment Variables"** 标签
2. 或者稍后在 **Settings → Environment Variables**

### 2.2 添加 Supabase 变量

**变量 1:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://zaymddjmnasmrwyqgbjd.supabase.co
Environment: Production, Preview, Development（全选）
```

**变量 2:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpheW1kZGptbmFzbXJ3eXFnYmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjA3MjAsImV4cCI6MjA3MjY5NjcyMH0.FJ9mPcOFZg0Q9BtciXRjXASSYptTUcM8_5l5eDzTwQ4
Environment: Production, Preview, Development（全选）
```

**变量 3:**
```
Name: SUPABASE_SERVICE_ROLE
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpheW1kZGptbmFzbXJ3eXFnYmpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEyMDcyMCwiZXhwIjoyMDcyNjk2NzIwfQ.vJnaXjZI9MIOAxbgWrh8kwXjdQVv5iJ017j0NJpJK68
Environment: Production（只选 Production）
```

### 2.3 添加 Stripe 生产变量 🔴

**⚠️ 关键步骤 - 使用刚才获取的生产密钥！**

**变量 4:**
```
Name: STRIPE_SECRET_KEY
Value: sk_live_xxxxxxxxxxxxx（从 STRIPE_PRODUCTION_KEYS.txt 复制）
Environment: Production（只选 Production）
```

**变量 5:**
```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_live_xxxxxxxxxxxxx（从 STRIPE_PRODUCTION_KEYS.txt 复制）
Environment: Production, Preview, Development（全选）
```

**变量 6:**
```
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxx（从 STRIPE_PRODUCTION_KEYS.txt 复制）
Environment: Production（只选 Production）
```

### 2.4 添加邮件服务变量

**变量 7:**
```
Name: RESEND_API_KEY
Value: re_UsMjup5H_62EqhRuASLDz2NLdK2nPNz9L
Environment: Production（只选 Production）
```

**变量 8:**
```
Name: RESEND_OWNER_EMAIL
Value: booking@nesses.ca
Environment: Production（只选 Production）
```

**变量 9:**
```
Name: ZOHO_SMTP_HOST
Value: smtp.zohocloud.ca
Environment: Production（只选 Production）
```

**变量 10:**
```
Name: ZOHO_SMTP_PORT
Value: 465
Environment: Production（只选 Production）
```

**变量 11:**
```
Name: ZOHO_SMTP_USER
Value: michael@nesses.ca
Environment: Production（只选 Production）
```

**变量 12:**
```
Name: ZOHO_SMTP_PASS
Value: SG1BUrN0XUXT
Environment: Production（只选 Production）
```

**变量 13:**
```
Name: ZOHO_FROM_EMAIL
Value: Rejuvenessence <michael@nesses.ca>
Environment: Production（只选 Production）
```

### 2.5 添加站点配置变量

**变量 14:**
```
Name: NEXT_PUBLIC_SITE_URL
Value: https://rejuvenessence.org
Environment: Production, Preview, Development（全选）
```

**变量 15:**
```
Name: SITE_URL
Value: https://rejuvenessence.org
Environment: Production（只选 Production）
```

**变量 16:**
```
Name: SITE_NAME
Value: Rejuvenessence
Environment: Production（只选 Production）
```

**变量 17:**
```
Name: SITE_ADDRESS
Value: 281 Parkwood Ave, Keswick, ON L4P 2X4
Environment: Production（只选 Production）
```

**变量 18:**
```
Name: CONTACT_EMAIL
Value: ryan@nesses.ca
Environment: Production（只选 Production）
```

**变量 19:**
```
Name: TIMEZONE
Value: America/Toronto
Environment: Production（只选 Production）
```

### 2.6 添加 Admin 安全变量

**⚠️ 建议修改为强密码！**

**变量 20:**
```
Name: ADMIN_PASSCODE
Value: 010519（⚠️ 建议改为强密码，如：YourStrong!Pass123）
Environment: Production（只选 Production）
```

**变量 21:**
```
Name: ADMIN_ENTRY_TOKEN
Value: very-long-secret-abc123（⚠️ 建议改为随机字符串）
Environment: Production（只选 Production）
```

**💡 生成强凭证（可选但推荐）：**
```bash
# 在终端运行生成强密码
openssl rand -base64 16

# 生成强 token
openssl rand -hex 32
```

**变量 22:**
```
Name: NEXT_PUBLIC_ADMIN_SECRET_PATH
Value: /s/very-long-secret-abc123（⚠️ 建议修改）
Environment: Production, Preview, Development（全选）
```

### 2.7 添加维护模式变量（可选）

**变量 23:**
```
Name: NEXT_PUBLIC_MAINTENANCE
Value: 0
Environment: Production（只选 Production）
```

---

## 🎯 步骤 3：部署项目

### 3.1 开始部署

1. 检查所有环境变量是否正确
2. 点击 **"Deploy"** 按钮
3. 等待构建完成（通常 2-5 分钟）

### 3.2 查看部署状态

你会看到：
```
Building... ⏳
Testing... ⏳
Deploying... ⏳
Success! ✅
```

### 3.3 获取部署 URL

部署成功后，Vercel 会给你一个 URL：
```
https://your-project-name.vercel.app
```

---

## 🎯 步骤 4：配置自定义域名

### 4.1 添加域名

1. 进入项目 → **Settings** → **Domains**
2. 输入：`rejuvenessence.org`
3. 点击 **"Add"**

### 4.2 配置 DNS

Vercel 会提示你配置 DNS 记录：

**在你的域名提供商（如 Cloudflare、Namecheap 等）添加：**

```
类型      名称     值
─────    ─────    ──────────────────
A        @        76.76.21.21
CNAME    www      cname.vercel-dns.com
```

### 4.3 等待 DNS 生效

- 通常需要 5-60 分钟
- Vercel 会自动配置 SSL 证书
- 完成后你的网站就能通过 `https://rejuvenessence.org` 访问了

---

## 🎯 步骤 5：测试部署

### 5.1 基础测试

- [ ] 访问 `https://rejuvenessence.org`
- [ ] 检查 SSL 证书（绿锁）
- [ ] 首页加载正常
- [ ] 图片显示正常
- [ ] 导航工作正常

### 5.2 功能测试

#### 测试 1：预约流程
```
1. 访问 /booking
2. 选择服务和时间
3. 填写信息
4. 使用测试卡支付（部署初期可以用测试卡）
   卡号：4242 4242 4242 4242
5. 检查是否收到确认邮件
```

#### 测试 2：礼品卡购买
```
1. 访问 /giftcard/purchase
2. 选择金额
3. 填写信息（可以发给自己测试）
4. 完成支付
5. 检查：
   - Success 页面显示礼品卡
   - 收到邮件（带 PDF）
   - Admin 收到通知
```

#### 测试 3：Admin 登录
```
1. 访问隐秘路径：/s/your-secret-path
2. 输入密码登录
3. 检查能看到预约和礼品卡数据
```

### 5.3 Stripe Webhook 测试

**重要：测试 Webhook 是否正常工作**

1. 登录 Stripe Dashboard
2. 进入 **Developers** → **Webhooks**
3. 点击你的生产 webhook
4. 点击 **"Send test webhook"**
5. 选择 `checkout.session.completed`
6. 检查是否成功（状态码 200）

**或者直接测试：**
1. 在网站上购买一张小额礼品卡（$1 测试）
2. 完成支付
3. 检查：
   - Success 页面显示礼品卡
   - 数据库有记录
   - 邮件发送成功

---

## 🎯 步骤 6：监控和优化

### 6.1 启用 Vercel Analytics

1. 项目页面 → **Analytics** 标签
2. 启用 **Speed Insights**
3. 启用 **Web Vitals**

### 6.2 查看函数日志

```
项目 → Deployments → 最新部署 → Functions
```

重点关注：
- `/api/stripe/webhook` - Stripe 回调
- `/api/giftcard/checkout` - 礼品卡购买
- `/api/book` - 预约创建

### 6.3 设置错误通知

```
Settings → Notifications → Error Notifications
```

输入你的邮箱，接收错误报告。

---

## 🚨 常见问题排查

### 问题 1：Webhook 返回 500 错误

**可能原因：**
- Webhook secret 不正确
- 环境变量未设置

**解决方案：**
1. 检查 Vercel 环境变量中的 `STRIPE_WEBHOOK_SECRET`
2. 重新部署：`Deployments → 最新部署 → Redeploy`

---

### 问题 2：邮件未发送

**可能原因：**
- Zoho SMTP 凭证错误
- 邮件服务限额

**解决方案：**
1. 检查函数日志
2. 测试 SMTP 连接
3. 检查 Zoho 邮箱配额

---

### 问题 3：Admin 无法登录

**可能原因：**
- 密码错误
- Cookie 问题

**解决方案：**
1. 清除浏览器 cookies
2. 检查 Vercel 环境变量
3. 使用 token URL：`/admin/login?t=YOUR_TOKEN`

---

## ✅ 部署完成检查清单

### 环境变量（23 个）
- [ ] Supabase keys（3 个）
- [ ] Stripe keys（3 个）✅ 生产密钥
- [ ] Email keys（7 个）
- [ ] Site config（6 个）
- [ ] Admin security（3 个）
- [ ] Maintenance（1 个）

### 功能测试
- [ ] 网站可访问
- [ ] SSL 证书有效
- [ ] 预约流程正常
- [ ] 礼品卡购买正常
- [ ] 邮件发送正常
- [ ] PDF 下载正常
- [ ] Admin 登录正常
- [ ] Webhook 正常工作

### 监控和优化
- [ ] Analytics 已启用
- [ ] 错误通知已设置
- [ ] 函数日志可查看

---

## 🎉 完成！

恭喜！你的网站已经成功部署到生产环境！

**下一步：**
1. 通知团队网站已上线
2. 分享管理员访问方式
3. 监控前几天的运行情况
4. 根据用户反馈优化

**技术支持：**
- Vercel 文档: https://vercel.com/docs
- Stripe 文档: https://stripe.com/docs
- Next.js 文档: https://nextjs.org/docs

---

**部署日期：** _______________
**部署者：** _______________
**域名：** https://rejuvenessence.org
**状态：** 🟢 运行中
