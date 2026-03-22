import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import type { Project } from '@/lib/sharelive-types';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, getAuthHeaders } from '../../lib/auth';
import { ProjectsFilter } from '../../components/projects-filter';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your ShareLive subdomains and deployments from one centralized dashboard.',
  robots: { index: false, follow: false },
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

interface UserProfile {
  fullName: string | null;
  email: string;
  onboardingCompleted: boolean;
}

async function fetchDashboardData() {
  const session = await getSession();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }

  try {
    const headers = await getAuthHeaders();
    
    // Fetch projects
    const projectsResponse = await fetch(`${API_BASE}/api/projects/my`, {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // Fetch user profile
    const profileResponse = await fetch(`${API_BASE}/api/users/profile`, {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (projectsResponse.status === 401 || profileResponse.status === 401) {
      redirect('/login');
    }

    let projects: Project[] = [];
    let profile: UserProfile | null = null;

    if (projectsResponse.ok) {
      const data = await projectsResponse.json();
      projects = data.projects ?? [];
    }

    if (profileResponse.ok) {
      profile = await profileResponse.json();
    }

    return { projects, profile, userName: session.user.name || profile?.fullName || 'there' };
  } catch (error) {
    console.warn('Failed to load dashboard data', error);
    return { projects: [], profile: null, userName: 'there' };
  }
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getPlatformIcon(platform: string | null | undefined): JSX.Element {
  const iconClass = "w-4 h-4";
  
  switch (platform?.toLowerCase()) {
    case 'vercel':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2z"/>
        </svg>
      );
    case 'netlify':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.934 8.519a1.044 1.044 0 0 1 .303.23l2.349-1.045-2.192-2.171-.491 2.954zM12.06 6.546a1.305 1.305 0 0 1 .209.574l3.497 1.482a1.044 1.044 0 0 1 .36-.22l.49-2.954-3.065-.936-1.491 2.054zM9.181 8.592c.161.134.295.3.394.487l1.946-.464-.696-1.819-.394.487-1.25 1.309zM14.348 11.682a1.44 1.44 0 0 1-.166.677l.904.904h2.04l-2.778-1.581zM10.578 9.054a1.277 1.277 0 0 1-.085.512l1.381 1.27.696-2.049-1.992.267zM12.1 11.07a1.277 1.277 0 0 1-.161-.567l-1.232-1.135-.696 2.049 2.089-.347zM8.883 9.911a1.305 1.305 0 0 1-.859-.337l-1.946.464 3.381 3.111.905-.904a1.44 1.44 0 0 1-.166-.677l-1.315-1.657zM14.348 12.909a1.44 1.44 0 0 1-1.036.437c-.072 0-.143-.005-.213-.016l-.905.904 3.973 3.653 1.491-2.054-3.31-2.924z"/>
        </svg>
      );
    case 'railway':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M.113 10.27A11.943 11.943 0 000 12c0 .946.108 1.868.314 2.75h8.036l-8.237-4.48zM1.074 17.5c.14.239.29.472.45.7h6.55l-7-3.81v3.11zM.68 6.5h7.92l-7.287 3.97A12.04 12.04 0 01.68 6.5zM2.727 3.5l8.073 4.39V3.5H2.727zM23.32 6.5h-8.52l7.287 3.97c.432-1.27.684-2.623.713-4.03.004.02.02.04.02.06zM10.8 3.5v4.39l8.073-4.39H10.8zM23.526 18.2l-7-3.81v3.11h6.55c.16-.228.31-.461.45-.7v.4zM23.886 10.27l-8.236 4.48h8.036A11.943 11.943 0 0024 12c0-.59-.04-1.17-.114-1.73z"/>
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
  }
}

export default async function DashboardPage() {
  const { projects, profile, userName } = await fetchDashboardData();

  // Calculate statistics
  const totalProjects = projects.length;
  const paidProjects = projects.filter(p => p.plan === 'paid_direct').length;
  const freeProjects = projects.filter(p => p.plan === 'free_proxy').length;
  const totalVisits = projects.reduce((sum, p) => sum + (p.totalVisits || 0), 0);
  
  // Sort projects by last visited or created
  const sortedProjects = [...projects].sort((a, b) => {
    const dateA = new Date(a.lastVisitedAt || a.createdAt).getTime();
    const dateB = new Date(b.lastVisitedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  // Get recent activity (projects with visits in last 7 days)
  const recentlyActive = projects.filter(p => {
    if (!p.lastVisitedAt) return false;
    const lastVisit = new Date(p.lastVisitedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastVisit > weekAgo;
  }).length;

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {getTimeOfDay()}, {userName}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your subdomains
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/settings"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Edit Profile
              </Link>
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Subdomain
              </Link>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{totalProjects}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Total Subdomains</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2.5">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{totalVisits.toLocaleString()}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Total Visits</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2.5">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{paidProjects}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Premium Plans</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2.5">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{recentlyActive}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Active This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Banner */}
        {profile && !profile.onboardingCompleted && (
          <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-yellow-500/20 p-2">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Complete Your Profile</h3>
                  <p className="text-sm text-muted-foreground">Finish setting up your account to unlock all features</p>
                </div>
              </div>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400 transition-colors"
              >
                Complete Setup
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Projects Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Subdomains</h2>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-8 md:p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No subdomains yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first subdomain to start routing traffic to your deployments with a custom sharelive.site URL.
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create your first subdomain
              </Link>
            </div>
          ) : (
            <ProjectsFilter projects={projects} />
          )}
        </section>

        {/* Quick Actions */}
        {projects.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                href="/projects/new"
                className="rounded-xl border border-border bg-card p-4 hover:bg-accent hover:border-primary/50 transition-all group"
              >
                <div className="rounded-lg bg-primary/10 w-10 h-10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="font-medium text-foreground text-sm">New Subdomain</p>
                <p className="text-xs text-muted-foreground mt-0.5">Create a new project</p>
              </Link>

              <Link
                href="/profile"
                className="rounded-xl border border-border bg-card p-4 hover:bg-accent hover:border-primary/50 transition-all group"
              >
                <div className="rounded-lg bg-blue-500/10 w-10 h-10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="font-medium text-foreground text-sm">View Profile</p>
                <p className="text-xs text-muted-foreground mt-0.5">Account & payments</p>
              </Link>

              <Link
                href="/settings"
                className="rounded-xl border border-border bg-card p-4 hover:bg-accent hover:border-primary/50 transition-all group"
              >
                <div className="rounded-lg bg-purple-500/10 w-10 h-10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="font-medium text-foreground text-sm">Settings</p>
                <p className="text-xs text-muted-foreground mt-0.5">Edit your info</p>
              </Link>

              <Link
                href="/feedback"
                className="rounded-xl border border-border bg-card p-4 hover:bg-accent hover:border-primary/50 transition-all group"
              >
                <div className="rounded-lg bg-green-500/10 w-10 h-10 flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="font-medium text-foreground text-sm">Feedback</p>
                <p className="text-xs text-muted-foreground mt-0.5">Help us improve</p>
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
