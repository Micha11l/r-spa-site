'use client';

import { useState } from 'react';
import { isValidEmail } from '@/lib/giftcard/client-utils';

interface EmailVerificationProps {
  onVerify: (email: string) => void;
  isLoading: boolean;
  error?: string;
  recipientEmail?: string;
}

export default function EmailVerification({
  onVerify,
  isLoading,
  error,
  recipientEmail,
}: EmailVerificationProps) {
  const [email, setEmail] = useState(recipientEmail || '');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // If recipient email is specified, verify it matches
    if (recipientEmail && email.toLowerCase() !== recipientEmail.toLowerCase()) {
      setEmailError('This email does not match the gift card recipient');
      return;
    }

    setEmailError('');
    onVerify(email);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-slate-900 mb-2">
          Verify Your Email
        </h3>
        <p className="text-sm text-slate-600">
          {recipientEmail
            ? 'Please confirm the email address this gift card was sent to'
            : 'Enter your email address to continue'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
            disabled={isLoading || !!recipientEmail}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
              emailError || error
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-slate-300'
            } ${
              isLoading || recipientEmail
                ? 'bg-slate-50 cursor-not-allowed'
                : 'bg-white'
            }`}
            placeholder="your.email@example.com"
            autoComplete="email"
            autoFocus={!recipientEmail}
          />

          {/* Error Message */}
          {(emailError || error) && (
            <div className="mt-2 flex items-start gap-2 text-red-600 text-sm">
              <svg
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{emailError || error}</span>
            </div>
          )}
        </div>

        {/* Info Box */}
        {recipientEmail && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2 text-blue-800 text-sm">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>
                This gift card was sent to <strong>{recipientEmail}</strong>
              </p>
            </div>
          </div>
        )}

        {!recipientEmail && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex items-start gap-2 text-slate-600 text-sm">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <p>
                We&apos;ll verify your email and check if you have an existing
                account
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
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
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Privacy Note */}
      <p className="mt-4 text-xs text-center text-slate-500">
        Your email will only be used for gift card redemption verification
      </p>
    </div>
  );
}