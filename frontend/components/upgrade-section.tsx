'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Project } from '@/lib/sharelive-types';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export const UpgradeSection = ({ project }: { project: Project }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!session?.accessToken) {
      toast.error('Not authenticated');
      return;
    }

    // For demo/testing: Using a stub payment intent ID
    // In production, you would:
    // 1. Create a Razorpay order
    // 2. Show Razorpay checkout modal
    // 3. Wait for payment success
    // 4. Use the payment intent ID from Razorpay
    const paymentIntentId = `demo_payment_${Date.now()}`;

    setIsUpgrading(true);

    try {
      const response = await fetch(`${API_BASE}/api/projects/${project.id}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error ?? 'Failed to upgrade project');
        setIsUpgrading(false);
        return;
      }

      toast.success('Project upgraded successfully! 🎉');
      
      // Refresh the page to show updated project status
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while upgrading project');
      setIsUpgrading(false);
    }
  };

  if (project.plan === 'paid_direct') {
    return (
      <section className="flex-1 space-y-4">
        <div className="rounded-2xl border border-green-500/50 bg-green-500/10 p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-300 font-medium">
              This project already uses direct DNS. Make sure your hosting provider has a CNAME
              from <span className="font-mono">{project.subdomain}.sharelive.site</span> pointing
              at <span className="font-mono">{new URL(project.targetUrl).host}</span>.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 space-y-4">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Upgrade to direct DNS</h2>
          </div>
        </div>
        
        <p className="text-sm text-card-foreground">
          Upgrading creates a dedicated Cloudflare CNAME for{' '}
          <span className="font-mono">{project.subdomain}.sharelive.site</span> pointing
          directly at your hosting provider.
        </p>
        
        <div className="rounded-lg border border-border bg-accent p-4">
          <p className="text-xs text-muted-foreground mb-2">
            <span className="font-semibold text-card-foreground">Important:</span> After upgrade, add{' '}
            <span className="font-mono text-primary">{project.subdomain}.sharelive.site</span> as a custom domain in your hosting platform:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• Vercel: Project Settings → Domains</li>
            <li>• Netlify: Site Settings → Domain Management</li>
            <li>• Render: Settings → Custom Domains</li>
            <li>• Railway: Settings → Domains</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            This ensures your hosting provider accepts traffic for this subdomain and provides SSL.
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={isUpgrading}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpgrading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Upgrading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade Now (Demo)
            </>
          )}
        </button>
        <p className="text-xs text-muted-foreground">
          💡 Demo mode: Payment integration to be added
        </p>
      </div>
    </section>
  );
};
