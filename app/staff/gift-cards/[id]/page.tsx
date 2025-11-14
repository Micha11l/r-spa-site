// app/staff/gift-cards/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  GiftCardWithTransactions,
  GiftCardTransaction,
  getStatusBadgeColor,
  getStatusLabel,
  formatCentsToUSD,
  formatUSDToCents,
} from "@/lib/types/gift-card";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  User,
  Clock,
  DollarSign,
  AlertCircle,
  XCircle,
  TrendingDown,
} from "lucide-react";

export default function GiftCardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const giftCardId = params.id as string;

  const [giftCard, setGiftCard] = useState<GiftCardWithTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUseModal, setShowUseModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (giftCardId) {
      loadGiftCard();
    }
  }, [giftCardId]);

  const loadGiftCard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/gift-cards/${giftCardId}`);

      if (!response.ok) {
        throw new Error("Failed to load gift card");
      }

      const data = await response.json();
      setGiftCard(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load gift card");
      router.push("/staff/gift-cards");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-slate-600">Loading gift card...</p>
        </div>
      </div>
    );
  }

  if (!giftCard) {
    return null;
  }

  const canUse = ["active", "partially_used"].includes(giftCard.status);
  const canCancel = !["used", "cancelled", "expired"].includes(giftCard.status);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/staff/gift-cards")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Gift Cards
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900 font-mono">
                  {giftCard.code}
                </h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(giftCard.status)}`}>
                  {getStatusLabel(giftCard.status)}
                </span>
                {giftCard.is_gift && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                    🎁 Gift
                  </span>
                )}
              </div>
              <p className="text-slate-600">
                Purchased on {new Date(giftCard.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-2">
              {canUse && (
                <button
                  onClick={() => setShowUseModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Record Use
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Card
                </button>
              )}
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700 mb-1">Original Amount</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCentsToUSD(giftCard.amount)}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 mb-1">Remaining Balance</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCentsToUSD(giftCard.remaining_amount)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-700 mb-1">Used</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCentsToUSD(giftCard.amount - giftCard.remaining_amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Purchase Info */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Purchase Information</h2>
            <div className="space-y-3">
              <InfoRow icon={<User />} label="Purchaser" value={giftCard.sender_name || "N/A"} />
              <InfoRow icon={<Mail />} label="Email" value={giftCard.sender_email || giftCard.purchased_by_email || "N/A"} />
              <InfoRow icon={<Phone />} label="Phone" value={giftCard.sender_phone || "N/A"} />
              <InfoRow icon={<Calendar />} label="Purchase Date" value={new Date(giftCard.purchased_at || giftCard.created_at).toLocaleString()} />
              <InfoRow icon={<Clock />} label="Expires" value={giftCard.expires_at ? new Date(giftCard.expires_at).toLocaleDateString() : "Never"} />
            </div>
          </div>

          {/* Recipient Info (if gift) */}
          {giftCard.is_gift && (
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <h2 className="text-lg font-semibold text-purple-900 mb-4">🎁 Gift Recipient</h2>
              <div className="space-y-3">
                <InfoRow icon={<User />} label="Recipient" value={giftCard.recipient_name || "N/A"} />
                <InfoRow icon={<Mail />} label="Email" value={giftCard.recipient_email || "N/A"} />
                {giftCard.message && (
                  <div className="pt-3 border-t border-purple-200">
                    <p className="text-sm text-purple-700 mb-1">Message:</p>
                    <p className="text-sm text-purple-900 italic">"{giftCard.message}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          {!giftCard.is_gift && (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Information</h2>
              <div className="space-y-3">
                <InfoRow icon={<CreditCard />} label="Payment Method" value="Stripe" />
                {giftCard.payment_intent_id && (
                  <InfoRow icon={<CreditCard />} label="Payment ID" value={giftCard.payment_intent_id} mono />
                )}
                {giftCard.redeemed_to_wallet && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      Redeemed to Wallet
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Transaction History</h2>
          
          {!giftCard.transactions || giftCard.transactions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {giftCard.transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Use Modal */}
      {showUseModal && (
        <UseGiftCardModal
          giftCard={giftCard}
          onClose={() => setShowUseModal(false)}
          onSuccess={() => {
            setShowUseModal(false);
            loadGiftCard();
          }}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelGiftCardModal
          giftCard={giftCard}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            loadGiftCard();
          }}
        />
      )}
    </div>
  );
}

// Helper Components
function InfoRow({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-600">{label}</p>
        <p className={`text-sm font-medium text-slate-900 break-all ${mono ? 'font-mono text-xs' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: GiftCardTransaction }) {
  const isCredit = transaction.transaction_type === "purchase";
  const isDebit = transaction.transaction_type === "use";
  const isCancel = transaction.transaction_type === "cancel";

  return (
    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isCredit ? "bg-green-100" : isCancel ? "bg-red-100" : "bg-blue-100"
      }`}>
        {isCredit ? "💰" : isCancel ? "❌" : <TrendingDown className="w-5 h-5 text-blue-600" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-slate-900 capitalize">
              {transaction.transaction_type}
              {transaction.service_name && ` - ${transaction.service_name}`}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {new Date(transaction.created_at).toLocaleString()}
            </p>
            {transaction.notes && (
              <p className="text-sm text-slate-500 mt-1 italic">
                Note: {transaction.notes}
              </p>
            )}
          </div>
          
          <div className="text-right flex-shrink-0">
            <p className={`text-lg font-bold ${
              isCredit ? "text-green-600" : "text-red-600"
            }`}>
              {isCredit ? "+" : "-"}{formatCentsToUSD(transaction.amount_cents)}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Balance: {formatCentsToUSD(transaction.balance_after_cents)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Use Modal
function UseGiftCardModal({ giftCard, onClose, onSuccess }: {
  giftCard: GiftCardWithTransactions;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amountCents = formatUSDToCents(amountNum);
    if (amountCents > giftCard.remaining_amount) {
      toast.error("Amount exceeds remaining balance");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/staff/gift-cards/${giftCard.id}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          serviceName: serviceName || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record use");
      }

      toast.success("Transaction recorded successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Record Gift Card Use</h3>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-700 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCentsToUSD(giftCard.remaining_amount)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount Used ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={giftCard.remaining_amount / 100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Service Name (Optional)
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Facial Treatment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Processing..." : "Record Use"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Cancel Modal
function CancelGiftCardModal({ giftCard, onClose, onSuccess }: {
  giftCard: GiftCardWithTransactions;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setProcessing(true);
    try {
      const response = await fetch(`/api/staff/gift-cards/${giftCard.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel gift card");
      }

      toast.success("Gift card cancelled successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Cancel Gift Card</h3>
            <p className="text-sm text-slate-600 mt-1">
              This action cannot be undone. The gift card will be marked as cancelled.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Why is this gift card being cancelled?"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Keep Card
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Processing..." : "Cancel Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
