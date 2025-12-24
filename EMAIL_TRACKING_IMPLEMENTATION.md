# 邮件追踪系统实现总结

## A) 已完成的功能

### 1. 数据库表 `email_outbox`

在 `lib/emails.ts` 顶部注释中提供了 SQL：

```sql
CREATE TABLE IF NOT EXISTS email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  provider TEXT,
  status TEXT NOT NULL,
  message_id TEXT,
  error TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_outbox_created_idx ON email_outbox (created_at DESC);
CREATE INDEX IF NOT EXISTS email_outbox_to_email_idx ON email_outbox (to_email);
CREATE INDEX IF NOT EXISTS email_outbox_event_type_idx ON email_outbox (event_type);
```

**使用方法：** 在数据库中手动执行这些 SQL 语句创建表和索引。

### 2. 统一邮件发送函数 `sendEmailTracked()`

位置：`lib/emails.ts:167-271`

**功能：**
- 默认优先用 Zoho SMTP 发送
- 可选 fallback 到 Resend（设置 `useFallback: true`）
- 无论成功失败都写入 `email_outbox` 表
- 不会因为发邮件失败导致业务接口失败
- 支持附件、BCC、自定义 replyTo
- 自动记录 provider、status、message_id、error、meta

### 3. 已更新使用 `sendEmailTracked()` 的函数

#### 3.1 `sendDepositEmail` (lines 73-92)
- Event type: `deposit_link`
- 启用 fallback: ✅
- Meta: `{ name, checkoutUrl }`

#### 3.2 `sendRefuseEmail` (lines 94-109)
- Event type: `booking_refused`
- 启用 fallback: ✅
- Meta: `{ name, reason }`

#### 3.3 `sendPaymentSuccessEmail` (lines 111-130)
- Event type: `payment_success`
- 启用 fallback: ✅
- Meta: `{ name, serviceName, time }`

#### 3.4 `sendBookingEmails` (lines 287-448) - 重要改动
**拆分为两段 try/catch：**

1. **先发客户邮件** (lines 300-417)
   - Event type: `booking_request`
   - 包含 HTML + 纯文本 + .ics 附件
   - 失败不影响店家邮件
   - Meta: `{ booking_startISO, booking_endISO, service, customer_email }`

2. **再发店家邮件** (lines 419-447)
   - Event type: `booking_request_owner`
   - 纯文本，不带附件
   - 失败不影响业务
   - 设置 replyTo 为客户邮箱
   - Meta: 同上

#### 3.5 `sendGiftCardUseNotification` (lines 652-749) - 样式改动
**改为简洁单色模板（黑白灰）：**
- 移除了蓝色渐变背景 (`linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`)
- 移除了绿色文字 (`color:#10b981`)
- 使用灰度色系：
  - `#111` - 标题和主要文字
  - `#6b7280` - 次要文字
  - `#fafafa` - 背景色
  - `#e5e7eb` - 边框
- Event type: `giftcard_use`
- Meta: `{ gift_card_code, amount_used, new_balance, service_name }`

### 4. Admin 调试接口

#### 4.1 GET `/api/staff/email/outbox`
位置：`app/api/staff/email/outbox/route.ts`

**查询参数：**
- `limit` - 返回记录数量（默认50，最多100）

**返回格式：**
```json
{
  "success": true,
  "count": 50,
  "records": [
    {
      "id": "uuid",
      "event_type": "booking_request",
      "to_email": "customer@example.com",
      "subject": "Booking request received",
      "provider": "zoho",
      "status": "sent",
      "message_id": "<...>",
      "error": null,
      "meta": { ... },
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**使用示例：**
```bash
curl https://yourdomain.com/api/staff/email/outbox?limit=50
```

#### 4.2 POST `/api/staff/email/test`
位置：`app/api/staff/email/test/route.ts`

**请求格式：**
```json
{
  "to": "test@example.com",
  "template": "booking_request" | "deposit_link" | "payment_success" | "giftcard_recipient" | "giftcard_use"
}
```

**返回格式：**
```json
{
  "success": true,
  "message": "Test email sent and logged",
  "messageId": "<...>",
  "error": null
}
```

**使用示例：**
```bash
curl -X POST https://yourdomain.com/api/staff/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"admin@example.com","template":"deposit_link"}'
```

## B) Event Types 清单

1. `booking_request` - 客户预订确认邮件
2. `booking_request_owner` - 店家预订通知
3. `deposit_link` - 押金支付链接
4. `booking_refused` - 预订拒绝通知
5. `payment_success` - 支付成功确认
6. `giftcard_use` - 礼品卡使用通知
7. `test_*` - 测试邮件（如 `test_booking_request`）

## C) 排查邮件问题的步骤

1. **查看最近的邮件记录：**
   ```bash
   curl https://yourdomain.com/api/staff/email/outbox?limit=100
   ```

2. **筛选失败的邮件：**
   ```sql
   SELECT * FROM email_outbox WHERE status = 'failed' ORDER BY created_at DESC LIMIT 50;
   ```

3. **按收件人查询：**
   ```sql
   SELECT * FROM email_outbox WHERE to_email = 'customer@example.com' ORDER BY created_at DESC;
   ```

4. **按事件类型查询：**
   ```sql
   SELECT * FROM email_outbox WHERE event_type = 'booking_request' ORDER BY created_at DESC LIMIT 50;
   ```

5. **发送测试邮件验证：**
   ```bash
   curl -X POST https://yourdomain.com/api/staff/email/test \
     -H "Content-Type: application/json" \
     -d '{"to":"your-email@example.com","template":"booking_request"}'
   ```

## D) 注意事项

1. **数据库表需要手动创建** - 执行 `lib/emails.ts` 顶部的 SQL
2. **Admin 接口无鉴权** - 建议在生产环境添加鉴权中间件
3. **所有邮件失败都不会影响业务** - 只会记录到 outbox
4. **Fallback 默认关闭** - 只在需要时启用（如重要邮件）
5. **使用 nodejs runtime** - 所有 API 路由都已设置

## E) Build 状态

✅ `npm run build` 通过
- 新增 2 个 API 路由
- 修改 5 个邮件发送函数
- 保持黑白灰色系 UI
- 无新依赖
- SSR 安全
