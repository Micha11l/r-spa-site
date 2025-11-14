// /components/booking/WalletPayment.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wallet, Check, AlertCircle, Loader2 } from 'lucide-react';

interface WalletPaymentProps {
  totalAmountCents: number;
  onWalletAmountChange: (walletAmount: number, remainingAmount: number) => void;
  disabled?: boolean;
}

export default function WalletPayment({ 
  totalAmountCents,
  onWalletAmountChange,
  disabled = false,
}: WalletPaymentProps) {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  useEffect(() => {
    if (useWallet && walletBalance !== null) {
      const walletAmount = Math.min(walletBalance, totalAmountCents);
      const remainingAmount = totalAmountCents - walletAmount;
      onWalletAmountChange(walletAmount, remainingAmount);
    } else {
      onWalletAmountChange(0, totalAmountCents);
    }
  }, [useWallet, walletBalance, totalAmountCents]);

  const loadWalletBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setWalletBalance(null);
        return;
      }

      // Get wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance_cents')
        .eq('user_id', user.id)
        .single();

      if (walletError) {
        if (walletError.code === 'PGRST116') {
          // No wallet found
          setWalletBalance(0);
        } else {
          throw walletError;
        }
      } else {
        setWalletBalance(wallet.balance_cents);
      }
    } catch (err: any) {
      console.error('Error loading wallet:', err);
      setError('Failed to load wallet balance');
      setWalletBalance(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWallet = () => {
    if (disabled) return;
    setUseWallet(!useWallet);
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-600 p-4 bg-slate-50 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking wallet balance...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 text-orange-600 p-4 bg-orange-50 rounded-lg border border-orange-100">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  // No wallet or zero balance
  if (walletBalance === null || walletBalance === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-200">
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-700">
              No Wallet Balance
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Redeem a gift card to add funds to your wallet
            </div>
          </div>
          <a
            href="/gift-cards"
            className="text-sm text-primary hover:underline"
          >
            Get Gift Card
          </a>
        </div>
      </div>
    );
  }

  const walletAmount = Math.min(walletBalance, totalAmountCents);
  const remainingAmount = totalAmountCents - walletAmount;
  const canCoverFull = walletBalance >= totalAmountCents;

  return (
    <div className="space-y-4">
      {/* Wallet Toggle */}
      <button
        type="button"
        onClick={handleToggleWallet}
        disabled={disabled}
        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
          useWallet
            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${
              useWallet 
                ? 'bg-emerald-100' 
                : 'bg-slate-100'
            }`}>
              <Wallet className={`w-5 h-5 transition-colors ${
                useWallet 
                  ? 'text-emerald-600' 
                  : 'text-slate-600'
              }`} />
            </div>
            <div>
              <div className="font-medium text-slate-900">
                Pay with Wallet
              </div>
              <div className="text-sm text-slate-600 mt-0.5">
                Available: ${formatCurrency(walletBalance)}
                {canCoverFull && (
                  <span className="ml-2 text-emerald-600 font-medium">
                    • Can cover full amount
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Checkmark */}
          {useWallet && (
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </button>

      {/* Payment Breakdown */}
      {useWallet && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 space-y-2 border border-slate-200">
          <div className="text-sm font-medium text-slate-700 mb-3">
            Payment Breakdown
          </div>

          {/* Wallet Payment */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-slate-600">Wallet Balance</span>
            </div>
            <span className="font-medium text-emerald-600">
              -${formatCurrency(walletAmount)}
            </span>
          </div>

          {/* Card Payment (if needed) */}
          {remainingAmount > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 text-slate-400">💳</div>
                <span className="text-sm text-slate-600">Card Payment</span>
              </div>
              <span className="font-medium text-slate-900">
                ${formatCurrency(remainingAmount)}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="pt-2 mt-2 border-t border-slate-300 flex justify-between items-center">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-semibold text-slate-900 text-lg">
              ${formatCurrency(totalAmountCents)}
            </span>
          </div>

          {/* Full coverage message */}
          {remainingAmount === 0 && (
            <div className="mt-3 p-3 bg-emerald-100 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-emerald-800">
                  Payment fully covered by wallet! No card required.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info message */}
      {useWallet && remainingAmount > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex gap-2">
            <div className="text-blue-600 flex-shrink-0 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800">
              <span className="font-medium">${formatCurrency(walletAmount)}</span> will be
              deducted from your wallet. The remaining{' '}
              <span className="font-medium">${formatCurrency(remainingAmount)}</span> will be
              charged to your card.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
