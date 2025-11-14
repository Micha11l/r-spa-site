// lib/giftcard/redeem-utils.ts
import { createClient } from '@/lib/supabase/server';

export interface RedeemResult {
  success: boolean;
  error?: string;
  data?: {
    walletBalance?: string;
    transactionId?: string;
    giftCardId?: string;
  };
}

export interface RedeemOptions {
  giftCardId: string;
  userId: string;
  email: string;
  action: 'wallet' | 'direct'; // Store in wallet or use immediately
}

/**
 * Execute gift card redemption
 * This handles the complete redemption flow including:
 * 1. Mark gift card as redeemed
 * 2. Create redemption record
 * 3. Add to wallet (if action is 'wallet')
 * 4. Create transaction record
 */
export async function executeRedemption(
  options: RedeemOptions
): Promise<RedeemResult> {
  const supabase = await createClient();

  try {
    // Start a transaction-like operation
    // Step 1: Get gift card details
    const { data: giftCard, error: gcError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', options.giftCardId)
      .single();

    if (gcError || !giftCard) {
      return {
        success: false,
        error: 'Gift card not found',
      };
    }

    // Verify it's not already redeemed
    if (giftCard.status === 'redeemed') {
      return {
        success: false,
        error: 'Gift card already redeemed',
      };
    }

    // ✅ 修复：直接使用 amount 字段，它已经是分
    const amountCents = giftCard.amount;

    // Step 2: Update gift card status
    const { error: updateError } = await supabase
      .from('gift_cards')
      .update({
        status: 'redeemed',
        redeemed: true,
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: options.userId,
        remaining_amount: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', options.giftCardId);

    if (updateError) {
      console.error('Error updating gift card:', updateError);
      return {
        success: false,
        error: 'Failed to redeem gift card',
      };
    }

    // Step 3: Create redemption record - ✅ 修复：添加 action 字段
    const { error: redemptionError } = await supabase
      .from('gift_card_redemptions')
      .insert({
        gift_card_id: options.giftCardId,
        redeemed_by: options.userId,
        redeemed_email: options.email.toLowerCase(),
        redeemed_at: new Date().toISOString(),
        amount_cents: amountCents,
        action: options.action, // ✅ 修复：添加必需的 action 字段
      });

    if (redemptionError) {
      console.error('Error creating redemption record:', redemptionError);
      // Try to rollback gift card status
      await supabase
        .from('gift_cards')
        .update({ status: 'active', redeemed_at: null, redeemed_by: null })
        .eq('id', options.giftCardId);

      return {
        success: false,
        error: 'Failed to record redemption',
      };
    }

    // Step 4: Handle wallet operation (if action is 'wallet')
    if (options.action === 'wallet') {
      const walletResult = await addToWallet({
        userId: options.userId,
        amountCents,
        giftCardId: options.giftCardId,
        description: `Gift Card ${giftCard.code} Redeemed`,
      });

      if (!walletResult.success) {
        console.error('Error adding to wallet:', walletResult.error);
        return {
          success: false,
          error: 'Redeemed but failed to add to wallet. Please contact support.',
        };
      }

      return {
        success: true,
        data: {
          walletBalance: walletResult.newBalance,
          transactionId: walletResult.transactionId,
          giftCardId: options.giftCardId,
        },
      };
    }

    // For direct usage, just return success
    return {
      success: true,
      data: {
        giftCardId: options.giftCardId,
      },
    };
  } catch (error) {
    console.error('Error in redemption flow:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during redemption',
    };
  }
}

/**
 * Add redeemed amount to user's wallet
 */
interface AddToWalletOptions {
  userId: string;
  amountCents: number;
  giftCardId: string;
  description: string;
}

interface WalletResult {
  success: boolean;
  error?: string;
  newBalance?: string;
  transactionId?: string;
}

async function addToWallet(
  options: AddToWalletOptions
): Promise<WalletResult> {
  const supabase = await createClient();

  try {
    console.log('💰 开始钱包操作:', {
      userId: options.userId,
      amountCents: options.amountCents,
      giftCardId: options.giftCardId
    });

    // Step 1: 先尝试获取现有钱包
    let { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', options.userId)
      .single();

    console.log('📊 钱包查询结果:', { wallet, walletError });

    if (walletError) {
      // 如果没有找到钱包，创建新钱包
      if (walletError.code === 'PGRST116') { // 没有找到记录
        console.log('🆕 创建新钱包...');
        const { data: newWallet, error: createError } = await supabase
          .from('user_wallets')
          .insert({
            user_id: options.userId,
            balance_cents: options.amountCents, // 初始余额就是礼品卡金额
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        console.log('🆕 钱包创建结果:', { newWallet, createError });

        if (createError || !newWallet) {
          console.error('❌ 钱包创建失败:', createError);
          return {
            success: false,
            error: `Failed to create wallet: ${createError?.message || 'Unknown error'}`,
          };
        }

        wallet = newWallet;
        
        // 创建钱包交易记录
        const { data: transaction, error: txError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: wallet.id,
            type: 'credit',
            amount_cents: options.amountCents,
            balance_after_cents: options.amountCents,
            description: options.description,
            reference_type: 'gift_card',
            reference_id: options.giftCardId,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (txError) {
          console.error('⚠️ 交易记录创建失败（非关键错误）:', txError);
        }

        return {
          success: true,
          newBalance: (options.amountCents / 100).toFixed(2),
          transactionId: transaction?.id,
        };
      } else {
        // 其他错误
        console.error('❌ 钱包查询失败:', walletError);
        return {
          success: false,
          error: `Failed to query wallet: ${walletError.message}`,
        };
      }
    }

    // Step 2: 如果钱包已存在，更新余额
    console.log('🔄 更新现有钱包余额...');
    const newBalance = (wallet?.balance_cents || 0) + options.amountCents;

    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({
        balance_cents: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', options.userId);

    if (updateError) {
      console.error('❌ 钱包余额更新失败:', updateError);
      return {
        success: false,
        error: `Failed to update wallet balance: ${updateError.message}`,
      };
    }

    // Step 3: 创建交易记录
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'credit',
        amount_cents: options.amountCents,
        balance_after_cents: newBalance,
        description: options.description,
        reference_type: 'gift_card',
        reference_id: options.giftCardId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (txError) {
      console.error('⚠️ 交易记录创建失败（非关键错误）:', txError);
    }

    console.log('✅ 钱包操作成功:', { newBalance });

    return {
      success: true,
      newBalance: (newBalance / 100).toFixed(2),
      transactionId: transaction?.id,
    };
  } catch (error) {
    console.error('💥 钱包操作异常:', error);
    return {
      success: false,
      error: `Wallet operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get user's wallet balance
 */
export async function getWalletBalance(
  userId: string
): Promise<{ balance: string } | null> {
  try {
    const supabase = await createClient();

    const { data: wallet, error } = await supabase
      .from('user_wallets')
      .select('balance_cents')
      .eq('user_id', userId)
      .single();

    if (error || !wallet) {
      return null;
    }

    return {
      balance: (wallet.balance_cents / 100).toFixed(2),
    };
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return null;
  }
}

/**
 * Format cents to dollars
 */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Parse dollars to cents
 */
export function parseDollarsToCents(dollars: string | number): number {
  const amount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  return Math.round(amount * 100);
}