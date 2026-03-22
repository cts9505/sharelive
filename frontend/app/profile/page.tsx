export const dynamic = 'force-dynamic';
import type { Project } from '@/lib/sharelive-types';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, getAuthHeaders } from '../../lib/auth';
import { ProjectsFilter } from '../../components/projects-filter';
import { PaymentsFilter } from '../../components/payments-filter';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  occupation: string | null;
  companyName: string | null;
  gstin: string | null;
  newsletterSubscribed: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

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

async function fetchUserProfile() {
  const session = await getSession();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }

  try {
    const headers = await getAuthHeaders();
    
    // Fetch user profile data
    const profileResponse = await fetch(`${API_BASE}/api/users/profile`, {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // Fetch user projects
    const projectsResponse = await fetch(`${API_BASE}/api/projects/my`, {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // Fetch user payments
    const paymentsResponse = await fetch(`${API_BASE}/api/users/payments`, {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if ([profileResponse.status, projectsResponse.status, paymentsResponse.status].includes(401)) {
      redirect('/login');
    }

    let profile: UserProfile | null = null;
    let projects: Project[] = [];
    let payments: Payment[] = [];

    if (profileResponse.ok) {
      profile = await profileResponse.json();
    }

    if (projectsResponse.ok) {
      const data = await projectsResponse.json();
      projects = (data.projects as Project[]) ?? [];
    }

    if (paymentsResponse.ok) {
      const data = await paymentsResponse.json();
      payments = (data.payments as Payment[]) ?? [];
    }

    return {
      profile,
      projects,
      payments,
      email: session.user.email ?? '',
      userId: session.user.id ?? '',
    };
  } catch (error) {
    console.warn('Failed to load profile', error);
    return { 
      profile: null, 
      projects: [], 
      payments: [],
      email: session.user.email ?? '', 
      userId: session.user.id ?? '' 
    };
  }
}

export default async function ProfilePage() {
  const { profile, projects, payments, email, userId } = await fetchUserProfile();

  const freeCount = projects.filter((p) => p.plan === 'free_proxy').length;
  const paidCount = projects.filter((p) => p.plan === 'paid_direct').length;
  const totalSubdomains = projects.length;
  const totalVisits = projects.reduce((sum, p) => sum + (p.totalVisits || 0), 0);

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 md:py-12 bg-background">
      <div className="mx-auto max-w-7xl">
        {/* Header with Profile Avatar */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg">
                  {profile?.fullName?.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()}
                </div>
                {profile?.onboardingCompleted && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-background">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {profile?.fullName || 'Welcome!'}
                </h1>
                <p className="text-muted-foreground">{email}</p>
                {profile?.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Edit Profile
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Personal Information Card */}
          <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-card-foreground">Personal Information</h2>
                <p className="text-sm text-muted-foreground">Your account details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Full Name</p>
                <p className="text-foreground font-medium">{profile?.fullName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Email</p>
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-medium">{email}</p>
                  {profile?.emailVerified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Phone Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-medium">{profile?.phoneNumber || 'Not provided'}</p>
                  {profile?.phoneVerified && profile?.phoneNumber && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Occupation</p>
                <p className="text-foreground font-medium">{profile?.occupation || 'Not provided'}</p>
              </div>
            </div>

            {/* Address Section */}
            {(profile?.addressLine1 || profile?.city || profile?.state || profile?.country) && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Address
                </h3>
                <div className="space-y-1 text-foreground">
                  {profile?.addressLine1 && <p>{profile.addressLine1}</p>}
                  {profile?.addressLine2 && <p>{profile.addressLine2}</p>}
                  <p>
                    {[profile?.city, profile?.state, profile?.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {profile?.country && <p>{profile.country}</p>}
                </div>
              </div>
            )}

            {/* Business Information */}
            {(profile?.companyName || profile?.gstin) && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile?.companyName && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Company Name</p>
                      <p className="text-foreground font-medium">{profile.companyName}</p>
                    </div>
                  )}
                  {profile?.gstin && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">GSTIN</p>
                      <p className="text-foreground font-mono text-sm">{profile.gstin}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Account Status & Quick Actions */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Account Status</h2>
                <p className="text-xs text-muted-foreground">Quick overview</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-foreground">Onboarding</p>
                    <p className="text-xs text-muted-foreground">Profile setup</p>
                  </div>
                </div>
                {profile?.onboardingCompleted ? (
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/20">
                    Complete
                  </span>
                ) : (
                  <Link href="/onboarding" className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 border border-primary/20">
                    Complete Now
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground">Verification</p>
                  </div>
                </div>
                {profile?.emailVerified ? (
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/20">
                    Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium border border-yellow-500/20">
                    Pending
                  </span>
                )}
              </div>

              {profile?.phoneNumber && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-foreground">Phone</p>
                      <p className="text-xs text-muted-foreground">{profile.phoneNumber}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/20">
                    ✓ Added
                  </span>
                </div>
              )}

              {profile?.newsletterSubscribed && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-foreground">Newsletter</p>
                    <p className="text-xs text-primary">Subscribed ✓</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">Account created</p>
              <p className="text-sm text-foreground font-medium">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'N/A'}
              </p>
            </div>
          </section>
        </div>

        {/* Statistics Section */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="rounded-lg bg-primary/10 p-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Project Statistics</h2>
              <p className="text-sm text-muted-foreground">Your subdomain performance overview</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="rounded-xl border border-border bg-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">{totalSubdomains}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Subdomains</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">{totalVisits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Visits</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">{paidCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Premium Plans</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-muted p-2">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">{freeCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Free Plans</p>
            </div>
          </div>
        </section>

        {/* Payment History Section */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <PaymentsFilter payments={payments} />
        </section>

        {/* Projects List */}
        <section className="mt-8">
          <ProjectsFilter projects={projects} showHeader={true} />
        </section>

        {/* Quick Actions */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Link
              href="/projects/new"
              className="rounded-xl border border-border bg-muted/30 p-4 hover:bg-muted/50 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">Create Subdomain</p>
                  <p className="text-xs text-muted-foreground">Connect a new deployment</p>
                </div>
              </div>
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-border bg-muted/30 p-4 hover:bg-muted/50 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">View Dashboard</p>
                  <p className="text-xs text-muted-foreground">Manage all projects</p>
                </div>
              </div>
            </Link>
            <Link
              href="/feedback"
              className="rounded-xl border border-border bg-muted/30 p-4 hover:bg-muted/50 hover:border-primary/30 transition-all group sm:col-span-2 md:col-span-1"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">Send Feedback</p>
                  <p className="text-xs text-muted-foreground">Help us improve</p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
