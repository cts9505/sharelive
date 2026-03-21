'use client';

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { FiCheck, FiCopy, FiTerminal } from 'react-icons/fi';

interface CodeTabItem {
  label: string;
  code: string;
  helper?: string;
}

interface CodeTabsProps {
  tabs: CodeTabItem[];
  title?: string;
  description?: string;
  badge?: string;
  className?: string;
}

export function CodeTabs({ tabs, title, description, badge, className }: CodeTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeTab = useMemo(() => tabs[activeIndex] ?? tabs[0], [activeIndex, tabs]);

  const handleCopy = async () => {
    if (!activeTab) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeTab.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  if (!activeTab) {
    return null;
  }

  return (
    <div className={clsx('rounded-[28px] border border-slate-800 bg-slate-950 text-slate-100 shadow-xl shadow-slate-950/20', className)}>
      {(badge || title || description) && (
        <div className="border-b border-slate-800 px-5 py-5">
          {badge && (
            <span className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
              {badge}
            </span>
          )}
          {title && <h3 className="mt-3 text-base font-semibold text-slate-50 sm:text-lg">{title}</h3>}
          {description && <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="mr-1 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
            <FiTerminal className="h-3.5 w-3.5" />
            <span>Terminal</span>
          </div>
          {tabs.map((tab, index) => (
            <button
              key={`${tab.label}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={clsx(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                index === activeIndex
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-100"
          aria-label={`Copy ${activeTab.label} command`}
          title="Copy code"
        >
          {copied ? <FiCheck className="h-4 w-4 text-cyan-300" /> : <FiCopy className="h-4 w-4" />}
        </button>
      </div>

      <div className="px-5 py-5">
        <pre className="overflow-x-auto font-mono text-sm leading-7 text-slate-100">
          <code>{activeTab.code}</code>
        </pre>
        {activeTab.helper && <p className="mt-4 text-sm leading-7 text-slate-400">{activeTab.helper}</p>}
      </div>
    </div>
  );
}
