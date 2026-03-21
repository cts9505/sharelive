'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

interface Payment {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  planType: string;
  couponCode: string | null;
  discountAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  createdAt: string;
  completedAt: string;
}

export const PaymentDetailsCard = ({ projectId }: { projectId: string }) => {
  const { data: session } = useSession();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!session?.accessToken) return;

      try {
        const response = await fetch(`${API_BASE}/api/payments/project/${projectId}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPayment(data.payment);
        }
      } catch (error) {
        console.error('Failed to fetch payment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [projectId, session]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-3">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Payment Details</h3>
            <p className="text-sm text-muted-foreground">No payment information found</p>
          </div>
        </div>
      </div>
    );
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'upi':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.5 18.5l-1-1 1.5-1.5-1.5-1.5 1-1 2.5 2.5-2.5 2.5zm3 0l-1-1 1.5-1.5-1.5-1.5 1-1 2.5 2.5-2.5 2.5z" />
            <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8z" />
          </svg>
        );
      case 'netbanking':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'wallet':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">Payment Details</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(payment.completedAt || payment.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          {payment.status}
        </span>
      </div>

      {/* Payment Info */}
      <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
        {/* Amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount Paid</span>
          <span className="text-xl font-bold text-foreground">
            ₹{(payment.amount / 100).toFixed(2)}
          </span>
        </div>

        {/* Discount if applied */}
        {payment.discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 dark:text-green-400">
              Discount Applied {payment.couponCode && `(${payment.couponCode})`}
            </span>
            <span className="text-green-600 dark:text-green-400">
              -₹{(payment.discountAmount / 100).toFixed(2)}
            </span>
          </div>
        )}

        {/* GST Breakdown */}
        {payment.gstAmount > 0 && (
          <>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (excl. GST)</span>
                <span className="text-foreground">
                  ₹{((payment.amount - payment.gstAmount) / 100).toFixed(2)}
                </span>
              </div>
              {payment.cgst > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">CGST (9%)</span>
                  <span className="text-foreground">₹{(payment.cgst / 100).toFixed(2)}</span>
                </div>
              )}
              {payment.sgst > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SGST (9%)</span>
                  <span className="text-foreground">₹{(payment.sgst / 100).toFixed(2)}</span>
                </div>
              )}
              {payment.igst > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">IGST (18%)</span>
                  <span className="text-foreground">₹{(payment.igst / 100).toFixed(2)}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Payment Method */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-sm text-muted-foreground">Payment Method</span>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            {getPaymentMethodIcon(payment.method)}
            <span className="capitalize">{payment.method || 'Online'}</span>
          </span>
        </div>

        {/* Transaction IDs */}
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs text-muted-foreground">Order ID</span>
            <span className="font-mono text-xs text-foreground truncate max-w-[200px]">
              {payment.orderId}
            </span>
          </div>
          {payment.paymentId && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs text-muted-foreground">Payment ID</span>
              <span className="font-mono text-xs text-foreground truncate max-w-[200px]">
                {payment.paymentId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Payment receipt sent to your email</span>
      </div>
    </div>
  );
};
