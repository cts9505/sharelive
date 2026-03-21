'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { AnalyticsSummary } from '@/lib/sharelive-types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export const AnalyticsCard = ({ projectId }: { projectId: string }) => {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session?.accessToken) return;

      try {
        const response = await fetch(`${API_BASE}/api/analytics/${projectId}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [projectId, session]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-purple-500/10 p-3">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track visitor traffic through your subdomain
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Visits */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Visits</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.totalVisits.toLocaleString()}</p>
        </div>

        {/* Last 7 Days */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last 7 Days</p>
          </div>
          <p className="text-2xl font-bold text-primary">{analytics.last7Days.toLocaleString()}</p>
        </div>

        {/* Last 30 Days */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last 30 Days</p>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.last30Days.toLocaleString()}</p>
        </div>
      </div>

      {/* Last Visit */}
      {analytics.lastVisitedAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Last visit: {new Date(analytics.lastVisitedAt).toLocaleString()}</span>
        </div>
      )}

      {/* Simple Chart */}
      {analytics.dailyStats.length > 0 && (
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-3">Daily Visits (Last 30 Days)</p>
          <div className="flex items-end gap-1 h-32">
            {analytics.dailyStats.map((stat, index) => {
              const maxVisits = Math.max(...analytics.dailyStats.map(s => s.visits), 1);
              const height = (stat.visits / maxVisits) * 100;
              
              return (
                <div
                  key={index}
                  className="flex-1 group relative"
                  title={`${stat.date}: ${stat.visits} visits`}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border border-border rounded px-2 py-1 text-xs text-popover-foreground whitespace-nowrap z-10 shadow-lg">
                    <div className="font-medium">{new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div className="text-primary">{stat.visits} visits</div>
                  </div>
                  <div 
                    className="w-full bg-primary/30 hover:bg-primary/50 rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg bg-muted border border-border p-3">
        <div className="flex gap-2">
          <svg className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-muted-foreground">
            Analytics track all visits through your subdomain. Paid plans get real-time updates and unique visitor tracking.
          </p>
        </div>
      </div>
    </div>
  );
};
