'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Project, HostingPlatform } from '@/lib/sharelive-types';
import toast from 'react-hot-toast';
import { PaymentModal } from './payment-modal';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

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

const PLATFORM_INSTRUCTIONS: Record<HostingPlatform, { name: string; steps: string[]; cnameExample: string }> = {
  vercel: {
    name: 'Vercel',
    steps: [
      'Go to your Vercel project dashboard',
      'Navigate to Settings → Domains',
      'Click "Add Domain"',
      'Enter: {subdomain}.sharelive.site',
      'Vercel will show a verification TXT record',
      'We\'ll add the CNAME automatically after payment',
    ],
    cnameExample: 'cname.vercel-dns.com',
  },
  netlify: {
    name: 'Netlify',
    steps: [
      'Open your Netlify site dashboard',
      'Go to Site Settings → Domain Management',
      'Click "Add custom domain"',
      'Enter: {subdomain}.sharelive.site',
      'Skip DNS verification (we handle it)',
      'We\'ll create the CNAME after payment',
    ],
    cnameExample: 'your-site.netlify.app',
  },
  render: {
    name: 'Render',
    steps: [
      'Go to your Render service dashboard',
      'Navigate to Settings → Custom Domains',
      'Click "Add Custom Domain"',
      'Enter: {subdomain}.sharelive.site',
      'We\'ll create the CNAME automatically',
    ],
    cnameExample: 'your-app.onrender.com',
  },
  railway: {
    name: 'Railway',
    steps: [
      'Open your Railway project',
      'Go to Settings → Domains',
      'Click "Custom Domain"',
      'Enter: {subdomain}.sharelive.site',
      'We\'ll handle the DNS configuration',
    ],
    cnameExample: 'your-app.railway.app',
  },
  flyio: {
    name: 'Fly.io',
    steps: [
      'Run: flyctl certs add {subdomain}.sharelive.site',
      'Or add via Fly.io dashboard → Certificates',
      'We\'ll create the CNAME automatically',
    ],
    cnameExample: 'your-app.fly.dev',
  },
  heroku: {
    name: 'Heroku',
    steps: [
      'Go to your app dashboard',
      'Navigate to Settings → Domains',
      'Click "Add domain"',
      'Enter: {subdomain}.sharelive.site',
      'We\'ll configure DNS after payment',
    ],
    cnameExample: 'your-app.herokuapp.com',
  },
  azure: {
    name: 'Azure Static Web Apps',
    steps: [
      'Open Azure portal',
      'Go to your Static Web App',
      'Navigate to Custom domains',
      'Click "Add" and enter: {subdomain}.sharelive.site',
      'We\'ll handle CNAME creation',
    ],
    cnameExample: 'your-app.azurestaticapps.net',
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
    cnameExample: 'your-app.pages.dev',
  },
  firebase: {
    name: 'Firebase Hosting',
    steps: [
      'Go to Firebase Console',
      'Select Hosting',
      'Click "Add custom domain"',
      'Enter: {subdomain}.sharelive.site',
      'Follow Firebase verification steps',
    ],
    cnameExample: 'your-app.web.app',
  },
  other: {
    name: 'Other Platform',
    steps: [
      'Contact your hosting provider',
      'Request to add custom domain: {subdomain}.sharelive.site',
      'Point CNAME to your app\'s URL',
    ],
    cnameExample: 'your-app.example.com',
  },
};

export const UpgradeSectionNew = ({ project }: { project: Project }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<HostingPlatform>('vercel');

  // Check if project's target URL is from a supported platform
  const isSupportedPlatform = useMemo(() => {
    return isSupportedPlatformUrl(project.targetUrl);
  }, [project.targetUrl]);

  const handleUpgrade = async () => {
    if (!session?.accessToken) {
      toast.error('Not authenticated');
      return;
    }

    setIsUpgrading(true);

    try {
      const response = await fetch(`${API_BASE}/api/projects/${project.id}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ 
          paymentIntentId: `demo_payment_${Date.now()}`,
          hostingPlatform: selectedPlatform,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error ?? 'Failed to upgrade project');
        setIsUpgrading(false);
        return;
      }

      toast.success('Project upgraded successfully! 🎉');
      
      setTimeout(() => {
        router.refresh();
        setShowUpgradeForm(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while upgrading project');
      setIsUpgrading(false);
    }
  };

  if (project.plan === 'paid_direct') {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">Direct DNS Active</h3>
            <p className="text-sm text-green-600/80 dark:text-green-200/80">
              Your subdomain is using direct DNS routing via Cloudflare CNAME. Maximum performance with no proxy hop.
            </p>
            {project.hostingPlatform && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1.5">
                <span className="text-xs text-green-700 dark:text-green-300">Platform: {PLATFORM_INSTRUCTIONS[project.hostingPlatform].name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show view-only notice for non-supported platforms
  if (!isSupportedPlatform) {
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-300 mb-2">View-Only Mode</h3>
            <p className="text-sm text-yellow-600/80 dark:text-yellow-200/80 mb-3">
              Your target URL (<span className="font-mono text-xs">{project.targetUrl}</span>) is not from a supported hosting platform. 
              The subdomain works through our reverse proxy in <strong>view-only mode</strong>.
            </p>
            <div className="rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
              <p className="font-medium">Limitations:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-yellow-600/80 dark:text-yellow-200/80">
                <li>Forms and interactive elements may not work</li>
                <li>Search functionality is disabled</li>
                <li>POST requests are blocked</li>
                <li>Upgrade to Direct DNS is not available</li>
              </ul>
            </div>
            <div className="mt-4 rounded-lg border border-yellow-500/20 bg-card p-3">
              <p className="text-xs text-muted-foreground mb-2">
                <strong>To enable full functionality and upgrade:</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Deploy your site to a supported platform (Vercel, Netlify, Render, Railway, Fly.io, Heroku, Azure, Cloudflare Pages, or Firebase) 
                and update your target URL in settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showUpgradeForm) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Upgrade to Direct DNS</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get faster performance with a dedicated Cloudflare CNAME pointing directly to your hosting provider.
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>No proxy hop - direct connection to your host</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Automatic CNAME creation in Cloudflare</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Platform-specific setup instructions</span>
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Upgrade Process
            </button>
          </div>
        </div>
      </div>
    );
  }

  const platformInfo = PLATFORM_INSTRUCTIONS[selectedPlatform];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Upgrade Configuration</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select your hosting platform and follow the setup steps
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowUpgradeForm(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Platform Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Hosting Platform
        </label>
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value as HostingPlatform)}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {Object.entries(PLATFORM_INSTRUCTIONS).map(([key, { name }]) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </select>
      </div>

      {/* Platform-Specific Instructions */}
      <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h4 className="font-medium text-foreground">Setup Instructions for {platformInfo.name}</h4>
        </div>
        
        <ol className="space-y-2 text-sm text-muted-foreground">
          {platformInfo.steps.map((step, index) => (
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

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Your subdomain to add:</p>
          <div className="flex items-center gap-2 rounded bg-background px-3 py-2 font-mono text-sm text-primary">
            <span>{project.subdomain}.sharelive.site</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${project.subdomain}.sharelive.site`);
                toast.success('Copied!');
              }}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-orange-700 dark:text-orange-200/90">
            <p className="font-medium mb-1">Important: Complete setup in your hosting platform FIRST</p>
            <p>After payment, we'll create the CNAME automatically. Make sure you've added the custom domain in your {platformInfo.name} project before clicking upgrade.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setShowPaymentModal(true)}
          disabled={isUpgrading}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Proceed to Payment
        </button>
        <button
          onClick={() => setShowUpgradeForm(false)}
          disabled={isUpgrading}
          className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        🔒 Secure payment with Razorpay • One-time payment of ₹99
      </p>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          projectId={project.id}
          projectName={`${project.subdomain}.sharelive.site`}
          hostingPlatform={selectedPlatform}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowUpgradeForm(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
};
