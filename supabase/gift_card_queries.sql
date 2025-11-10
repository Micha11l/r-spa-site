-- ===============================================
-- 礼品卡查询和修复脚本
-- 请确保先运行 create_missing_tables.sql
-- ===============================================

-- 1. 查看所有礼品卡的当前状态
SELECT
    code,
    amount,
    remaining_amount,
    status,
    CASE
        WHEN remaining_amount = 0 THEN 'Should be redeemed'
        WHEN remaining_amount < amount THEN 'Should be partially_used'
        ELSE 'Should be active'
    END as expected_status,
    sender_name,
    sender_email,
    recipient_name,
    recipient_email,
    created_at,
    redeemed_at
FROM gift_cards
ORDER BY created_at DESC;

-- 2. 修复状态不一致的礼品卡
UPDATE gift_cards
SET status = CASE
    WHEN remaining_amount = 0 THEN 'redeemed'
    WHEN remaining_amount < amount THEN 'partially_used'
    ELSE 'active'
END
WHERE status != CASE
    WHEN remaining_amount = 0 THEN 'redeemed'
    WHEN remaining_amount < amount THEN 'partially_used'
    ELSE 'active'
END;

-- 3. 查看特定用户的礼品卡
-- 使用时替换 'user@example.com' 为实际的邮箱
WITH user_cards AS (
    SELECT
        gc.*,
        'sender' as role
    FROM gift_cards gc
    WHERE gc.sender_email = 'user@example.com'

    UNION

    SELECT
        gc.*,
        'recipient' as role
    FROM gift_cards gc
    WHERE gc.recipient_email = 'user@example.com'
)
SELECT
    uc.code,
    uc.amount,
    uc.remaining_amount,
    uc.status,
    uc.role,
    uc.sender_name,
    uc.recipient_name,
    uc.created_at
FROM user_cards uc
ORDER BY uc.created_at DESC;

-- 4. 查看礼品卡的兑换历史（需要 gift_redemptions 表存在）
SELECT
    gc.code,
    gc.amount as original_amount,
    gc.remaining_amount,
    gc.status,
    gr.amount_cents as redeemed_amount,
    gr.by_email,
    gr.created_at as redeemed_at
FROM gift_cards gc
LEFT JOIN gift_redemptions gr ON gr.gift_card_id = gc.id
ORDER BY gc.created_at DESC, gr.created_at DESC;

-- 5. 查看特定礼品卡的完整兑换历史
-- 使用时替换 'RJ-XXXX-XXXX' 为实际的 code
SELECT
    gr.id,
    gr.amount_cents,
    gr.by_email,
    gr.created_at as redeemed_at,
    gc.code,
    gc.remaining_amount as current_remaining
FROM gift_redemptions gr
JOIN gift_cards gc ON gc.id = gr.gift_card_id
WHERE gc.code = 'RJ-XXXX-XXXX'
ORDER BY gr.created_at DESC;

-- 6. 统计礼品卡兑换情况
SELECT
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE status = 'active') as active_cards,
    COUNT(*) FILTER (WHERE status = 'partially_used') as partially_used_cards,
    COUNT(*) FILTER (WHERE status = 'redeemed') as redeemed_cards,
    SUM(amount) as total_value_cents,
    SUM(remaining_amount) as total_remaining_cents,
    SUM(amount - remaining_amount) as total_redeemed_cents
FROM gift_cards;

-- 7. 检查并修复 remaining_amount 与实际兑换记录的不一致
-- （需要 gift_redemptions 表存在）
SELECT
    gc.code,
    gc.amount as original_amount,
    gc.remaining_amount as current_remaining,
    gc.amount - COALESCE(SUM(gr.amount_cents), 0) as calculated_remaining,
    CASE
        WHEN gc.remaining_amount != gc.amount - COALESCE(SUM(gr.amount_cents), 0)
        THEN 'MISMATCH - Needs Fix'
        ELSE 'OK'
    END as status_check,
    gc.amount - COALESCE(SUM(gr.amount_cents), 0) - gc.remaining_amount as difference
FROM gift_cards gc
LEFT JOIN gift_redemptions gr ON gr.gift_card_id = gc.id
GROUP BY gc.id, gc.code, gc.amount, gc.remaining_amount
ORDER BY
    CASE
        WHEN gc.remaining_amount != gc.amount - COALESCE(SUM(gr.amount_cents), 0)
        THEN 0
        ELSE 1
    END,
    gc.created_at DESC;

-- 8. 修复不一致的 remaining_amount
-- 警告：这会根据兑换记录重新计算余额，请先运行上面的查询确认
/*
UPDATE gift_cards gc
SET remaining_amount = subquery.calculated_remaining
FROM (
    SELECT
        gc.id,
        gc.amount - COALESCE(SUM(gr.amount_cents), 0) as calculated_remaining
    FROM gift_cards gc
    LEFT JOIN gift_redemptions gr ON gr.gift_card_id = gc.id
    GROUP BY gc.id
) AS subquery
WHERE gc.id = subquery.id
AND gc.remaining_amount != subquery.calculated_remaining;
*/

-- 9. 查看最近的礼品卡活动（创建和兑换）
WITH recent_activity AS (
    SELECT
        gc.code,
        'Created' as activity_type,
        gc.amount as amount_cents,
        gc.sender_email as related_email,
        gc.created_at as activity_time
    FROM gift_cards gc

    UNION ALL

    SELECT
        gc.code,
        'Redeemed' as activity_type,
        gr.amount_cents,
        gr.by_email as related_email,
        gr.created_at as activity_time
    FROM gift_redemptions gr
    JOIN gift_cards gc ON gc.id = gr.gift_card_id
)
SELECT
    code,
    activity_type,
    amount_cents,
    related_email,
    activity_time
FROM recent_activity
ORDER BY activity_time DESC
LIMIT 50;

-- 10. 按月统计礼品卡销售和兑换
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as cards_created,
    SUM(amount) as total_sales_cents,
    AVG(amount) as avg_card_value_cents
FROM gift_cards
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 11. 查找从未兑换过的礼品卡（可能需要提醒）
SELECT
    gc.code,
    gc.amount,
    gc.recipient_email,
    gc.recipient_name,
    gc.created_at,
    EXTRACT(DAY FROM NOW() - gc.created_at) as days_since_created
FROM gift_cards gc
LEFT JOIN gift_redemptions gr ON gr.gift_card_id = gc.id
WHERE gr.id IS NULL
    AND gc.status = 'active'
ORDER BY gc.created_at ASC;

-- 12. 查找部分兑换的礼品卡（还有余额）
SELECT
    gc.code,
    gc.amount,
    gc.remaining_amount,
    gc.recipient_email,
    gc.recipient_name,
    COUNT(gr.id) as redemption_count,
    MAX(gr.created_at) as last_redeemed_at
FROM gift_cards gc
LEFT JOIN gift_redemptions gr ON gr.gift_card_id = gc.id
WHERE gc.status = 'partially_used'
GROUP BY gc.id, gc.code, gc.amount, gc.remaining_amount,
         gc.recipient_email, gc.recipient_name
ORDER BY last_redeemed_at DESC;
