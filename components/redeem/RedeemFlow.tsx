//components/redeem/RedeemFlow.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GiftCardDisplay from './GiftCardDisplay';
import EmailVerification from './EmailVerification';
import RedeemSuccess from './RedeemSuccess';
import { createClient } from '@/lib/supabase/client';

type RedeemStep = 
  | 'display'           // Show gift card
  | 'verify_email'      // Email verification
  | 'choose_action'     // Choose wallet vs direct use
  | 'login_required'    // User needs to login
  | 'signup_required'   // User needs to signup
  | 'redeeming'         // Processing redemption
  | 'success';          // Success!

interface GiftCardData {
  id: string;
  code: string;
  amount: number;
  expiresAt: string;
  recipientEmail?: string;
}

interface RedeemFlowProps {
  token: string;
  initialGiftCard: GiftCardData;
}

export default function RedeemFlow({ token, initialGiftCard }: RedeemFlowProps) {
  const router = useRouter();
  
  const [step, setStep] = useState<RedeemStep>('display');
  const [email, setEmail] = useState('');
  const [flow, setFlow] = useState<'direct' | 'require_login' | 'require_signup'>('direct');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [redemptionData, setRedemptionData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: {user } }) =>{
      if (user) {
        setUser(user);
        console.log('✅ 初始用户状态:', user.email);

        if (step === 'login_required' || step === 'signup_required'){
          console.log('🚀 自动推进到选择步骤');
          setStep('choose_action');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 认证事件:', event);
        console.log('👤 用户:', session?.user?.email);
        console.log('📍 当前步骤:', step);

        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          console.log('✅ 用户已登录，应该推进步骤');

          if (step === 'login_required' || step === 'signup_required') {
            console.log('🚀 推进到选择步骤');
            setStep('choose_action');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          console.log('❌ 用户已登出');
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [step]);

  // Step 1: Start redemption process
  const handleStartRedemption = () => {
    setStep('verify_email');
  };

  // Step 2: Verify email
  const handleEmailVerify = async (inputEmail: string) => {
    setIsLoading(true);
    setError('');
    setEmail(inputEmail);

    try {
      const response = await fetch('/api/giftcard/redeem/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: inputEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        setIsLoading(false);
        return;
      }

      setFlow(data.flow);

      // Handle different flows
      if (data.flow === 'direct') {
        // User is logged in with correct email, proceed to action choice
        setStep('choose_action');
      } else if (data.flow === 'require_login') {
        // User needs to login
        setStep('login_required');
      } else if (data.flow === 'require_signup') {
        // User needs to signup
        setStep('signup_required');
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify email. Please try again.');
      setIsLoading(false);
    }
  };

  // Step 3: Choose action (wallet or direct)
  const handleActionChoice = async (action: 'wallet' | 'direct') => {
    setStep('redeeming');
    setError('');

    try {
      const response = await fetch('/api/giftcard/redeem/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action, email }),
      });

      const data = await response.json();
      console.log('📨 API 响应数据:', data);

      if (!response.ok) {
        setError(data.error || 'Redemption failed');
        setStep('choose_action');
        return;
      }

      setRedemptionData(data.redemption);
      setStep('success');
    } catch (err) {
      console.error('Redemption error:', err);
      setError('Failed to redeem gift card. Please try again.');
      setStep('choose_action');
    }
  };

  // Handle login redirect
  const handleLogin = () => {
    // Store current URL for redirect after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    router.push(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  // Handle signup redirect
  const handleSignup = () => {
    // Store current URL for redirect after signup
    sessionStorage.setItem('redirectAfterSignup', window.location.pathname);
    router.push(`/sign-up?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['display', 'verify_email', 'choose_action', 'success'].map((s, idx) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              step === s
                ? 'w-8 bg-emerald-600'
                : ['display', 'verify_email', 'choose_action'].indexOf(step) >= idx
                ? 'w-2 bg-emerald-600'
                : 'w-2 bg-slate-300'
            }`}
          />
        ))}
      </div>

      {/* Display Gift Card */}
      {step === 'display' && (
        <div className="space-y-6">
          <GiftCardDisplay
            code={initialGiftCard.code}
            amount={initialGiftCard.amount.toString()}
            expiresAt={initialGiftCard.expiresAt}
            status="active"
            showExpiry={true}
          />

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              Ready to Redeem?
            </h3>
            <p className="text-slate-600 mb-6">
              Click below to start the redemption process. You&apos;ll be able to
              choose how to use your gift card.
            </p>

            <button
              onClick={handleStartRedemption}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <span>Start Redemption</span>
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
            </button>
          </div>
        </div>
      )}

      {/* Email Verification */}
      {step === 'verify_email' && (
        <div className="space-y-6">
          <GiftCardDisplay
            code={initialGiftCard.code}
            amount={initialGiftCard.amount.toString()}
            expiresAt={initialGiftCard.expiresAt}
            status="active"
            showExpiry={false}
          />

          <EmailVerification
            onVerify={handleEmailVerify}
            isLoading={isLoading}
            error={error}
            recipientEmail={initialGiftCard.recipientEmail}
          />
        </div>
      )}

      {/* Login Required */}
      {step === 'login_required' && (
        <div className="space-y-6">
          <GiftCardDisplay
            code={initialGiftCard.code}
            amount={initialGiftCard.amount.toString()}
            expiresAt={initialGiftCard.expiresAt}
            status="active"
            showExpiry={false}
          />

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-3">
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
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-2">
                Login to Continue
              </h3>
              <p className="text-slate-600">
                This email is already registered. Please log in to redeem your gift card.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Email</div>
              <div className="text-sm font-medium text-slate-900">{email}</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLogin}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span>Log In</span>
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
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </button>

              <button
                onClick={() => setStep('verify_email')}
                className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Use Different Email
              </button>
            </div>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                After logging in, you&apos;ll be brought back here to complete the redemption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signup Required */}
      {step === 'signup_required' && (
        <div className="space-y-6">
          <GiftCardDisplay
            code={initialGiftCard.code}
            amount={initialGiftCard.amount.toString()}
            expiresAt={initialGiftCard.expiresAt}
            status="active"
            showExpiry={false}
          />

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-2">
                Create an Account
              </h3>
              <p className="text-slate-600">
                Create a free account to redeem your gift card and manage your balance.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Email</div>
              <div className="text-sm font-medium text-slate-900">{email}</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSignup}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span>Create Account</span>
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </button>

              <button
                onClick={handleLogin}
                className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Already Have an Account? Log In
              </button>
            </div>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                After creating your account, you&apos;ll be brought back here to complete the redemption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Choose Action */}
      {step === 'choose_action' && (
        <div className="space-y-6">
          <GiftCardDisplay
            code={initialGiftCard.code}
            amount={initialGiftCard.amount.toString()}
            expiresAt={initialGiftCard.expiresAt}
            status="active"
            showExpiry={false}
          />

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-2">
                How would you like to use this gift card?
              </h3>
              <p className="text-slate-600">
                Choose the option that works best for you
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
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
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* Option 1: Add to Wallet */}
              <button
                onClick={() => handleActionChoice('wallet')}
                className="group p-6 border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
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
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 mb-1">
                      Add to Wallet
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Save the balance to your account and use it anytime
                    </p>
                    <ul className="space-y-1 text-xs text-slate-500">
                      <li className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Use across multiple visits
                      </li>
                      <li className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Never expires in wallet
                      </li>
                      <li className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Easy to track
                      </li>
                    </ul>
                  </div>
                </div>
              </button>

              {/* Option 2: Use Directly */}
              <button
                onClick={() => handleActionChoice('direct')}
                className="group p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 mb-1">
                      Use Directly
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Apply this gift card to your next booking immediately
                    </p>
                    <ul className="space-y-1 text-xs text-slate-500">
                      <li className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Quick and easy
                      </li>
                      <li className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Use for one booking
                      </li>
                      <li className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        No wallet needed
                      </li>
                    </ul>
                  </div>
                </div>
              </button>
            </div>

            <p className="mt-6 text-xs text-center text-slate-500">
              You can change your mind later if you add to wallet
            </p>
          </div>
        </div>
      )}

      {/* Redeeming (Loading) */}
      {step === 'redeeming' && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <svg
                className="animate-spin h-8 w-8"
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
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">
              Redeeming Your Gift Card...
            </h3>
            <p className="text-slate-600">
              Please wait while we process your redemption
            </p>
          </div>
        </div>
      )}

      {/* Success */}
      {step === 'success' && redemptionData && (
        <RedeemSuccess
          giftCard={initialGiftCard}
          redemption={redemptionData}
        />
      )}
    </div>
  );
}
