'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Project, HostingPlatform } from '@/lib/sharelive-types';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

// Platform icons and colors
const PLATFORM_CONFIG: Record<HostingPlatform, { name: string; color: string; icon: string }> = {
  vercel: { name: 'Vercel', color: 'text-black dark:text-white', icon: '▲' },
  netlify: { name: 'Netlify', color: 'text-teal-500', icon: '◆' },
  render: { name: 'Render', color: 'text-emerald-500', icon: '●' },
  railway: { name: 'Railway', color: 'text-purple-500', icon: '🚂' },
  flyio: { name: 'Fly.io', color: 'text-violet-500', icon: '✈️' },
  heroku: { name: 'Heroku', color: 'text-purple-600', icon: '⬡' },
  azure: { name: 'Azure', color: 'text-blue-500', icon: '☁️' },
  cloudflare: { name: 'Cloudflare', color: 'text-orange-500', icon: '🔶' },
  firebase: { name: 'Firebase', color: 'text-amber-500', icon: '🔥' },
  other: { name: 'Other', color: 'text-muted-foreground', icon: '🌐' },
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

interface ProjectSettingsProps {
  project: Project;
}

export function ProjectSettings({ project }: ProjectSettingsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [targetUrl, setTargetUrl] = useState(project.targetUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<'script' | 'pixel' | null>(null);
  
  const platform = PLATFORM_CONFIG[detectPlatform(targetUrl)];
  
  // Tracking code snippets for CNAME/direct plan
  const trackingScript = `<script src="https://sharelive.site/t/${project.id}/script.js" async></script>`;
  const trackingPixel = `<img src="https://sharelive.site/t/${project.id}/pixel.gif" style="display:none" alt="" />`;

  const copyCode = async (code: string, type: 'script' | 'pixel') => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(type);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
        if (data.details && Array.isArray(data.details)) {
          const messages = data.details.map((detail: { message: string }) => detail.message).join('. ');
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

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Settings</h3>
            <p className="text-sm text-muted-foreground">Manage your subdomain configuration</p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="divide-y divide-border">
        {/* Target URL */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <label className="text-sm font-medium text-foreground">Target URL</label>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-muted ${platform.color}`}>
                  {platform.icon} {platform.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                The destination URL where traffic will be proxied
              </p>
              
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://your-app.vercel.app"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setTargetUrl(project.targetUrl);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-4 py-2.5 rounded-lg bg-muted text-sm text-foreground font-mono truncate">
                    {project.targetUrl}
                  </code>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors shrink-0"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subdomain Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground">Subdomain</label>
              <p className="text-xs text-muted-foreground mb-3">
                Your unique ShareLive subdomain (cannot be changed)
              </p>
              <code className="inline-flex items-center px-4 py-2.5 rounded-lg bg-muted text-sm text-foreground font-mono">
                <span className="text-primary font-semibold">{project.subdomain}</span>
                <span className="text-muted-foreground">.sharelive.site</span>
              </code>
            </div>
          </div>
        </div>

        {/* Plan Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Current Plan</label>
              <p className="text-xs text-muted-foreground mb-3">
                Your subscription tier and features
              </p>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
                  project.plan === 'paid_direct'
                    ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-muted text-foreground'
                }`}>
                  {project.plan === 'paid_direct' ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Premium (Direct DNS)
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Free (Proxy Routing)
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Tracking Code - Show for paid_direct plan */}
        {project.plan === 'paid_direct' && (
          <div className="p-6 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-lg bg-amber-500/10 p-2 shrink-0">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Analytics Tracking</label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add this code to your site to track visitors with your CNAME setup
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* JavaScript Tracking (Recommended) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    JavaScript (Recommended)
                  </span>
                  <span className="text-xs text-muted-foreground">Tracks page views & SPA navigation</span>
                </div>
                <div className="relative group">
                  <code className="block w-full px-4 py-3 rounded-lg bg-background border border-border text-xs font-mono text-foreground overflow-x-auto">
                    {trackingScript}
                  </code>
                  <button
                    onClick={() => copyCode(trackingScript, 'script')}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                    title="Copy to clipboard"
                  >
                    {copiedCode === 'script' ? (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Pixel Tracking (Alternative) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Tracking Pixel (Alternative)
                  </span>
                  <span className="text-xs text-muted-foreground">Simple, no JavaScript required</span>
                </div>
                <div className="relative group">
                  <code className="block w-full px-4 py-3 rounded-lg bg-background border border-border text-xs font-mono text-foreground overflow-x-auto">
                    {trackingPixel}
                  </code>
                  <button
                    onClick={() => copyCode(trackingPixel, 'pixel')}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                    title="Copy to clipboard"
                  >
                    {copiedCode === 'pixel' ? (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3 flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Add either snippet to your site&apos;s <code className="px-1 py-0.5 bg-muted rounded text-foreground">&lt;head&gt;</code> or before <code className="px-1 py-0.5 bg-muted rounded text-foreground">&lt;/body&gt;</code>. 
                  Analytics will appear in your dashboard within minutes.
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
