'use client';

import { useState, useMemo } from 'react';
import type { Project } from '@/lib/sharelive-types';
import Link from 'next/link';

type SortOption = 'recent' | 'visits' | 'created' | 'name';
type FilterOption = 'all' | 'free' | 'premium';

interface ProjectsFilterProps {
  projects: Project[];
  showHeader?: boolean;
}

function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getPlatformIcon(platform: string | null | undefined): JSX.Element {
  const iconClass = "w-4 h-4";
  
  switch (platform?.toLowerCase()) {
    case 'vercel':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2z"/>
        </svg>
      );
    case 'netlify':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.934 8.519a1.044 1.044 0 0 1 .303.23l2.349-1.045-2.192-2.171-.491 2.954zM12.06 6.546a1.305 1.305 0 0 1 .209.574l3.497 1.482a1.044 1.044 0 0 1 .36-.22l.49-2.954-3.065-.936-1.491 2.054z"/>
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
  }
}

export function ProjectsFilter({ projects, showHeader = false }: ProjectsFilterProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sort, setSort] = useState<SortOption>('recent');

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.subdomain.toLowerCase().includes(searchLower) ||
        p.targetUrl.toLowerCase().includes(searchLower)
      );
    }

    // Apply plan filter
    if (filter === 'free') {
      result = result.filter(p => p.plan === 'free_proxy');
    } else if (filter === 'premium') {
      result = result.filter(p => p.plan === 'paid_direct');
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sort) {
        case 'recent':
          const dateA = new Date(a.lastVisitedAt || a.createdAt).getTime();
          const dateB = new Date(b.lastVisitedAt || b.createdAt).getTime();
          return dateB - dateA;
        case 'visits':
          return (b.totalVisits || 0) - (a.totalVisits || 0);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
          return a.subdomain.localeCompare(b.subdomain);
        default:
          return 0;
      }
    });

    return result;
  }, [projects, search, filter, sort]);

  const freeCount = projects.filter(p => p.plan === 'free_proxy').length;
  const premiumCount = projects.filter(p => p.plan === 'paid_direct').length;

  return (
    <div>
      {/* Header - only shown when showHeader is true */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Your Subdomains</h2>
          <Link
            href="/projects/new"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Subdomain
          </Link>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search subdomains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setFilter('free')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l border-border ${
                filter === 'free'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Free ({freeCount})
            </button>
            <button
              onClick={() => setFilter('premium')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l border-border ${
                filter === 'premium'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Premium ({premiumCount})
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="recent">Recent Activity</option>
            <option value="visits">Most Visits</option>
            <option value="created">Newest First</option>
            <option value="name">A-Z</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      {(search || filter !== 'all') && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredAndSortedProjects.length} of {projects.length} subdomains
          {search && <span> matching &quot;{search}&quot;</span>}
        </p>
      )}

      {/* Projects List */}
      {filteredAndSortedProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-muted-foreground mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-muted-foreground">No subdomains found matching your criteria</p>
          <button
            onClick={() => { setSearch(''); setFilter('all'); }}
            className="mt-3 text-sm text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedProjects.map((project) => (
            <article 
              key={project.id} 
              className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all duration-200"
            >
              <div className="p-4 md:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 rounded-lg p-2.5 ${
                        project.plan === 'paid_direct' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {getPlatformIcon(project.hostingPlatform)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {project.subdomain}.sharelive.site
                          </h3>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
                            project.plan === 'paid_direct'
                              ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            {project.plan === 'paid_direct' ? 'Premium' : 'Free'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono truncate mt-0.5">
                          → {project.targetUrl}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 lg:gap-6 pl-11 lg:pl-0">
                    <div className="text-center lg:text-right">
                      <p className="text-lg font-bold text-foreground">
                        {(project.totalVisits || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">visits</p>
                    </div>
                    <div className="text-center lg:text-right">
                      <p className="text-sm font-medium text-foreground">
                        {getRelativeTime(project.lastVisitedAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">last visit</p>
                    </div>
                    <div className="hidden sm:block text-center lg:text-right">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(project.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">created</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pl-11 lg:pl-0">
                    <a
                      href={`https://${project.subdomain}.sharelive.site`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Visit site"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="hidden sm:inline">Manage</span>
                    </Link>
                    {project.plan === 'free_proxy' && (
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="hidden sm:inline">Upgrade</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
