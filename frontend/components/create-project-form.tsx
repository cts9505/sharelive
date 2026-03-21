'use client';

import { FormEvent, useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

const SUPPORTED_PLATFORMS = [
  { name: 'Vercel', suffix: '.vercel.app' },
  { name: 'Netlify', suffix: '.netlify.app' },
  { name: 'Render', suffix: '.onrender.com' },
  { name: 'Railway', suffix: '.railway.app' },
  { name: 'Fly.io', suffix: '.fly.dev' },
  { name: 'Heroku', suffix: '.herokuapp.com' },
  { name: 'Azure Static Apps', suffix: '.azurestaticapps.net' },
  { name: 'Cloudflare Pages', suffix: '.pages.dev' },
  { name: 'Firebase', suffix: '.web.app' },
];

// Check if URL is from a supported platform
function isSupportedUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return SUPPORTED_PLATFORMS.some(p => 
      hostname.endsWith(p.suffix) || hostname === p.suffix.slice(1)
    );
  } catch {
    return false;
  }
}

// Normalize URL - auto-add https:// if missing
function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  
  // Already has a protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Check if it looks like a domain (contains a dot and no spaces)
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

interface CreateProjectFormProps {
  initialSubdomain?: string;
}

type SubdomainStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export const CreateProjectForm = ({ initialSubdomain }: CreateProjectFormProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState(initialSubdomain ?? '');
  const [targetUrl, setTargetUrl] = useState('');
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>('idle');

  // Check if entered URL is from a supported platform
  const isSupported = useMemo(() => {
    if (!targetUrl) return null;
    try {
      new URL(targetUrl);
      return isSupportedUrl(targetUrl);
    } catch {
      return null;
    }
  }, [targetUrl]);

  // Handle target URL change with auto-https
  const handleTargetUrlChange = useCallback((value: string) => {
    setTargetUrl(value);
  }, []);

  // Normalize URL on blur (when user leaves the field)
  const handleTargetUrlBlur = useCallback(() => {
    const normalized = normalizeUrl(targetUrl);
    if (normalized !== targetUrl) {
      setTargetUrl(normalized);
    }
  }, [targetUrl]);

  // Debounced subdomain availability check
  useEffect(() => {
    // Reset if empty or too short
    if (!subdomain || subdomain.length < 2) {
      setSubdomainStatus('idle');
      return;
    }

    // Validate subdomain format (alphanumeric and hyphens only, no starting/ending with hyphen)
    const isValidFormat = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i.test(subdomain);
    if (!isValidFormat) {
      setSubdomainStatus('invalid');
      return;
    }

    setSubdomainStatus('checking');

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/projects/check/${encodeURIComponent(subdomain.toLowerCase())}`,
          { signal: controller.signal }
        );
        
        if (response.ok) {
          const data = await response.json();
          setSubdomainStatus(data.available ? 'available' : 'taken');
        } else {
          setSubdomainStatus('idle');
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSubdomainStatus('idle');
        }
      }
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [subdomain]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      router.push('/login');
      return;
    }

    setStatus('Creating subdomain…');

    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ subdomain, targetUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle validation errors from Zod
        if (error.details && Array.isArray(error.details)) {
          const messages = error.details.map((detail: any) => detail.message).join('. ');
          toast.error(messages);
        } else {
          toast.error(error.error ?? 'Failed to create project');
        }
        
        setStatus(null);
        return;
      }

      toast.success('Subdomain created successfully!');
      setStatus(null);
      setSubdomain('');
      setTargetUrl('');
      
      // Refresh to show new subdomain immediately
      router.refresh();
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error. Please try again.');
      setStatus(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          Subdomain
        </label>
        <div className={`mt-2 flex items-center rounded-xl border bg-background px-4 transition-colors ${
          subdomainStatus === 'available' 
            ? 'border-green-500' 
            : subdomainStatus === 'taken' 
            ? 'border-red-500' 
            : subdomainStatus === 'invalid'
            ? 'border-yellow-500'
            : 'border-input'
        }`}>
          <input
            required
            value={subdomain}
            onChange={(event) => setSubdomain(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="project1"
            className="flex-1 bg-transparent py-3 text-foreground outline-none"
          />
          <span className="text-muted-foreground text-sm">.sharelive.site</span>
          {/* Status indicator */}
          <div className="ml-2 flex items-center">
            {subdomainStatus === 'checking' && (
              <svg className="animate-spin h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {subdomainStatus === 'available' && (
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {subdomainStatus === 'taken' && (
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {subdomainStatus === 'invalid' && (
              <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
        </div>
        {/* Status message */}
        {subdomainStatus === 'available' && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            ✓ {subdomain}.sharelive.site is available!
          </p>
        )}
        {subdomainStatus === 'taken' && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            ✗ {subdomain}.sharelive.site is already taken
          </p>
        )}
        {subdomainStatus === 'invalid' && (
          <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
            Use only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.
          </p>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Target URL
        </label>
        <input
          required
          type="url"
          value={targetUrl}
          onChange={(event) => handleTargetUrlChange(event.target.value)}
          onBlur={handleTargetUrlBlur}
          placeholder="myapp.vercel.app or example.com"
          className={`w-full rounded-xl border bg-background px-4 py-3 text-foreground outline-none focus:border-ring ${
            isSupported === true 
              ? 'border-green-500'  
              : isSupported === false 
              ? 'border-yellow-500' 
              : 'border-input'
          }`}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          💡 Just enter a domain — we'll add https:// automatically
        </p>
        
        {/* Dynamic status based on URL */}
        {isSupported === true && (
          <div className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Supported Platform Detected!</p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                  Full functionality available. You can upgrade later to remove our proxy and use direct CNAME routing.
                </p>
              </div>
            </div>
          </div>
        )}

        {isSupported === false && (
          <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">View-Only Mode</p>
                <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                  This domain works through our reverse proxy in <strong>view-only mode</strong>. 
                  Visitors can browse the site but forms, search, and interactive features won't work. 
                  Upgrade is not available for non-supported platforms.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 space-y-2">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-medium text-card-foreground mb-2">✅ Supported Platforms (Full Features + Upgradable):</p>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_PLATFORMS.map((platform) => (
                <span key={platform.name} className="text-xs px-2 py-1 rounded bg-accent text-card-foreground">
                  {platform.name}
                </span>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">📺 Any Other Domain (View-Only):</p>
              <p className="text-xs text-muted-foreground">
                Any website can be proxied for static viewing - including google.com, github.com, etc. 
                Great for showcasing or embedding content. Interactive features won't work in view-only mode.
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={subdomainStatus === 'taken' || subdomainStatus === 'invalid' || subdomainStatus === 'checking'}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create subdomain
      </button>

      {status && <p className="text-sm text-card-foreground">{status}</p>}
    </form>
  );
};
