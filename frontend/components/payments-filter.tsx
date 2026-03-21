'use client';

import { useState, useMemo } from 'react';

interface Payment {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  planType: string | null;
  description: string | null;
  couponCode: string | null;
  discountAmount: number;
  paymentMethod: string | null;
  failureReason: string | null;
  gstAmount: number | null;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  createdAt: string;
  completedAt: string | null;
  projectSubdomain: string | null;
}

type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

interface PaymentsFilterProps {
  payments: Payment[];
}

function formatAmount(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
}

function getPaymentStatusColor(status: Payment['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-500';
    case 'pending':
    case 'processing':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'failed':
    case 'cancelled':
      return 'bg-red-500/10 text-red-500';
    case 'refunded':
      return 'bg-blue-500/10 text-blue-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
}

function getPaymentMethodIcon(method: string | null): JSX.Element {
  if (!method) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    );
  }
  
  const lowerMethod = method.toLowerCase();
  
  if (lowerMethod.includes('card') || lowerMethod.includes('credit') || lowerMethod.includes('debit')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    );
  }
  
  if (lowerMethod.includes('upi') || lowerMethod.includes('vpa')) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.5 13.5L7.5 16.5M13.5 10.5L16.5 7.5M7.5 7.5L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    );
  }
  
  if (lowerMethod.includes('netbanking') || lowerMethod.includes('bank')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  }
  
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export function PaymentsFilter({ payments }: PaymentsFilterProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');

  const filteredAndSortedPayments = useMemo(() => {
    let result = [...payments];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.razorpayOrderId?.toLowerCase().includes(searchLower) ||
        p.razorpayPaymentId?.toLowerCase().includes(searchLower) ||
        p.projectSubdomain?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter === 'completed') {
      result = result.filter(p => p.status === 'completed');
    } else if (statusFilter === 'pending') {
      result = result.filter(p => p.status === 'pending' || p.status === 'processing');
    } else if (statusFilter === 'failed') {
      result = result.filter(p => p.status === 'failed' || p.status === 'cancelled' || p.status === 'refunded');
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.amount - a.amount;
        case 'lowest':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [payments, statusFilter, sort, search]);

  const completedCount = payments.filter(p => p.status === 'completed').length;
  const pendingCount = payments.filter(p => p.status === 'pending' || p.status === 'processing').length;
  const failedCount = payments.filter(p => p.status === 'failed' || p.status === 'cancelled' || p.status === 'refunded').length;

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 mx-auto text-muted-foreground mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-muted-foreground">No payment history yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by order ID, subdomain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l border-border ${
                statusFilter === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l border-border ${
                statusFilter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l border-border ${
                statusFilter === 'failed'
                  ? 'bg-red-500 text-white'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Failed ({failedCount})
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      {(search || statusFilter !== 'all') && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredAndSortedPayments.length} of {payments.length} payments
        </p>
      )}

      {/* Payments List */}
      {filteredAndSortedPayments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-muted-foreground mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-muted-foreground">No payments found matching your criteria</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="mt-3 text-sm text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedPayments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-lg bg-muted p-2.5 text-muted-foreground">
                    {getPaymentMethodIcon(payment.paymentMethod)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {payment.description || payment.planType || 'Premium Upgrade'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>#{payment.razorpayOrderId.slice(-8)}</span>
                      {payment.projectSubdomain && (
                        <>
                          <span>•</span>
                          <span>{payment.projectSubdomain}.sharelive.site</span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right pl-12 sm:pl-0">
                  <p className="text-lg font-bold text-foreground">
                    {formatAmount(payment.amount, payment.currency)}
                  </p>
                  {payment.discountAmount > 0 && (
                    <p className="text-xs text-green-500">
                      Saved {formatAmount(payment.discountAmount, payment.currency)}
                    </p>
                  )}
                  {payment.paymentMethod && (
                    <p className="text-xs text-muted-foreground capitalize">
                      via {payment.paymentMethod}
                    </p>
                  )}
                </div>
              </div>
              
              {payment.failureReason && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg p-3">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{payment.failureReason}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
