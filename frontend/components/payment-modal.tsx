'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

interface PaymentModalProps {
  projectId: string;
  projectName: string;
  hostingPlatform?: string;
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PaymentModal = ({ projectId, projectName, hostingPlatform, onClose, onSuccess }: PaymentModalProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<{
    discount: number;
    finalAmount: number;
    discountPercentage: number;
  } | null>(null);

  const originalAmount = 9900; // ₹99 in paise

  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (!session?.accessToken) {
      toast.error('Not authenticated');
      return;
    }

    setIsValidatingCoupon(true);

    try {
      const response = await fetch(`${API_BASE}/api/payments/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          code: code,
          amount: originalAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? 'Invalid coupon code');
        setCouponApplied(false);
        setDiscountInfo(null);
        return;
      }

      setCouponCode(code);
      setDiscountInfo({
        discount: data.discount,
        finalAmount: data.finalAmount,
        discountPercentage: data.discountPercentage,
      });
      setCouponApplied(true);
      toast.success(`Coupon applied! ${data.discountPercentage}% off`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to validate coupon');
      setCouponApplied(false);
      setDiscountInfo(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleValidateCoupon = () => validateCoupon(couponCode);

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
    setDiscountInfo(null);
    toast.success('Coupon removed');
  };

  const handlePayment = async () => {
    if (!session?.accessToken) {
      toast.error('Not authenticated');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create Razorpay order
      const orderResponse = await fetch(`${API_BASE}/api/payments/projects/${projectId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          couponCode: couponApplied ? couponCode : undefined,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        toast.error(orderData.error ?? 'Failed to create order');
        setIsProcessing(false);
        return;
      }

      // Step 2: Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        // Step 3: Initialize Razorpay
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'ShareLive',
          description: `Upgrade ${projectName} to Direct DNS`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            // Step 4: Verify payment
            try {
              const verifyResponse = await fetch(`${API_BASE}/api/payments/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  // Only send couponId if it exists in orderData notes (from backend)
                }),
              });

              const verifyData = await verifyResponse.json();

              if (!verifyResponse.ok) {
                toast.error('Payment verification failed');
                setIsProcessing(false);
                return;
              }

              // Step 5: Upgrade project
              const upgradeResponse = await fetch(`${API_BASE}/api/projects/${projectId}/upgrade`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({
                  paymentIntentId: response.razorpay_payment_id,
                  hostingPlatform: hostingPlatform,
                }),
              });

              if (!upgradeResponse.ok) {
                toast.error('Failed to upgrade project');
                setIsProcessing(false);
                return;
              }

              toast.success('Payment successful! Project upgraded 🎉');
              onSuccess();
              setTimeout(() => {
                router.refresh();
                onClose();
              }, 1000);
            } catch (error) {
              console.error(error);
              toast.error('Payment verification failed');
              setIsProcessing(false);
            }
          },
          prefill: {
            email: session.user?.email ?? '',
          },
          theme: {
            color: '#22d3ee', // cyan-400
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              toast.error('Payment cancelled');
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };

      script.onerror = () => {
        toast.error('Failed to load payment gateway');
        setIsProcessing(false);
      };
    } catch (error) {
      console.error(error);
      toast.error('Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  const displayAmount = discountInfo ? discountInfo.finalAmount : originalAmount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/10 p-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Upgrade to Direct DNS</h2>
              <p className="text-sm text-muted-foreground">{projectName}</p>
            </div>
          </div>
        </div>

        {/* Coupon Section */}
        <div className="mb-6 space-y-3">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Have a coupon code?
          </label>
          
          {/* Recommended Coupon */}
          {!couponApplied && (
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-primary">SAVE50</span>
                  <span className="text-xs text-muted-foreground ml-2">Get 50% off!</span>
                </div>
              </div>
              <button
                onClick={() => validateCoupon('SAVE50')}
                disabled={isProcessing || isValidatingCoupon}
                className="text-sm font-semibold text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
              >
                {isValidatingCoupon ? 'Applying...' : 'Apply'}
              </button>
            </div>
          )}
          
          {!couponApplied ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                disabled={isProcessing}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                onClick={handleValidateCoupon}
                disabled={isValidatingCoupon || isProcessing || !couponCode.trim()}
                className="rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isValidatingCoupon ? 'Checking...' : 'Apply'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {couponCode} - {discountInfo?.discountPercentage}% off
                </span>
              </div>
              <button
                onClick={handleRemoveCoupon}
                disabled={isProcessing}
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="mb-6 rounded-lg border border-border bg-muted p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Original Price</span>
            <span className="text-foreground">₹{(originalAmount / 100).toFixed(2)}</span>
          </div>
          
          {discountInfo && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Discount ({discountInfo.discountPercentage}%)</span>
              <span className="text-green-600 dark:text-green-400">-₹{(discountInfo.discount / 100).toFixed(2)}</span>
            </div>
          )}

          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-foreground">Total Amount</span>
              <span className="text-2xl font-bold text-primary">
                ₹{(displayAmount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-6 space-y-2">
          <div className="flex items-start gap-2 text-sm text-foreground">
            <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Direct DNS routing via Cloudflare</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-foreground">
            <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Automatic CNAME creation</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-foreground">
            <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Maximum performance - No proxy hop</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Pay ₹{(displayAmount / 100).toFixed(2)}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Security Note */}
        <p className="mt-4 text-xs text-center text-muted-foreground">
          🔒 Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
};
