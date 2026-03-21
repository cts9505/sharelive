'use client';

import { useState, useMemo } from 'react';
import type { Project } from '@/lib/sharelive-types';
import toast from 'react-hot-toast';
import { QRCodeModal } from './qr-code';

interface ProjectHeaderProps {
  project: Project;
}

// Supported platform suffixes
const SUPPORTED_SUFFIXES = [
  '.vercel.app',
  '.netlify.app',
  '.netlify.com',
  '.onrender.com',
  '.render.com',
  '.railway.app',
  '.fly.dev',
  '.herokuapp.com',
  '.azurestaticapps.net',
  '.cloudflare.net',
  '.pages.dev',
  '.web.app',
  '.firebaseapp.com',
];

function isSupportedPlatformUrl(targetUrl: string): boolean {
  try {
    const hostname = new URL(targetUrl).hostname.toLowerCase();
    return SUPPORTED_SUFFIXES.some(suffix => 
      hostname === suffix.slice(1) || hostname.endsWith(suffix)
    );
  } catch {
    return false;
  }
}

// Derive status from project data - if it has a target URL, it's live
function getProjectStatus(project: Project): 'active' | 'pending' | 'suspended' {
  // A project is considered active if it has both subdomain and targetUrl
  if (project.subdomain && project.targetUrl) {
    return 'active';
  }
  return 'pending';
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  const liveUrl = `https://${project.subdomain}.sharelive.site`;
  const projectStatus = getProjectStatus(project);
  
  // Check if project is using a supported platform
  const isSupportedPlatform = useMemo(() => {
    return isSupportedPlatformUrl(project.targetUrl);
  }, [project.targetUrl]);
  
  const copyUrl = async () => {
    await navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    toast.success('URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    active: {
      label: 'Live',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    pending: {
      label: 'Pending',
      color: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    suspended: {
      label: 'Suspended',
      color: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
    },
  };

  const status = statusConfig[projectStatus];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Left side - Project info */}
          <div className="space-y-4">
            {/* Status badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${status.bgColor}`}>
                <span className={`w-2 h-2 rounded-full ${status.color} ${projectStatus === 'active' ? 'animate-pulse' : ''}`} />
                <span className={`text-xs font-medium ${status.textColor}`}>{status.label}</span>
              </div>
              
              {/* View-only badge for non-supported platforms */}
              {project.plan === 'free_proxy' && !isSupportedPlatform && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-xs font-medium">View-Only</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground">
                {project.plan === 'paid_direct' ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Premium
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Free Proxy
                  </>
                )}
              </div>
            </div>

            {/* Subdomain title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {project.subdomain}
                <span className="text-muted-foreground font-normal">.sharelive.site</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Proxying to: <span className="text-foreground font-medium truncate max-w-[300px]">{project.targetUrl}</span>
              </p>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit Site
              </a>
              
              <button
                onClick={copyUrl}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy URL
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowQR(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="md:hidden">QR Code</span>
              </button>
            </div>
          </div>

          {/* Right side - QR Code */}
          <button
            onClick={() => setShowQR(true)}
            className="hidden md:flex flex-col items-center justify-center w-32 h-32 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 hover:from-primary/15 hover:to-primary/10 transition-all cursor-pointer group"
          >
            <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
              <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground mt-2 group-hover:text-foreground transition-colors">View QR Code</span>
          </button>
        </div>

        {/* Created date */}
        <div className="mt-6 pt-6 border-t border-border flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Created {new Date(project.createdAt).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
          {(project.totalVisits ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {(project.totalVisits ?? 0).toLocaleString()} total visits
            </div>
          )}
        </div>
      </div>
      
      {/* QR Code Modal */}
      <QRCodeModal
        url={liveUrl}
        subdomain={project.subdomain}
        isOpen={showQR}
        onClose={() => setShowQR(false)}
      />
    </div>
  );
}
