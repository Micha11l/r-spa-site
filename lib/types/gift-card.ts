// lib/types/gift-card.ts
// Gift Card System - TypeScript Types

export type GiftCardStatus = 
  | 'unused'           // 未使用（刚购买，未激活）
  | 'active'           // 已激活，未使用
  | 'partially_used'   // 部分使用
  | 'used'             // 已使用完
  | 'redeemed'         // 已兑换到钱包
  | 'expired'          // 已过期
  | 'cancelled';       // 已作废

export type TransactionType =
  | 'purchase'  // 购买
  | 'use'       // 消费
  | 'refund'    // 退款
  | 'cancel';   // 作废

export interface GiftCard {
  id: string;
  code: string;
  amount: number;                    // 总金额（cents）
  remaining_amount: number;          // 剩余金额（cents）
  status: GiftCardStatus;
  
  // 购买人信息
  sender_name: string | null;
  sender_email: string | null;
  sender_phone: string | null;       // 新增
  
  // 收件人信息（如果是礼物）
  recipient_name: string | null;
  recipient_email: string | null;
  message: string | null;            // 赠言
  is_gift: boolean;                  // 新增：是否为礼物
  
  // 支付信息
  stripe_session_id: string | null;
  payment_intent_id: string | null;
  purchased_by_email: string | null;
  purchased_at: string | null;
  
  // 兑换信息（兑换到钱包）
  redeem_token: string | null;
  token_expires_at: string | null;
  redeemed: boolean;
  redeemed_at: string | null;
  redeemed_by_user_id: string | null;
  wallet_id: string | null;
  redeemed_to_wallet: boolean;
  
  // 时间戳
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  
  // 会话信息
  session_id: string | null;
}

export interface GiftCardTransaction {
  id: string;
  gift_card_id: string;
  transaction_type: TransactionType;
  amount_cents: number;
  balance_after_cents: number;
  service_name: string | null;      // 消费的服务项目
  notes: string | null;              // 备注
  created_at: string;
  created_by: string | null;         // 操作员工ID
}

// 购买表单数据
export interface GiftCardPurchaseFormData {
  // 金额
  amount: number;                    // dollars
  
  // 购买人信息
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  
  // 是否送礼
  isGift: boolean;
  
  // 收件人信息（如果 isGift = true）
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
}

// 消费记录表单数据
export interface UseGiftCardFormData {
  giftCardId: string;
  amount: number;                    // dollars
  serviceName?: string;
  notes?: string;
}

// API 响应类型
export interface GiftCardWithTransactions extends GiftCard {
  transactions?: GiftCardTransaction[];
}

export interface RecordUseResponse {
  success: boolean;
  error?: string;
  transaction_id?: string;
  previous_balance?: number;
  amount_used?: number;
  new_balance?: number;
  new_status?: GiftCardStatus;
}

export interface CancelGiftCardResponse {
  success: boolean;
  error?: string;
  previous_status?: GiftCardStatus;
  new_status?: GiftCardStatus;
}

// 礼品卡统计
export interface GiftCardStats {
  active_count: number;
  partially_used_count: number;
  used_count: number;
  cancelled_count: number;
  expired_count: number;
  total_active_value: number;
  total_remaining_value: number;
  total_used_value: number;
}

// 辅助函数类型
export const formatCentsToUSD = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

export const formatUSDToCents = (dollars: number | string): number => {
  const amount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  return Math.round(amount * 100);
};

export const getStatusBadgeColor = (status: GiftCardStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'partially_used':
      return 'bg-blue-100 text-blue-800';
    case 'used':
      return 'bg-gray-100 text-gray-800';
    case 'expired':
      return 'bg-orange-100 text-orange-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'redeemed':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

export const getStatusLabel = (status: GiftCardStatus): string => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'partially_used':
      return 'Partially Used';
    case 'used':
      return 'Used';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    case 'redeemed':
      return 'Redeemed';
    case 'unused':
      return 'Unused';
    default:
      return status;
  }
};
