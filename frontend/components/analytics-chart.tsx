'use client';

import { useMemo } from 'react';
import type { DailyStat } from '@/lib/sharelive-types';

interface AnalyticsChartProps {
  dailyStats: DailyStat[];
  height?: number;
}

export function AnalyticsChart({ dailyStats, height = 200 }: AnalyticsChartProps) {
  const chartData = useMemo(() => {
    if (dailyStats.length === 0) return [];
    
    const maxVisits = Math.max(...dailyStats.map(s => s.visits), 1);
    
    return dailyStats.map((stat, index) => ({
      ...stat,
      heightPercent: (stat.visits / maxVisits) * 100,
      formattedDate: new Date(stat.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      dayOfWeek: new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' }),
    }));
  }, [dailyStats]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted/30 rounded-xl border border-dashed border-border">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm text-muted-foreground">No analytics data yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Data will appear after your first visitor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative" style={{ height }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-border/50" />
          ))}
        </div>
        
        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-[2px] pb-6">
          {chartData.map((stat, index) => (
            <div
              key={index}
              className="flex-1 group relative flex flex-col items-center"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
                <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl text-xs whitespace-nowrap">
                  <div className="font-semibold text-popover-foreground">{stat.formattedDate}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{stat.visits} visits</span>
                  </div>
                  {(stat.uniqueVisits ?? 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">{stat.uniqueVisits ?? 0} unique</span>
                    </div>
                  )}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
              </div>
              
              {/* Bar */}
              <div 
                className="w-full rounded-t-sm bg-gradient-to-t from-primary to-primary/70 group-hover:from-primary group-hover:to-primary/90 transition-all duration-200 min-h-[2px]"
                style={{ height: `${Math.max(stat.heightPercent, 2)}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-1">
        <span>{chartData[0]?.formattedDate}</span>
        <span>{chartData[Math.floor(chartData.length / 2)]?.formattedDate}</span>
        <span>{chartData[chartData.length - 1]?.formattedDate}</span>
      </div>
    </div>
  );
}
