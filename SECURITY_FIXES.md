# 🔒 安全配置快速修复指南

## 立即修复的安全问题

根据代码审查，发现以下需要立即修复的安全问题：

---

## 1. 生成强密码和 Token

### 方法 1：使用 OpenSSL（推荐）

```bash
# 生成管理员密码（Base64格式，20字符）
openssl rand -base64 20

# 生成 Admin Token（Hex格式，64字符）
openssl rand -hex 32

# 生成隐秘路径 Token
openssl rand -hex 16
```

**示例输出：**
```bash
# ADMIN_PASSCODE
tK9mL3pQ2wX8yR6vN5jH4fD1sA7z

# ADMIN_ENTRY_TOKEN
a7f3e8d9c2b1a6f4e7d8c3b2a9f6e5d4c8b7a3f2e1d9c6b5a4f3e2d1c9b8a7f6

# SECRET_PATH (添加 /s/ 前缀)
/s/3f8e2d9c1b6a5f4e
```

### 方法 2：使用 Node.js

创建文件 `scripts/generate-secrets.js`：

```javascript
const crypto = require('crypto');

console.log('\n🔐 生成安全凭证\n');
console.log('将以下内容添加到你的 .env.local 或 Vercel 环境变量：\n');
console.log('='.repeat(60));

// Admin Password
const password = crypto.randomBytes(20).toString('base64');
console.log(`ADMIN_PASSCODE=${password}`);

// Admin Token
const token = crypto.randomBytes(32).toString('hex');
console.log(`ADMIN_ENTRY_TOKEN=${token}`);

// Secret Path
const pathToken = crypto.randomBytes(16).toString('hex');
console.log(`NEXT_PUBLIC_ADMIN_SECRET_PATH=/s/${pathToken}`);

console.log('='.repeat(60));
console.log('\n⚠️  重要：立即保存这些值，不会再次显示！\n');
```

运行：
```bash
node scripts/generate-secrets.js
```

---

## 2. 检查当前配置

### 运行环境变量检查

```bash
# 检查所有环境变量
npm run check-env

# 或直接运行
node scripts/check-env.js
```

**预期输出：**
```
🔍 检查环境变量配置...

环境：development

✅ NEXT_PUBLIC_SUPABASE_URL
✅ STRIPE_SECRET_KEY
⚠️  ADMIN_PASSCODE: ❌ 密码太简单！请使用强密码
❌ ADMIN_ENTRY_TOKEN
   说明：管理员URL Token
   示例：64位随机字符串
```

---

## 3. 更新 Vercel 环境变量

### 通过 Dashboard

1. 登录 https://vercel.com
2. 选择项目 → **Settings** → **Environment Variables**
3. 更新以下变量：

```bash
# 删除旧值，添加新值
ADMIN_PASSCODE=<使用上面生成的强密码>
ADMIN_ENTRY_TOKEN=<使用上面生成的 token>
NEXT_PUBLIC_ADMIN_SECRET_PATH=/s/<使用上面生成的路径>
```

4. 选择环境：**Production**, **Preview**, **Development**（全选）
5. 点击 **Save**

### 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 设置环境变量
vercel env add ADMIN_PASSCODE production
# 粘贴新密码

vercel env add ADMIN_ENTRY_TOKEN production
# 粘贴新 token

vercel env add NEXT_PUBLIC_ADMIN_SECRET_PATH production
# 粘贴新路径
```

---

## 4. 重新部署

### 方法 1：触发新部署

```bash
# 提交一个小改动来触发重新部署
git commit --allow-empty -m "Update security credentials"
git push origin main
```

### 方法 2：手动重新部署

1. Vercel Dashboard → **Deployments**
2. 选择最新部署
3. 点击 **⋮** → **Redeploy**
4. 确认 **Redeploy**

---

## 5. 测试新配置

### 测试管理员登录

```bash
# 1. 访问新的隐秘路径
https://rejuvenessence.org/s/YOUR_NEW_SECRET_PATH

# 2. 输入新密码
# 3. 应该能成功登录
```

### 使用 Token 直接登录

```bash
# 访问带 token 的 URL
https://rejuvenessence.org/admin/login?t=YOUR_NEW_TOKEN

# 应该自动跳转到 admin dashboard
```

---

## 6. 其他安全建议

### 6.1 启用 Supabase RLS

确保以下表都启用了 RLS：

```sql
-- 在 Supabase SQL Editor 运行
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### 6.2 添加 Rate Limiting

考虑添加登录尝试限制（可选）：

```typescript
// lib/rate-limit.ts
export async function checkRateLimit(ip: string, action: string): Promise<boolean> {
  // 使用 Upstash Redis 或 Vercel KV
  // 限制每 IP 每分钟最多 5 次登录尝试
}
```

### 6.3 配置 Stripe Webhook IP 白名单

在 Stripe Dashboard：
1. **Settings** → **Webhooks**
2. 选择你的 webhook
3. 启用 **IP allowlist**（可选）

### 6.4 启用 2FA（如果可能）

- Vercel 账户启用 2FA
- GitHub 账户启用 2FA
- Supabase 账户启用 2FA
- Stripe 账户启用 2FA

---

## 7. 定期安全检查清单

### 每月检查

- [ ] 审查 Vercel 访问日志
- [ ] 检查异常登录尝试
- [ ] 更新依赖包：`npm audit fix`
- [ ] 检查 Stripe Dashboard 异常交易
- [ ] 备份数据库

### 每季度检查

- [ ] 轮换管理员密码
- [ ] 轮换 Admin Token
- [ ] 轮换隐秘路径
- [ ] 审查 API 密钥使用
- [ ] 审查用户权限

### 密码轮换流程

```bash
# 1. 生成新凭证
node scripts/generate-secrets.js

# 2. 更新 Vercel 环境变量
vercel env add ADMIN_PASSCODE production

# 3. 通知团队成员

# 4. 重新部署
git commit --allow-empty -m "Rotate security credentials"
git push

# 5. 验证新凭证工作正常

# 6. 删除旧凭证记录
```

---

## 8. 应急响应计划

### 如果怀疑凭证泄露

1. **立即轮换所有凭证**
   ```bash
   # 运行生成脚本
   node scripts/generate-secrets.js

   # 更新所有环境变量
   # 重新部署
   ```

2. **检查访问日志**
   ```bash
   # Vercel Dashboard → Analytics → Logs
   # 查找异常访问模式
   ```

3. **启用维护模式**
   ```bash
   # Vercel → Environment Variables
   NEXT_PUBLIC_MAINTENANCE=1
   ```

4. **通知团队**
   - 发送安全警报
   - 说明受影响范围
   - 提供新凭证

### 如果发现未授权访问

1. **立即撤销访问**
   - 轮换所有密码和 token
   - 检查 Supabase 用户列表
   - 检查 Stripe API 密钥使用

2. **审查变更**
   ```bash
   # 检查 Git 历史
   git log --all --oneline -20

   # 检查数据库变更
   # Supabase Dashboard → Database → Query logs
   ```

3. **恢复数据（如需要）**
   ```sql
   -- 从备份恢复
   -- Supabase Dashboard → Database → Backups
   ```

---

## 9. 安全配置检查表

### ✅ 完成后检查

- [ ] 管理员密码已修改（≥12位，包含大小写、数字、特殊字符）
- [ ] Admin Token 已修改（64位随机字符串）
- [ ] 隐秘路径已修改（随机生成）
- [ ] Vercel 环境变量已更新
- [ ] 已重新部署
- [ ] 测试新密码登录成功
- [ ] 测试 token URL 登录成功
- [ ] 旧凭证已删除/失效
- [ ] 团队成员已通知
- [ ] 凭证已安全保存（密码管理器）

### 🔐 密码管理器推荐

- **1Password**（团队版）
- **Bitwarden**（开源）
- **LastPass**（企业版）

---

## 10. 联系支持

如需帮助：

1. **Vercel Support**: https://vercel.com/support
2. **Stripe Support**: https://support.stripe.com
3. **Supabase Support**: https://supabase.com/support

---

**重要提醒：**
- ✅ 所有凭证都应使用密码管理器保存
- ✅ 不要在 Slack/Email 中明文分享凭证
- ✅ 定期轮换所有密码和 token
- ✅ 启用所有服务的 2FA
- ✅ 定期检查访问日志

---

**最后更新：** 2024-11-14
