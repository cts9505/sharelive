export const dynamic = 'force-dynamic';
import type { Project } from '@/lib/sharelive-types';
import { redirect } from 'next/navigation';
import { API_BASE } from '@/lib/api-base';
import { ProjectHeader } from '../../../components/project-header';
import { AnalyticsSection } from '../../../components/analytics-section';
import { ProjectSettings } from '../../../components/project-settings';
import { UpgradeSectionNew } from '../../../components/upgrade-section-new';
import { DNSStatusCard } from '../../../components/dns-status-card';
import { PaymentDetailsCard } from '../../../components/payment-details-card';
import { DeleteProjectCard } from '../../../components/delete-project-card';
import { getAuthHeaders } from '../../../lib/auth';

async function fetchProject(id: string): Promise<{ project: Project | null; backendUnavailable: boolean }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/api/projects/my`, {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 401) {
      redirect('/login');
    }
    if (!response.ok) {
      return { project: null, backendUnavailable: false };
    }
    const data = await response.json();
    return {
      project: (data.projects as Project[]).find((project) => project.id === id) ?? null,
      backendUnavailable: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Failed to load project from API ${API_BASE}: ${message}`);
    return { project: null, backendUnavailable: true };
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { project, backendUnavailable } = await fetchProject(id);

  if (!project) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {backendUnavailable ? 'Backend Unavailable' : 'Project Not Found'}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {backendUnavailable
                ? `The frontend could not reach the API at ${API_BASE}. Make sure the backend is running and that NEXT_PUBLIC_API_BASE_URL points to the correct port.`
                : 'The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.'}
            </p>
            <a 
              href="/dashboard" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <div className="relative px-4 py-6 md:px-6 md:py-10">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Back Button */}
          <a 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </a>

          {/* Project Header */}
          <ProjectHeader project={project} />

          {/* Analytics Section */}
          <AnalyticsSection projectId={project.id} subdomain={project.subdomain} />

          {/* Two Column Layout for Settings & Upgrade */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Settings */}
            <ProjectSettings project={project} />

            {/* Upgrade Section */}
            <UpgradeSectionNew project={project} />
          </div>

          {/* DNS Status - Full Width (Only for paid plans) */}
          {project.plan === 'paid_direct' && (
            <DNSStatusCard project={project} />
          )}

          {/* Payment Details - Full Width (Only for paid plans) */}
          {project.plan === 'paid_direct' && (
            <PaymentDetailsCard projectId={project.id} />
          )}

          {/* Danger Zone */}
          <div className="pt-6 border-t border-border">
            <DeleteProjectCard project={project} />
          </div>
        </div>
      </div>
    </main>
  );
}
