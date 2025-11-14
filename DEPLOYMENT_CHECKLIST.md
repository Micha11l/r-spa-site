# 🚀 Vercel 部署前检查清单

## ✅ 必须完成的任务

### 1. 环境变量配置

#### 🔴 立即修复（关键问题）

**问题：环境变量重复定义**
- `NEXT_PUBLIC_SITE_URL` 在 `.env.local` 中定义了两次
- `RESEND_OWNER_EMAIL` 有冲突的值

**解决方案：**
```bash
# 清理 .env.local，确保每个变量只定义一次
# 生产环境应该使用 https://rejuvenessence.org
NEXT_PUBLIC_SITE_URL=https://rejuvenessence.org
SITE_URL=https://rejuvenessence.org
RESEND_OWNER_EMAIL=booking@nesses.ca
```

#### 📋 Vercel 环境变量设置步骤

1. 登录 Vercel Dashboard
2. 进入你的项目 → Settings → Environment Variables
3. 添加以下环境变量（参考 `.env.production.example`）：

**必需的环境变量：**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY` ⚠️ 使用生产密钥 `sk_live_xxx`
- `STRIPE_WEBHOOK_SECRET` ⚠️ 需要在 Stripe 创建新的 webhook
- `ZOHO_SMTP_USER`
- `ZOHO_SMTP_PASS`
- `ADMIN_PASSCODE` ⚠️ 修改为强密码
- `ADMIN_ENTRY_TOKEN` ⚠️ 使用长随机字符串
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL=https://rejuvenessence.org`

---

### 2. Stripe 配置

#### 🔴 关键：切换到生产模式

**当前状态：使用测试密钥** ⚠️
```bash
STRIPE_SECRET_KEY=sk_test_51SPJ2xGV3uQ0GRgE...  # ❌ 测试密钥
```

**部署前必须：**

1. **获取生产密钥**
   - 登录 Stripe Dashboard
   - 切换到 "Live mode"（右上角）
   - 进入 Developers → API keys
   - 复制 "Secret key" (sk_live_xxx)
   - 复制 "Publishable key" (pk_live_xxx)

2. **配置 Webhook（重要）**
   - 进入 Stripe Dashboard → Developers → Webhooks
   - 点击 "Add endpoint"
   - 设置 URL: `https://rejuvenessence.org/api/stripe/webhook`
   - 选择事件: `checkout.session.completed`
   - 复制 "Signing secret" (whsec_xxx)
   - 在 Vercel 设置 `STRIPE_WEBHOOK_SECRET`

3. **激活 Stripe 账户**
   - 完成 Stripe 账户激活流程
   - 添加银行账户信息（用于接收付款）
   - 验证身份信息

---

### 3. Supabase 安全配置

#### 🔴 关键：检查 RLS 策略

**需要验证的表：**

1. **bookings 表** - 预约数据
   - ✅ 用户只能查看自己的预约
   - ✅ 管理员可以查看所有预约
   - ✅ 防止未授权修改

2. **gift_cards 表** - 礼品卡数据
   - ✅ 用户只能使用自己购买/收到的礼品卡
   - ✅ 管理员可以查看所有礼品卡
   - ✅ 防止礼品卡代码被枚举

3. **profiles 表** - 用户资料
   - ✅ 用户只能读写自己的资料
   - ✅ 防止信息泄露

4. **class_bookings 表** - 课程预约
   - ✅ 用户只能查看自己的课程预约
   - ✅ 防止未授权访问

**检查方法：**
```sql
-- 在 Supabase Dashboard → SQL Editor 运行
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

---

### 4. 安全性检查

#### ✅ 已经做好的安全措施

- ✅ `.env.local` 在 `.gitignore` 中
- ✅ 使用 HttpOnly cookies 存储 admin session
- ✅ Middleware 保护管理员路由
- ✅ 输入验证和清理（gift card 输入）
- ✅ CSRF 保护（Next.js 默认）

#### ⚠️ 需要注意的安全问题

1. **Admin 密码过于简单**
   ```bash
   ADMIN_PASSCODE=010519  # ❌ 太简单，容易被猜到
   ```

   **建议：** 使用强密码（至少 12 位，包含大小写、数字、特殊字符）
   ```bash
   ADMIN_PASSCODE=YourStrong!Password123
   ```

2. **Admin token 需要更新**
   ```bash
   ADMIN_ENTRY_TOKEN=very-long-secret-abc123  # ⚠️ 建议更复杂
   ```

   **生成强 token：**
   ```bash
   # 在终端运行
   openssl rand -hex 32
   ```

3. **隐秘路径需要保密**
   ```bash
   NEXT_PUBLIC_ADMIN_SECRET_PATH=/s/very-long-secret-abc123
   ```
   - ⚠️ 不要分享这个路径
   - ⚠️ 部署后立即修改

---

### 5. 邮件服务配置

#### ✅ 当前配置（Zoho SMTP）

```bash
ZOHO_SMTP_HOST=smtp.zohocloud.ca
ZOHO_SMTP_PORT=465
ZOHO_SMTP_USER=michael@nesses.ca
```

**检查项：**
- ✅ Zoho 账户已激活
- ✅ SMTP 密码正确（`ZOHO_SMTP_PASS`）
- ✅ 发件邮箱域名已验证
- ✅ SPF/DKIM 记录已配置（提高送达率）

**测试邮件发送：**
部署后访问 `/api/test-email` 测试邮件功能

---

### 6. 性能优化建议

#### ✅ 已经优化的部分

- ✅ 静态页面预渲染（SSG）
- ✅ 图片优化（Next.js Image）
- ✅ 代码分割（动态导入）
- ✅ API 路由缓存控制

#### 💡 建议优化

1. **添加图片 CDN**
   - 考虑使用 Vercel Image Optimization（自动）
   - 或配置 Cloudflare CDN

2. **添加监控**
   ```bash
   # 在 Vercel Dashboard 启用：
   # - Analytics（流量分析）
   # - Speed Insights（性能监控）
   # - Web Vitals（用户体验指标）
   ```

3. **数据库索引**
   - 确保 `gift_cards.code` 有索引
   - 确保 `bookings.customer_email` 有索引
   - 确保 `gift_cards.stripe_session_id` 有索引

---

### 7. 错误处理和日志

#### ✅ 已有的错误处理

- ✅ API 错误返回 JSON
- ✅ 前端 toast 提示用户
- ✅ Webhook 错误日志
- ✅ PDF 生成失败处理

#### 💡 建议添加

1. **错误监控服务**
   - Sentry（推荐）
   - LogRocket
   - Datadog

2. **日志聚合**
   - Vercel 自带日志（免费）
   - 或 Papertrail / Logtail

---

### 8. 测试计划

#### 📋 部署后必须测试的功能

**预约流程：**
- [ ] 选择服务和时间
- [ ] 填写客户信息
- [ ] 收到确认邮件（客户 + 店主）
- [ ] Admin 能看到预约
- [ ] 支付押金流程
- [ ] 取消预约

**礼品卡流程：**
- [ ] 购买礼品卡（自用）
- [ ] 购买礼品卡（送人）
- [ ] 收件人收到邮件 + PDF
- [ ] 购买人收到确认邮件
- [ ] 店主收到通知邮件
- [ ] 下载 PDF
- [ ] Success 页面显示礼品卡信息

**管理员功能：**
- [ ] 登录 Admin Dashboard
- [ ] 查看预约列表
- [ ] 查看礼品卡列表
- [ ] 使用礼品卡（扣款）
- [ ] 取消礼品卡

**邮件测试：**
- [ ] 测试邮件送达率
- [ ] 检查垃圾邮件过滤
- [ ] 确认 PDF 附件正常

---

## 🔧 部署步骤

### 方法 1：通过 Vercel Dashboard（推荐）

1. **连接 Git 仓库**
   ```bash
   # 如果还没有 push 代码
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **在 Vercel 创建项目**
   - 访问 https://vercel.com/new
   - 选择你的 Git 仓库
   - Framework Preset: Next.js
   - Root Directory: `./`

3. **配置环境变量**
   - 复制 `.env.production.example` 中的所有变量
   - 在 Vercel → Settings → Environment Variables 添加
   - ⚠️ 确保使用生产环境的值（特别是 Stripe）

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成
   - 访问分配的 URL 测试

5. **配置域名**
   - Vercel → Settings → Domains
   - 添加 `rejuvenessence.org`
   - 按照提示配置 DNS

### 方法 2：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod

# 按照提示配置环境变量
```

---

## 🔍 部署后检查

### 1. 立即检查

- [ ] 网站能正常访问
- [ ] SSL 证书正常（HTTPS）
- [ ] 所有页面能正常加载
- [ ] 图片正常显示
- [ ] API 路由正常工作

### 2. 功能测试

- [ ] 完整测试预约流程
- [ ] 完整测试礼品卡购买
- [ ] 测试管理员登录
- [ ] 测试邮件发送
- [ ] 测试 PDF 生成

### 3. 性能检查

```bash
# 使用 Lighthouse 测试
# Chrome DevTools → Lighthouse → Generate report

# 或使用在线工具
https://pagespeed.web.dev/
```

**目标指标：**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

---

## 🆘 常见问题排查

### Stripe Webhook 不工作

**症状：** 支付成功但礼品卡未创建

**解决方案：**
1. 检查 Stripe Dashboard → Webhooks → 查看请求日志
2. 确认 webhook URL 正确：`https://rejuvenessence.org/api/stripe/webhook`
3. 确认 `STRIPE_WEBHOOK_SECRET` 正确
4. 检查 Vercel 函数日志

### 邮件发送失败

**症状：** 用户未收到邮件

**解决方案：**
1. 检查 Vercel 函数日志
2. 确认 Zoho SMTP 凭证正确
3. 检查收件箱垃圾邮件文件夹
4. 测试 SMTP 连接：
   ```bash
   # 在本地测试
   npm run dev
   # 访问 /api/test-email
   ```

### Admin 无法登录

**症状：** 密码正确但无法登录

**解决方案：**
1. 清除浏览器 cookies
2. 确认 `ADMIN_PASSCODE` 在 Vercel 环境变量中设置正确
3. 检查 middleware 日志
4. 使用隐秘路径：`/s/your-secret-path`

---

## 📊 监控和维护

### 定期检查

**每天：**
- 检查 Vercel 函数日志
- 查看错误率
- 监控 Stripe Dashboard

**每周：**
- 审查预约数据
- 检查礼品卡使用情况
- 审查邮件送达率

**每月：**
- 备份数据库
- 检查安全更新
- 审查性能指标

---

## 🎉 完成部署后

1. **通知团队**
   - 网站已上线
   - 分享管理员访问方式
   - 分享监控仪表板

2. **更新文档**
   - 记录域名和访问方式
   - 更新 Stripe webhook URL
   - 更新邮件配置

3. **备份关键信息**
   - 保存环境变量备份
   - 保存 Stripe 密钥
   - 保存管理员凭证

---

## 📚 有用的资源

- [Vercel 部署文档](https://vercel.com/docs)
- [Next.js 生产部署](https://nextjs.org/docs/deployment)
- [Stripe Webhooks 指南](https://stripe.com/docs/webhooks)
- [Supabase 生产最佳实践](https://supabase.com/docs/guides/platform/going-into-prod)

---

**祝部署顺利！** 🚀

如果遇到问题，检查：
1. Vercel 函数日志
2. Stripe Dashboard
3. Supabase Dashboard → Logs
4. 浏览器控制台
