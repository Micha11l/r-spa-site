// app/giftcard/purchase/page.tsx
"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
// import ChristmasOfferBadge from "@/components/ChristmasOfferBadge";

type GiftCardForm = {
  id: string;
  amount: number;
  // 收件人信息（如果是礼物）
  recipient_email: string;
  recipient_name: string;
  message: string;
  // 是否送礼
  isGift: boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const createCard = (): GiftCardForm => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  amount: 1,
  recipient_email: "",
  recipient_name: "",
  message: "",
  isGift: false,
});
const senderFieldKeys = {
  name: "sender-name",
  email: "sender-email",
  phone: "sender-phone",
} as const;
const getCardFieldKey = (
  cardId: string,
  field: "amount" | "recipient_name" | "recipient_email",
) => `card-${cardId}-${field}`;

export default function PurchaseGiftCardPage() {
  const [cards, setCards] = useState<GiftCardForm[]>([createCard()]);
  
  // 购买人信息（发送人）
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const touchField = (key: string) =>
    setTouchedFields((prev) => ({ ...prev, [key]: true }));
  const showFieldError = (key: string, error: string) =>
    (touchedFields[key] || submitAttempted) && error ? error : "";

  const presetAmounts = [1, 150, 200, 300, 500, 1000];

  // Add a new card
  const addCard = () => {
    if (cards.length >= 50) {
      toast.error("Maximum 50 gift cards per purchase");
      return;
    }
    setCards((prev) => [...prev, createCard()]);
  };

  // Remove a card
  const removeCard = (index: number) => {
    if (cards.length === 1) {
      toast.error("Must have at least one gift card");
      return;
    }
    const cardId = cards[index]?.id;
    setCards((prev) => prev.filter((_, i) => i !== index));
    if (cardId) {
      setTouchedFields((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (key.startsWith(`card-${cardId}`)) delete next[key];
        });
        return next;
      });
    }
  };

  // Update a card field
  const updateCard = (
    index: number,
    field: keyof GiftCardForm,
    value: string | number | boolean,
  ) => {
    setCards((prev) => {
      const newCards = [...prev];
      newCards[index] = { ...newCards[index], [field]: value };
      return newCards;
    });
  };

  // Calculate total
  const total = cards.reduce((sum, card) => sum + card.amount, 0);

  const senderErrors = useMemo(
    () => ({
      name: senderName.trim() ? "" : "Please enter your name.",
      email: emailRegex.test(senderEmail) ? "" : "Enter a valid email address.",
      phone: senderPhone.trim().length >= 7 ? "" : "Phone number is required.",
    }),
    [senderName, senderEmail, senderPhone],
  );

  const cardErrors = useMemo(
    () =>
      cards.map((card) => ({
        amount:
          card.amount >= 1 && card.amount <= 10000
            ? ""
            : "Amount must be between $1 and $10,000.",
        recipient_name:
          card.isGift && !card.recipient_name.trim()
            ? "Recipient name is required for gifts."
            : "",
        recipient_email:
          card.isGift && !emailRegex.test(card.recipient_email)
            ? "Recipient email must be valid."
            : "",
      })),
    [cards],
  );

  const formHasErrors = useMemo(() => {
    if (Object.values(senderErrors).some(Boolean)) return true;
    return cardErrors.some((errors) => Object.values(errors).some(Boolean));
  }, [senderErrors, cardErrors]);

  // Validate form
  const validateForm = (): boolean => {
    setSubmitAttempted(true);
    if (formHasErrors) {
      toast.error("Please fix the highlighted fields.");
      return false;
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
          cards: cards.map(({ amount, recipient_email, recipient_name, message, isGift }) => ({
            amount,
            recipient_email: isGift ? recipient_email : "",
            recipient_name: isGift ? recipient_name : "",
            message: isGift ? message : "",
            is_gift: isGift,
          })),
          sender_name: senderName,
          sender_email: senderEmail,
          sender_phone: senderPhone,
        }),
      });

      // Check if response is ok before parsing
      if (!response.ok) {
        // Try to parse JSON error, fallback to text if it fails
        let errorMessage = "Failed to create checkout";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          const text = await response.text();
          console.error("Non-JSON response:", text);
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

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

        {/* Holiday Gift Card Bonus Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-purple-300">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">🎄 Holiday Gift Card Bonus</h2>
            <p className="text-lg mb-1">
              Buy a CA$200 gift card, get a CA$20 bonus.
            </p>
            <p className="text-xs text-white/80 mt-3">
              Limited time. Bonus details shown at checkout or honored by staff.
            </p>
          </div>
        </div>

        {/* Your Information */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-2 border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={senderFieldKeys.name}>
                Your Name *
              </label>
              <input
                id={senderFieldKeys.name}
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                onBlur={() => touchField(senderFieldKeys.name)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="John Doe"
                required
                autoComplete="name"
                aria-invalid={Boolean(showFieldError(senderFieldKeys.name, senderErrors.name))}
                aria-describedby={
                  showFieldError(senderFieldKeys.name, senderErrors.name)
                    ? `${senderFieldKeys.name}-error`
                    : undefined
                }
              />
              {showFieldError(senderFieldKeys.name, senderErrors.name) && (
                <p id={`${senderFieldKeys.name}-error`} className="mt-1 text-sm text-red-600">
                  {showFieldError(senderFieldKeys.name, senderErrors.name)}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={senderFieldKeys.email}>
                Your Email *
              </label>
              <input
                id={senderFieldKeys.email}
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                onBlur={() => touchField(senderFieldKeys.email)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your@email.com"
                required
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(showFieldError(senderFieldKeys.email, senderErrors.email))}
                aria-describedby={
                  showFieldError(senderFieldKeys.email, senderErrors.email)
                    ? `${senderFieldKeys.email}-error`
                    : undefined
                }
              />
              {showFieldError(senderFieldKeys.email, senderErrors.email) && (
                <p id={`${senderFieldKeys.email}-error`} className="mt-1 text-sm text-red-600">
                  {showFieldError(senderFieldKeys.email, senderErrors.email)}
                </p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={senderFieldKeys.phone}>
                Your Phone Number *
              </label>
              <input
                id={senderFieldKeys.phone}
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                onBlur={() => touchField(senderFieldKeys.phone)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+1 (416) 123-4567"
                required
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={Boolean(showFieldError(senderFieldKeys.phone, senderErrors.phone))}
                aria-describedby={
                  showFieldError(senderFieldKeys.phone, senderErrors.phone)
                    ? `${senderFieldKeys.phone}-error`
                    : undefined
                }
              />
              {showFieldError(senderFieldKeys.phone, senderErrors.phone) && (
                <p id={`${senderFieldKeys.phone}-error`} className="mt-1 text-sm text-red-600">
                  {showFieldError(senderFieldKeys.phone, senderErrors.phone)}
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            We&apos;ll send the gift card(s) and receipt to this email
          </p>
        </div>

        {/* Cards Section */}
        <div className="space-y-6 mb-8">
          {cards.map((card, index) => {
            const errorsForCard = cardErrors[index] || {
              amount: "",
              recipient_email: "",
              recipient_name: "",
            };
            const amountKey = getCardFieldKey(card.id, "amount");
            const recipientNameKey = getCardFieldKey(card.id, "recipient_name");
            const recipientEmailKey = getCardFieldKey(card.id, "recipient_email");
            const amountError = showFieldError(amountKey, errorsForCard.amount);
            const recipientNameError = showFieldError(
              recipientNameKey,
              errorsForCard.recipient_name,
            );
            const recipientEmailError = showFieldError(
              recipientEmailKey,
              errorsForCard.recipient_email,
            );

            return (
              <div
                key={card.id}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={amountKey}>
                      Amount (CAD) *
                    </label>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {presetAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => {
                            updateCard(index, "amount", amount);
                            touchField(amountKey);
                          }}
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
                      id={amountKey}
                      type="number"
                      value={card.amount}
                      onChange={(e) =>
                        updateCard(index, "amount", parseInt(e.target.value, 10) || 1)
                      }
                      onBlur={() => touchField(amountKey)}
                      min={1}
                      max={10000}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Custom amount (min $1)"
                      aria-invalid={Boolean(amountError)}
                      aria-describedby={amountError ? `${amountKey}-error` : undefined}
                    />
                    {amountError && (
                      <p id={`${amountKey}-error`} className="mt-1 text-sm text-red-600">
                        {amountError}
                      </p>
                    )}
                  </div>

                  {/* Is Gift Checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <input
                      type="checkbox"
                      id={`isGift-${card.id}`}
                      checked={card.isGift}
                      onChange={(e) => updateCard(index, "isGift", e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label 
                      htmlFor={`isGift-${card.id}`}
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
                          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={recipientNameKey}>
                            Recipient Name *
                          </label>
                          <input
                            id={recipientNameKey}
                            type="text"
                            value={card.recipient_name}
                            onChange={(e) => updateCard(index, "recipient_name", e.target.value)}
                            onBlur={() => touchField(recipientNameKey)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Jane Doe"
                            required={card.isGift}
                            aria-invalid={Boolean(recipientNameError)}
                            aria-describedby={
                              recipientNameError ? `${recipientNameKey}-error` : undefined
                            }
                          />
                          {recipientNameError && (
                            <p id={`${recipientNameKey}-error`} className="mt-1 text-sm text-red-600">
                              {recipientNameError}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={recipientEmailKey}>
                            Recipient Email *
                          </label>
                          <input
                            id={recipientEmailKey}
                            type="email"
                            value={card.recipient_email}
                            onChange={(e) => updateCard(index, "recipient_email", e.target.value)}
                            onBlur={() => touchField(recipientEmailKey)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="friend@example.com"
                            required={card.isGift}
                            aria-invalid={Boolean(recipientEmailError)}
                            aria-describedby={
                              recipientEmailError ? `${recipientEmailKey}-error` : undefined
                            }
                          />
                          {recipientEmailError && (
                            <p id={`${recipientEmailKey}-error`} className="mt-1 text-sm text-red-600">
                              {recipientEmailError}
                            </p>
                          )}
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
                          onBlur={() => touchField(`card-${card.id}-message`)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {card.message.length}/200 characters
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

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
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
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

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 mb-8">
          <p className="font-semibold">Before you proceed to payment</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Confirm the CAD amount, especially for custom values or large orders.</li>
            <li>Double-check recipient names and emails if you selected the gift option.</li>
            <li>Payments are processed securely via Stripe Canada; you will see a confirmation step before authorizing.</li>
            <li>Digital cards are issued instantly, so corrections require contacting support.</li>
          </ul>
          <p className="mt-2">
            These steps keep us aligned with FINTRAC and provincial consumer protection guidelines for prepaid products.
          </p>
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

      {/* <ChristmasOfferBadge /> */}
    </div>
  );
}
