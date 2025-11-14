# 🔧 环境变量对比 - 本地 vs 生产

## 📋 快速对比表

| 配置项 | 本地开发 (.env.local) | 生产环境 (Vercel) |
|--------|----------------------|-------------------|
| **网站 URL** | `http://localhost:3000` | `https://rejuvenessence.org` |
| **Stripe 模式** | 🧪 Test mode (`sk_test_xxx`) | 🔴 Live mode (`sk_live_xxx`) |
| **Admin 密码** | 简单密码 (010519) | 🔒 强密码 |
| **Webhook URL** | 本地测试 | `https://rejuvenessence.org/api/stripe/webhook` |
| **邮件测试** | 可以发送真实邮件 | 发送真实邮件 |

---

## ✅ 已完成的清理

### 删除了以下重复项：
- ❌ 重复的 `NEXT_PUBLIC_SITE_URL`
- ❌ 重复的 `RESEND_OWNER_EMAIL`
- ❌ 未使用的 `SUPABASE_ANON_KEY`（已统一为 `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
- ❌ 重复的 `EMAIL_FROM`

### 统一了以下配置：
- ✅ 所有 Site URL 统一为 `http://localhost:3000`（本地）
- ✅ 邮件收件人统一为 `booking@nesses.ca`
- ✅ 清晰的注释和分组

---

## 🔑 关键差异说明

### 1. Stripe 配置

**本地开发（测试模式）：**
```bash
STRIPE_SECRET_KEY=sk_test_51SPJ2xGV3uQ0GRgE...
STRIPE_WEBHOOK_SECRET=whsec_be69d056f1b2b98475...
```

**生产环境（Live 模式）：**
```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # 新的 webhook secret
```

**重要提示：**
- 🧪 本地使用测试卡：`4242 4242 4242 4242`
- 🔴 生产使用真实卡，真实扣款
- ⚠️ Webhook secret 本地和生产不同（需要分别配置）

---

### 2. 网站 URL

**本地开发：**
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

**生产环境：**
```bash
NEXT_PUBLIC_SITE_URL=https://rejuvenessence.org
SITE_URL=https://rejuvenessence.org
```

**影响范围：**
- 邮件中的链接
- Stripe 回调 URL
- PDF 生成的二维码
- Open Graph 元标签

---

### 3. Admin 安全配置

**本地开发（方便测试）：**
```bash
ADMIN_PASSCODE=010519
ADMIN_ENTRY_TOKEN=very-long-secret-abc123
NEXT_PUBLIC_ADMIN_SECRET_PATH=/s/very-long-secret-abc123
```

**生产环境（强安全）：**
```bash
ADMIN_PASSCODE=YourStrong!Password123
ADMIN_ENTRY_TOKEN=a7f3e8d9c2b1a6f4e7d8c3b2a9f6e5d4...  # 64位随机字符串
NEXT_PUBLIC_ADMIN_SECRET_PATH=/s/your-new-secret-path
```

**安全建议：**
- 🔒 生产密码至少 12 位，包含大小写、数字、特殊字符
- 🎲 使用 `openssl rand -hex 32` 生成强 token
- 🤫 不要分享隐秘路径

---

## 📊 配置完整性检查

### ✅ 必需配置（本地和生产都需要）

| 配置项 | 本地 | 生产 | 说明 |
|--------|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | 公开密钥 |
| `SUPABASE_SERVICE_ROLE` | ✅ | ✅ | 服务端密钥 |
| `STRIPE_SECRET_KEY` | ✅ (test) | ✅ (live) | Stripe 密钥 |
| `STRIPE_WEBHOOK_SECRET` | ✅ | ✅ | Webhook 签名 |
| `RESEND_API_KEY` | ✅ | ✅ | Resend 邮件 API |
| `ZOHO_SMTP_USER` | ✅ | ✅ | Zoho 邮箱 |
| `ZOHO_SMTP_PASS` | ✅ | ✅ | Zoho 密码 |
| `ADMIN_PASSCODE` | ✅ | ✅ | 管理员密码 |

---

## 🧪 本地测试指南

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 测试功能

**预约测试：**
```
URL: http://localhost:3000/booking
卡号: 4242 4242 4242 4242
结果: 不会真实扣款
```

**礼品卡测试：**
```
URL: http://localhost:3000/giftcard/purchase
卡号: 4242 4242 4242 4242
结果: 创建测试礼品卡，发送真实邮件
```

**Admin 测试：**
```
URL: http://localhost:3000/s/very-long-secret-abc123
密码: 010519
```

### 3. 检查 Webhook（本地测试）

本地 webhook 测试需要使用 Stripe CLI：

```bash
# 安装 Stripe CLI
brew install stripe/stripe-cli/stripe

# 登录
stripe login

# 转发 webhook 到本地
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 会得到一个 webhook secret，更新 .env.local：
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 🚀 切换到生产模式测试

如果你想在本地测试生产环境的行为：

1. **创建临时环境变量文件：**
```bash
cp .env.local .env.production.local
```

2. **修改为生产配置：**
```bash
# .env.production.local
NEXT_PUBLIC_SITE_URL=https://rejuvenessence.org
STRIPE_SECRET_KEY=sk_live_xxx  # 使用生产密钥
```

3. **运行生产构建：**
```bash
npm run build
npm run start
```

4. **⚠️ 警告：**
   - 使用生产 Stripe 密钥会真实扣款
   - 邮件会发送到真实邮箱
   - 数据会写入生产数据库

---

## 📝 环境变量备份

### 备份本地配置
```bash
# 已自动备份为：
.env.local.backup
```

### 备份生产配置
```bash
# 在 Vercel Dashboard：
Settings → Environment Variables → 复制所有变量到安全位置
```

---

## 🔄 快速切换环境

### 方法 1：使用不同的 .env 文件

```bash
# 本地开发
npm run dev  # 自动加载 .env.local

# 生产测试（本地）
npm run build && npm run start  # 加载 .env.production.local
```

### 方法 2：使用 Vercel CLI

```bash
# 下载生产环境变量
vercel env pull .env.production.local

# 使用生产配置启动本地
vercel dev  # 会使用 Vercel 的环境变量
```

---

## ⚠️ 常见错误

### 错误 1：Webhook 失败

**症状：** 本地支付成功但 webhook 未触发

**原因：** 本地 webhook secret 与 Stripe CLI 不匹配

**解决：**
```bash
# 运行 Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 复制输出的 webhook secret
# 更新 .env.local 中的 STRIPE_WEBHOOK_SECRET
```

---

### 错误 2：邮件 URL 错误

**症状：** 收到的邮件中链接指向 localhost

**原因：** `NEXT_PUBLIC_SITE_URL` 设置错误

**解决：**
```bash
# 本地开发应该使用：
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 不要使用生产 URL
```

---

### 错误 3：环境变量不生效

**症状：** 修改 .env.local 后没有变化

**原因：** Next.js 缓存

**解决：**
```bash
# 重启开发服务器
Ctrl + C
npm run dev

# 或清理缓存
rm -rf .next
npm run dev
```

---

## 📚 相关文档

- [Next.js 环境变量](https://nextjs.org/docs/basic-features/environment-variables)
- [Stripe 测试卡](https://stripe.com/docs/testing)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ 检查清单

### 本地开发准备
- [x] `.env.local` 已清理
- [x] 删除重复变量
- [x] Stripe 使用测试密钥
- [x] Site URL 指向 localhost
- [ ] 测试预约流程
- [ ] 测试礼品卡购买
- [ ] 测试 Admin 登录

### 生产部署准备
- [ ] Vercel 环境变量已配置
- [ ] Stripe 使用生产密钥
- [ ] Webhook URL 已创建
- [ ] Admin 密码已修改为强密码
- [ ] 隐秘路径已修改

---

**最后更新：** 2024-11-14
**维护者：** Dev Team
