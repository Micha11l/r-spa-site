// /components/account/WalletCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Wallet, TrendingUp, TrendingDown, Gift, Calendar } from 'lucide-react';

interface WalletData {
  balance_cents: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount_cents: number;
  balance_after_cents: number;
  description: string;
  reference_type: string;
  created_at: string;
}

export default function WalletCard() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Get wallet
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) {
        if (walletError.code === 'PGRST116') {
          // No wallet found - this is ok, user hasn't redeemed anything yet
          setWallet(null);
        } else {
          throw walletError;
        }
      } else {
        setWallet(walletData);

        // Get transactions if wallet exists
        if (walletData) {
          const { data: txData, error: txError } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', walletData.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (txError) throw txError;
          setTransactions(txData || []);
        }
      }
    } catch (err: any) {
      console.error('Error loading wallet:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-slate-600">Loading wallet...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center text-red-600">
          <p>Error loading wallet: {error}</p>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
            <Wallet className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-light text-slate-800 mb-2">
            No Wallet Yet
          </h3>
          <p className="text-slate-600 mb-4">
            Redeem a gift card to create your wallet and start saving!
          </p>
          <a
            href="/gift-cards"
            className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse Gift Cards
          </a>
        </div>
      </div>
    );
  }

  const balanceDollars = formatCurrency(wallet.balance_cents);

  return (
    <div className="space-y-4">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-light">Your Wallet</h3>
          </div>
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
            Active
          </span>
        </div>

        <div className="mb-6">
          <div className="text-sm font-light mb-1 opacity-90">
            Available Balance
          </div>
          <div className="text-5xl font-light tracking-tight">
            ${balanceDollars}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="flex items-center gap-2 text-sm hover:underline"
          >
            <Calendar className="w-4 h-4" />
            {showTransactions ? 'Hide' : 'View'} Transaction History
          </button>
          <a
            href="/booking"
            className="px-4 py-2 bg-white text-emerald-600 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Use Balance
          </a>
        </div>
      </div>

      {/* Transactions */}
      {showTransactions && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h4 className="font-medium text-slate-800">Recent Transactions</h4>
          </div>
          
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type === 'credit'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.type === 'credit' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          {tx.description || 'Transaction'}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          {formatDate(tx.created_at)}
                        </div>
                        {tx.reference_type && (
                          <div className="flex items-center gap-1 mt-1">
                            <Gift className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400 capitalize">
                              {tx.reference_type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-medium ${
                        tx.type === 'credit'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}${formatCurrency(tx.amount_cents)}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        Balance: ${formatCurrency(tx.balance_after_cents)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-sm">ℹ️</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              Your wallet balance can be used for appointments and treatments at Rejuvenessence.
              Gift card funds never expire!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
