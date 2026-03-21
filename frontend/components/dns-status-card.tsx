'use client';

import type { Project, HostingPlatform } from '@/lib/sharelive-types';

const PLATFORM_INFO: Record<HostingPlatform, { name: string; cnameExample: string }> = {
  vercel: { name: 'Vercel', cnameExample: 'cname.vercel-dns.com' },
  netlify: { name: 'Netlify', cnameExample: 'your-site.netlify.app' },
  render: { name: 'Render', cnameExample: 'your-app.onrender.com' },
  railway: { name: 'Railway', cnameExample: 'your-app.railway.app' },
  flyio: { name: 'Fly.io', cnameExample: 'your-app.fly.dev' },
  heroku: { name: 'Heroku', cnameExample: 'your-app.herokuapp.com' },
  azure: { name: 'Azure Static Web Apps', cnameExample: 'your-app.azurestaticapps.net' },
  cloudflare: { name: 'Cloudflare Pages', cnameExample: 'your-app.pages.dev' },
  firebase: { name: 'Firebase Hosting', cnameExample: 'your-app.web.app' },
  other: { name: 'Other Platform', cnameExample: 'your-app.example.com' },
};

export const DNSStatusCard = ({ project }: { project: Project }) => {
  const platformInfo = project.hostingPlatform 
    ? PLATFORM_INFO[project.hostingPlatform] 
    : PLATFORM_INFO.other;

  return (
    <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-green-500/10 p-3">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">DNS Status: Active</h3>
          <p className="text-sm text-green-600/80 dark:text-green-200/80 mt-1">
            Direct routing via Cloudflare CNAME
          </p>
        </div>
      </div>

      {/* DNS Details */}
      <div className="space-y-3">
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 space-y-3">
          {/* Record Type */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700/80 dark:text-green-300/80">Record Type</span>
            <span className="font-mono text-green-700 dark:text-green-300 bg-green-500/10 px-2 py-0.5 rounded">CNAME</span>
          </div>

          {/* Subdomain */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700/80 dark:text-green-300/80">Subdomain</span>
            <span className="font-mono text-green-700 dark:text-green-300">{project.subdomain}.sharelive.site</span>
          </div>

          {/* Target */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-1">
            <span className="text-green-700/80 dark:text-green-300/80">Points To</span>
            <span className="font-mono text-green-700 dark:text-green-300 text-xs sm:text-sm break-all">
              {project.targetUrl?.replace(/^https?:\/\//, '').split('/')[0] || platformInfo.cnameExample}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700/80 dark:text-green-300/80">Proxy Status</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">Proxied (Cloudflare)</span>
            </span>
          </div>
        </div>

        {/* Platform Badge */}
        {project.hostingPlatform && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-600/80 dark:text-green-300/80">Hosting Platform:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              {platformInfo.name}
            </span>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3">
        <div className="flex gap-2">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-green-600/80 dark:text-green-300/80">
            Your subdomain is using direct DNS routing. Traffic goes directly to your hosting provider with Cloudflare's protection and CDN benefits.
          </p>
        </div>
      </div>
    </div>
  );
};
