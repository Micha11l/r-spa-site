//app/api/giftcard/redeem/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  validateRedemptionToken,
  canRedeemGiftCard,
} from '@/lib/giftcard/validation';
import {
  executeRedemption,
  getWalletBalance,
} from '@/lib/giftcard/redeem-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, action, email } = body;

    console.log('🎯 开始执行兑换:', { token, action, email });

    // Validate input
    if (!token) {
      return NextResponse.json(
        { error: 'Redemption token is required' },
        { status: 400 }
      );
    }

    if (!action || !['wallet', 'direct'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "wallet" or "direct"' },
        { status: 400 }
      );
    }

    // 不再强制要求 email 参数，因为用户可能已经登录
    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to redeem a gift card' },
        { status: 401 }
      );
    }

    console.log('✅ 用户已登录:', user.email);

    // 🔧 修复邮箱验证逻辑
    const userEmail = user.email;
    const requestEmail = email || userEmail;

    if (!requestEmail) {
      return NextResponse.json(
        { error: 'Email is required for redemption' },
        { status: 400 }
      );
    }

    // 如果提供了 email 参数，验证是否与登录用户匹配
    if (email && userEmail?.toLowerCase() !== email.toLowerCase()) {
      console.warn('⚠️ 邮箱不匹配:', { userEmail, requestEmail });
      return NextResponse.json(
        { error: 'Email does not match your account' },
        { status: 403 }
      );
    }

    // Step 1: Validate token again (for security)
    const tokenValidation = await validateRedemptionToken(token);
    console.log('🔐 Token 验证结果:', tokenValidation.valid);

    if (!tokenValidation.valid) {
      return NextResponse.json(
        { error: tokenValidation.error },
        { status: 400 }
      );
    }

    const giftCard = tokenValidation.data;
    console.log('🎁 礼品卡信息:', giftCard.id);

    // Step 2: Double-check if can redeem
    const canRedeem = await canRedeemGiftCard(giftCard.id);
    console.log('📋 可兑换检查:', canRedeem.valid);

    if (!canRedeem.valid) {
      return NextResponse.json(
        { error: canRedeem.error },
        { status: 400 }
      );
    }

    // Step 3: Execute redemption
    console.log('🚀 开始执行兑换...');
    const result = await executeRedemption({
      giftCardId: giftCard.id,
      userId: user.id,
      email: userEmail, // 使用登录用户的邮箱
      action: action,
    });

    if (!result.success) {
      console.error('❌ 兑换执行失败:', result.error);
      return NextResponse.json(
        { error: result.error || 'Redemption failed' },
        { status: 500 }
      );
    }

    console.log('✅ 兑换执行成功');

    // Step 4: Get updated wallet balance (if applicable)
    let walletBalance = null;
    if (action === 'wallet') {
      try {
        const balance = await getWalletBalance(user.id);
        walletBalance = balance?.balance || '0.00';
        console.log('💰 钱包余额更新:', walletBalance);
      } catch (balanceError) {
        console.error('⚠️ 获取钱包余额失败:', balanceError);
        // 不因为余额获取失败而让整个兑换失败
      }
    }

    // Return success response
    console.log('🎉 返回成功响应');
    return NextResponse.json({
      success: true,
      message:
        action === 'wallet'
          ? 'Gift card successfully added to your wallet!'
          : 'Gift card redeemed! You can now use it for bookings.',
      redemption: {
        giftCardId: giftCard.id,
        code: giftCard.code,
        amount: parseFloat(giftCard.dollars),
        action,
        walletBalance,
        transactionId: result.data?.transactionId,
      },
    });
  } catch (error) {
    console.error('💥 Error in execute API:', error);
    return NextResponse.json(
      { error: 'Failed to execute redemption' },
      { status: 500 }
    );
  }
}