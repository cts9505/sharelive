'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Project, HostingPlatform } from '@/lib/sharelive-types';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

// Platform detection and configuration steps
const PLATFORM_CONFIG: Record<HostingPlatform, { name: string; steps: string[] }> = {
  vercel: {
    name: 'Vercel',
    steps: [
      'Go to your Vercel project dashboard',
      'Navigate to Settings → Domains',
      'Click "Add Domain"',
      'Enter: {subdomain}.sharelive.site',
      'Vercel will verify the CNAME automatically',
    ],
  },
  netlify: {
    name: 'Netlify',
    steps: [
      'Open your Netlify site dashboard',
      'Go to Site Settings → Domain Management',
      'Click "Add custom domain"',
      'Enter: {subdomain}.sharelive.site',
      'Netlify will detect the CNAME configuration',
    ],
  },
  render: {
    name: 'Render',
    steps: [
      'Go to your Render service dashboard',
      'Navigate to Settings → Custom Domains',
      'Click "Add Custom Domain"',
      'Enter: {subdomain}.sharelive.site',
    ],
  },
  railway: {
    name: 'Railway',
    steps: [
      'Open your Railway project',
      'Go to Settings → Domains',
      'Click "Custom Domain"',
      'Enter: {subdomain}.sharelive.site',
    ],
  },
  flyio: {
    name: 'Fly.io',
    steps: [
      'Run: flyctl certs add {subdomain}.sharelive.site',
      'Or add via Fly.io dashboard → Certificates',
    ],
  },
  heroku: {
    name: 'Heroku',
    steps: [
      'Go to your app dashboard',
      'Navigate to Settings → Domains',
      'Click "Add domain"',
      'Enter: {subdomain}.sharelive.site',
    ],
  },
  azure: {
    name: 'Azure',
    steps: [
      'Open Azure portal',
      'Go to your Static Web App or App Service',
      'Navigate to Custom domains',
      'Click "Add" and enter: {subdomain}.sharelive.site',
    ],
  },
  cloudflare: {
    name: 'Cloudflare Pages',
    steps: [
      'Go to Cloudflare Pages dashboard',
      'Select your project',
      'Navigate to Custom domains',
      'Click "Set up a custom domain"',
      'Enter: {subdomain}.sharelive.site',
    ],
  },
  firebase: {
    name: 'Firebase',
    steps: [
      'Go to Firebase Console',
      'Select Hosting',
      'Click "Add custom domain"',
      'Enter: {subdomain}.sharelive.site',
      'Follow Firebase verification steps',
    ],
  },
  other: {
    name: 'Other Platform',
    steps: [
      'Contact your hosting provider',
      'Request to add custom domain: {subdomain}.sharelive.site',
      'Configure your platform to accept the custom domain',
    ],
  },
};

function detectPlatform(targetUrl: string): HostingPlatform {
  try {
    const hostname = new URL(targetUrl).hostname.toLowerCase();
    
    if (hostname.includes('vercel')) return 'vercel';
    if (hostname.includes('netlify')) return 'netlify';
    if (hostname.includes('render')) return 'render';
    if (hostname.includes('railway')) return 'railway';
    if (hostname.includes('fly.dev')) return 'flyio';
    if (hostname.includes('herokuapp')) return 'heroku';
    if (hostname.includes('azure')) return 'azure';
    if (hostname.includes('cloudflare') || hostname.includes('pages.dev')) return 'cloudflare';
    if (hostname.includes('firebase') || hostname.includes('web.app')) return 'firebase';
    
    return 'other';
  } catch {
    return 'other';
  }
}

export const ProjectDetailsCard = ({ project }: { project: Project }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [targetUrl, setTargetUrl] = useState(project.targetUrl);
  const [isSaving, setIsSaving] = useState(false);
  
  const detectedPlatform = detectPlatform(targetUrl);
  const platformConfig = PLATFORM_CONFIG[detectedPlatform];

  const handleSave = async () => {
    if (!session?.accessToken) {
      toast.error('Not authenticated');
      return;
    }

    if (targetUrl === project.targetUrl) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE}/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ targetUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Handle validation errors from Zod
        if (data.details && Array.isArray(data.details)) {
          const messages = data.details.map((detail: any) => detail.message).join('. ');
          toast.error(messages);
        } else {
          toast.error(data.error ?? 'Failed to update target URL');
        }
        setIsSaving(false);
        return;
      }

      toast.success('Target URL updated successfully!');
      setIsEditing(false);
      setIsSaving(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while updating target URL.');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTargetUrl(project.targetUrl);
    setIsEditing(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Subdomain Configuration</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your subdomain routing and target URL
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${
          project.plan === 'paid_direct' 
            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {project.plan.replace('_', ' ')}
        </span>
      </div>

      {/* Subdomain */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Your Subdomain
        </label>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <a 
            href={`http://${project.subdomain}.sharelive.site`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-mono hover:underline"
          >
            {project.subdomain}.sharelive.site
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${project.subdomain}.sharelive.site`);
              toast.success('Copied to clipboard!');
            }}
            className="ml-auto p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Target URL */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Target URL
        </label>
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://myapp.vercel.app"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Must be from: Vercel, Netlify, Render, Railway, Fly.io, Heroku, Cloudflare Pages, or Firebase
            </p>

            {/* Platform-Specific Configuration Steps */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="font-medium text-primary">Configuration Steps for {platformConfig.name}</h4>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {platformConfig.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">
                      {step.replace('{subdomain}', project.subdomain)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <a 
                href={project.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground font-mono text-sm hover:text-primary break-all"
              >
                {project.targetUrl}
              </a>
              <button
                onClick={() => setIsEditing(true)}
                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </div>
            
            {/* Platform Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Detected Platform:</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                {platformConfig.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Created</p>
          <p className="text-sm text-foreground">
            {new Date(project.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
          <p className="text-sm text-foreground">
            {project.updatedAt
              ? new Date(project.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Not yet updated'}
          </p>
        </div>
      </div>
    </div>
  );
};
