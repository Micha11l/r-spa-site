// app/giftcard/purchase/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type GiftCardForm = {
  amount: number;
  // 收件人信息（如果是礼物）
  recipient_email: string;
  recipient_name: string;
  message: string;
  // 是否送礼
  isGift: boolean;
};

export default function PurchaseGiftCardPage() {
  const router = useRouter();
  const [cards, setCards] = useState<GiftCardForm[]>([
    {
      amount: 150,
      recipient_email: "",
      recipient_name: "",
      message: "",
      isGift: false,
    },
  ]);
  
  // 购买人信息（发送人）
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Predefined amounts
  const presetAmounts = [150, 200, 300, 500, 1000];

  // Add a new card
  const addCard = () => {
    if (cards.length >= 50) {
      toast.error("Maximum 50 gift cards per purchase");
      return;
    }
    setCards([
      ...cards,
      {
        amount: 150,
        recipient_email: "",
        recipient_name: "",
        message: "",
        isGift: false,
      },
    ]);
  };

  // Remove a card
  const removeCard = (index: number) => {
    if (cards.length === 1) {
      toast.error("Must have at least one gift card");
      return;
    }
    setCards(cards.filter((_, i) => i !== index));
  };

  // Update a card field
  const updateCard = (index: number, field: keyof GiftCardForm, value: string | number | boolean) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  // Calculate total
  const total = cards.reduce((sum, card) => sum + card.amount, 0);

  // Validate form
  const validateForm = (): boolean => {
    // Validate sender info
    if (!senderName.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    
    if (!senderEmail || !senderEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return false;
    }
    
    if (!senderPhone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }

    // Validate each card
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      if (card.amount < 150) {
        toast.error(`Card ${i + 1}: Minimum amount is $150`);
        return false;
      }
      
      if (card.amount > 10000) {
        toast.error(`Card ${i + 1}: Maximum amount is $10,000`);
        return false;
      }
      
      // If it's a gift, recipient info is required
      if (card.isGift) {
        if (!card.recipient_name.trim()) {
          toast.error(`Card ${i + 1}: Recipient name is required for gifts`);
          return false;
        }
        
        if (!card.recipient_email || !card.recipient_email.includes("@")) {
          toast.error(`Card ${i + 1}: Valid recipient email is required for gifts`);
          return false;
        }
      }
    }

    return true;
  };

  // Submit purchase
  const handlePurchase = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/giftcard/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: cards.map(card => ({
            amount: card.amount,
            recipient_email: card.isGift ? card.recipient_email : "",
            recipient_name: card.isGift ? card.recipient_name : "",
            message: card.isGift ? card.message : "",
            is_gift: card.isGift,
          })),
          sender_name: senderName,
          sender_email: senderEmail,
          sender_phone: senderPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎁 Purchase Gift Cards
          </h1>
          <p className="text-lg text-gray-600">
            Give the gift of wellness and relaxation
          </p>
        </div>

        {/* Your Information */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-2 border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email *
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Phone Number *
              </label>
              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+1 (416) 123-4567"
                required
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            We'll send the gift card(s) and receipt to this email
          </p>
        </div>

        {/* Cards Section */}
        <div className="space-y-6 mb-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-100 hover:border-indigo-200 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Gift Card #{index + 1}
                </h3>
                {cards.length > 1 && (
                  <button
                    onClick={() => removeCard(index)}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (CAD) *
                  </label>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {presetAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => updateCard(index, "amount", amount)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                          card.amount === amount
                            ? "bg-indigo-500 text-white border-indigo-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300"
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={card.amount}
                    onChange={(e) => updateCard(index, "amount", parseInt(e.target.value) || 150)}
                    min={150}
                    max={10000}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Custom amount (min $150)"
                  />
                </div>

                {/* Is Gift Checkbox */}
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <input
                    type="checkbox"
                    id={`isGift-${index}`}
                    checked={card.isGift}
                    onChange={(e) => updateCard(index, "isGift", e.target.checked)}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label 
                    htmlFor={`isGift-${index}`}
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    💝 This is a gift for someone else
                  </label>
                </div>

                {/* Recipient Info (only show if isGift) */}
                {card.isGift && (
                  <div className="border-l-4 border-indigo-500 pl-4 space-y-4">
                    <p className="text-sm font-medium text-indigo-700 mb-3">
                      Recipient Information
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recipient Name *
                        </label>
                        <input
                          type="text"
                          value={card.recipient_name}
                          onChange={(e) => updateCard(index, "recipient_name", e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Jane Doe"
                          required={card.isGift}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recipient Email *
                        </label>
                        <input
                          type="email"
                          value={card.recipient_email}
                          onChange={(e) => updateCard(index, "recipient_email", e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="friend@example.com"
                          required={card.isGift}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personal Message (Optional)
                      </label>
                      <textarea
                        value={card.message}
                        onChange={(e) => updateCard(index, "message", e.target.value)}
                        rows={3}
                        maxLength={200}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        placeholder="Wishing you relaxation and rejuvenation..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {card.message.length}/200 characters
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Card Button */}
          {cards.length < 50 && (
            <button
              onClick={addCard}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors font-medium"
            >
              + Add Another Gift Card
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium">Total Gift Cards:</span>
            <span className="text-2xl font-bold">{cards.length}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-medium">For Yourself:</span>
            <span className="text-xl font-semibold">
              {cards.filter(c => !c.isGift).length}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium">As Gifts:</span>
            <span className="text-xl font-semibold">
              {cards.filter(c => c.isGift).length}
            </span>
          </div>
          <div className="border-t border-white/30 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Amount:</span>
              <span className="text-3xl font-bold">${total.toFixed(2)} CAD</span>
            </div>
          </div>
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={isProcessing}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            `Proceed to Payment - $${total.toFixed(2)}`
          )}
        </button>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-600 space-y-1">
          <p>✓ Secure payment via Stripe</p>
          <p>✓ Gift cards valid for 2 years</p>
          <p>✓ PDF cards sent via email instantly</p>
          <p>✓ Can be used in-store or online</p>
        </div>
      </div>
    </div>
  );
}
