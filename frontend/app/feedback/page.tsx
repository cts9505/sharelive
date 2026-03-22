'use client';

import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function FeedbackPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          message,
          sourcePage: '/feedback',
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Could not submit feedback');
      }

      toast.success('Thank you for your feedback!');
      setEmail('');
      setMessage('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-6 py-12 md:px-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-semibold">Feedback</h1>
        <p className="mb-8 text-muted-foreground">
          Tell us what would make ShareLive better for you.
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
            <label className="block text-sm font-medium text-card-foreground mb-2">Your Feedback</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder="Share your thoughts, ideas, or suggestions..."
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-ring"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </div>
    </main>
  );
}

