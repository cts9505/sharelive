'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, Rocket, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

const primaryLinks = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Create Subdomain', href: '/projects/new' },
  { label: 'Docs', href: '/docs' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Cancellations & Refunds', href: '/refund-policy' },
];

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/users/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsAccount) {
          toast.error(data.message, { duration: 5000 });
        } else {
          toast.error(data.error || 'Failed to subscribe');
        }
        return;
      }

      if (data.alreadySubscribed) {
        toast.success(data.message);
      } else {
        toast.success(data.message, { duration: 4000 });
      }
      
      setEmail('');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="border-t border-border bg-background/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 md:px-10 lg:px-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Rocket className="h-4 w-4" /> ShareLive
            </span>
            <p className="text-sm text-muted-foreground">
              Connect deployed apps to branded subdomains or expose localhost to the internet in seconds. Your hosting stays yours and your demos move faster.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span> Pradhikaran, Pune 411044, Maharashtra</span>
              </div>
              <Link href="tel:9373954169" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-primary" /> 93739 54169
              </Link>
              <Link href="mailto:9chaitanyashinde@gmail.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4 text-primary" /> 9chaitanyashinde@gmail.com
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Explore</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Stay in the loop</p>
            <p className="text-sm text-muted-foreground">
              Subscribe to occasional updates about new ShareLive features, tips, and launch announcements.
            </p>
            <form className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Notify me
              </button>
            </form>
            <p className="text-xs text-muted-foreground/80">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Chaitanya Tukaram Shinde. All rights reserved.</p>
          <p>Built in Pune, India • Powered by ShareLive</p>
        </div>
      </div>
    </footer>
  );
};
