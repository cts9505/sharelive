'use client';

import { FormEvent, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Project } from '@/lib/sharelive-types';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export const EditTargetForm = ({ project }: { project: Project }) => {
  const { data: session } = useSession();
  const [targetUrl, setTargetUrl] = useState(project.targetUrl);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      setStatus('Error: Not authenticated');
      return;
    }

    setStatus('Updating target URL…');

    try {
      const response = await fetch(`${API_BASE}/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ targetUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Handle validation errors from Zod
        if (data.details && Array.isArray(data.details)) {
          const messages = data.details.map((detail: any) => detail.message).join('. ');
          toast.error(messages);
        } else {
          toast.error(data.error ?? 'Failed to update target URL');
        }
        setStatus(null);
        return;
      }

      toast.success('Target URL updated successfully!');
      setStatus(null);
      setTargetUrl(data.targetUrl);
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while updating target URL.');
      setStatus(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border p-6">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Routing target</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Update where <span className="font-mono">{project.subdomain}.sharelive.site</span> should
            send traffic. Localhost URLs are not allowed.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-card-foreground">Target URL</label>
        <input
          required
          type="url"
          value={targetUrl}
          onChange={(event) => setTargetUrl(event.target.value)}
          placeholder="https://myapp.vercel.app"
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Must be from: Vercel, Netlify, Render, Railway, Fly.io, Heroku, Cloudflare Pages, or Firebase
        </p>
      </div>

      <button
        type="submit"
        disabled={status !== null}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Save changes
      </button>

      {status && <p className="text-xs text-card-foreground">{status}</p>}
    </form>
  );
};

