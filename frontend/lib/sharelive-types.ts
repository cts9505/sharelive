export type Plan = 'free_proxy' | 'paid_direct';

export type HostingPlatform =
  | 'vercel'
  | 'netlify'
  | 'render'
  | 'railway'
  | 'flyio'
  | 'heroku'
  | 'azure'
  | 'cloudflare'
  | 'firebase'
  | 'other';

export interface Project {
  id: string;
  subdomain: string;
  targetUrl: string;
  plan: Plan;
  hostingPlatform: HostingPlatform | null;
  totalVisits: number;
  lastVisitedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  platformInstructions?: string | null;
}

export interface DailyStat {
  date: string;
  visits: number;
  uniqueVisits?: number;
}

export interface AnalyticsSummary {
  totalVisits: number;
  last7Days: number;
  last30Days: number;
  lastVisitedAt: string | null;
  dailyStats: DailyStat[];
}
