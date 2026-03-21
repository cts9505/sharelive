'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'primary' | 'success' | 'warning' | 'purple';
}

const colorClasses = {
  default: {
    bg: 'bg-muted/50',
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
  },
  primary: {
    bg: 'bg-primary/5',
    icon: 'bg-primary/10 text-primary',
    value: 'text-primary',
  },
  success: {
    bg: 'bg-emerald-500/5',
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    bg: 'bg-amber-500/5',
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
  },
  purple: {
    bg: 'bg-purple-500/5',
    icon: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    value: 'text-purple-600 dark:text-purple-400',
  },
};

export function StatCard({ title, value, subtitle, icon, trend, color = 'default' }: StatCardProps) {
  const colors = colorClasses[color];
  
  return (
    <div className={`rounded-xl border border-border ${colors.bg} p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-lg ${colors.icon} p-2.5`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <svg 
              className={`w-3 h-3 ${!trend.isPositive && 'rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold ${colors.value} mt-1`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
