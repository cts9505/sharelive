'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import type { AnalyticsSummary } from '@/lib/sharelive-types';
import { StatCard } from './stat-card';
import { AnalyticsChart } from './analytics-chart';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

interface AnalyticsSectionProps {
  projectId: string;
  subdomain: string;
}

export function AnalyticsSection({ projectId, subdomain }: AnalyticsSectionProps) {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d');

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

  const filteredStats = useMemo(() => {
    if (!analytics?.dailyStats) return [];
    
    if (timeRange === '7d') {
      return analytics.dailyStats.slice(-7);
    }
    return analytics.dailyStats;
  }, [analytics?.dailyStats, timeRange]);

  const averageDaily = useMemo(() => {
    if (!filteredStats.length) return 0;
    const total = filteredStats.reduce((sum, s) => sum + s.visits, 0);
    return Math.round(total / filteredStats.length);
  }, [filteredStats]);

  const peakDay = useMemo(() => {
    if (!filteredStats.length) return null;
    return filteredStats.reduce((max, s) => s.visits > max.visits ? s : max, filteredStats[0]);
  }, [filteredStats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="h-10 w-10 bg-muted rounded-lg mb-4" />
                <div className="h-3 w-16 bg-muted rounded mb-2" />
                <div className="h-6 w-20 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="animate-pulse rounded-xl border border-border bg-card p-6">
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Traffic for <span className="font-medium text-foreground">{subdomain}.sharelive.site</span>
            </p>
          </div>
        </div>
        
        {/* Time Range Toggle */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              timeRange === '7d' 
                ? 'bg-background shadow text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              timeRange === '30d' 
                ? 'bg-background shadow text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Visits"
          value={analytics?.totalVisits ?? 0}
          subtitle="All time"
          color="primary"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        
        <StatCard
          title={timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          value={timeRange === '7d' ? (analytics?.last7Days ?? 0) : (analytics?.last30Days ?? 0)}
          subtitle="Period total"
          color="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        
        <StatCard
          title="Daily Average"
          value={averageDaily}
          subtitle={`Per day (${timeRange})`}
          color="success"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        
        <StatCard
          title="Peak Day"
          value={peakDay?.visits ?? 0}
          subtitle={peakDay ? new Date(peakDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
          color="warning"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Chart Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-foreground">Visitor Trends</h3>
            <p className="text-sm text-muted-foreground">Daily visits over time</p>
          </div>
          {analytics?.lastVisitedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Last visit: {new Date(analytics.lastVisitedAt).toLocaleString()}
            </div>
          )}
        </div>
        
        <AnalyticsChart dailyStats={filteredStats} height={220} />
      </div>
    </div>
  );
}
