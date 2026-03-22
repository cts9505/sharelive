'use client';

import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function ReportBugPage() {
  const [email, setEmail] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/report-bug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          summary,
          details,
          sourcePage: '/report-bug',
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Could not submit bug report');
      }

      toast.success('Bug report submitted. Thank you!');
      setEmail('');
      setSummary('');
      setDetails('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit bug report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-6 py-12 md:px-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-semibold">Report a Bug</h1>
        <p className="mb-8 text-muted-foreground">
          Found something broken? Please include steps to reproduce the issue.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-8">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Summary</label>
            <input
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Short description of the bug"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Details</label>
            <textarea
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={8}
              placeholder="What did you expect to happen? What actually happened? Steps to reproduce..."
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-destructive px-6 py-3 text-destructive-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Bug Report'}
          </button>
        </form>
      </div>
    </main>
  );
}
