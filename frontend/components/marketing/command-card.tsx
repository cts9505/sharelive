'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Copy, TerminalSquare } from 'lucide-react';

interface CommandCardProps {
  title: string;
  command: string;
  description?: string;
  badge?: string;
  prompt?: string;
}

export function CommandCard({
  title,
  command,
  description,
  badge,
  prompt = '$',
}: CommandCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success('Command copied');
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy command');
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          {badge && (
            <span className="mb-2 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {badge}
            </span>
          )}
          <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          aria-label={`Copy command for ${title}`}
          title="Copy command"
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <TerminalSquare className="h-3.5 w-3.5 text-cyan-400" />
            <span>Terminal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
        </div>

        <div className="overflow-x-auto px-4 py-4 font-mono text-sm">
          <code className="block whitespace-pre text-slate-100">
            <span className="mr-2 text-cyan-400">{prompt}</span>
            {command}
          </code>
        </div>
      </div>
    </div>
  );
}
