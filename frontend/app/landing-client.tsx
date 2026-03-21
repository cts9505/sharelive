import { ScrollGlobe } from '@/components/ui/scroll-globe';
import { CodeTabs } from '@/components/marketing/code-tabs';
import {
  FiActivity,
  FiArrowRight,
  FiCommand,
  FiGlobe,
  FiLayers,
  FiLink,
  FiLock,
  FiSend,
  FiShare2,
  FiTerminal,
  FiZap,
} from 'react-icons/fi';

const shareLiveSections = [
  {
    id: 'hero',
    badge: 'ShareLive',
    title: 'Tunnel localhost',
    subtitle: 'to the internet',
    description: (
      <>
        Start with the CLI. Get a public HTTPS URL for your local app, webhook handler, or preview build in seconds.
        ShareLive still supports branded subdomains, but tunneling is the core workflow now.
      </>
    ),
    highlights: ['npx sharelive', 'HTTPS URLs', 'Custom names after login'],
    extraContent: (
      <CodeTabs
        badge="Quick Start"
        title="Run ShareLive your way"
        description="Use the zero-setup command first, then switch to named tunnels when you want stable URLs."
        tabs={[
          {
            label: 'npx',
            code: 'npx sharelive --port 3000',
            helper: 'Fastest way to expose localhost:3000 without installing the CLI globally.',
          },
          {
            label: 'npm',
            code: 'npm install -g sharelive\nsharelive --port 3000',
            helper: 'Good if you want the sharelive command available everywhere on your machine.',
          },
          {
            label: 'pnpm',
            code: 'pnpm dlx sharelive --port 3000',
            helper: 'Great if your workflow already revolves around pnpm.',
          },
        ]}
        className="max-w-3xl"
      />
    ),
    align: 'left' as const,
    actions: [
      {
        label: 'Read docs',
        variant: 'primary' as const,
        href: '/docs',
        icon: <FiArrowRight className="h-4 w-4" />,
      },
      {
        label: 'Open dashboard',
        variant: 'secondary' as const,
        href: '/dashboard',
        icon: <FiGlobe className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'tunnel-workflow',
    badge: 'Tunnel Workflow',
    title: 'Share work before',
    subtitle: 'you deploy it',
    description: (
      <>
        Use ShareLive when the app is still local but the link must be public. It is ideal for demos, QA, webhook callbacks,
        stakeholder reviews, and debugging flows that need a live endpoint.
      </>
    ),
    align: 'left' as const,
    features: [
      {
        title: 'Login and keep named URLs',
        description: 'Authenticate once and reuse a memorable tunnel name when your workflow needs a stable link.',
        icon: <FiLock className="h-4 w-4 sm:h-5 sm:w-5" />,
      },
      {
        title: 'Forward any local port',
        description: 'Point ShareLive at the port you already use for React, Next.js, APIs, docs previews, or local webhooks.',
        icon: <FiTerminal className="h-4 w-4 sm:h-5 sm:w-5" />,
      },
      {
        title: 'Keep traffic visible',
        description: 'Use verbose mode when you want to watch requests hit your machine while you test integrations.',
        icon: <FiActivity className="h-4 w-4 sm:h-5 sm:w-5" />,
      },
    ],
    extraContent: (
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm">
          <FiSend className="h-5 w-5 text-primary" />
          <h3 className="mt-4 text-base font-semibold text-card-foreground">Webhooks</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">Point Stripe, GitHub, Clerk, or custom integrations at a local endpoint.</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm">
          <FiShare2 className="h-5 w-5 text-primary" />
          <h3 className="mt-4 text-base font-semibold text-card-foreground">Client previews</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">Send a real URL instead of a screen recording when feedback needs to happen quickly.</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm">
          <FiZap className="h-5 w-5 text-primary" />
          <h3 className="mt-4 text-base font-semibold text-card-foreground">Fast iteration</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">Stay local while testing real network traffic instead of waiting on redeploys.</p>
        </div>
      </div>
    ),
    actions: [
      {
        label: 'CLI reference',
        variant: 'primary' as const,
        href: '/docs#command-reference',
        icon: <FiCommand className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'subdomains',
    badge: 'Subdomains',
    title: 'Route deployed apps',
    subtitle: 'with clean URLs',
    description: (
      <>
        Subdomains are still part of ShareLive. When your app is already deployed, connect it to a branded
        <span className="mx-1 font-mono text-foreground">sharelive.site</span>
        URL from the dashboard.
      </>
    ),
    align: 'center' as const,
    features: [
      {
        title: 'Free proxy mode',
        description: 'Create a subdomain and launch quickly without waiting on DNS changes.',
        icon: <FiLink className="h-4 w-4 sm:h-5 sm:w-5" />,
      },
      {
        title: 'Direct DNS later',
        description: 'Upgrade when you want the most direct route from the browser to your hosting platform.',
        icon: <FiGlobe className="h-4 w-4 sm:h-5 sm:w-5" />,
      },
    ],
    extraContent: (
      <div className="mx-auto max-w-3xl rounded-[28px] border border-border/70 bg-card/60 p-6 text-left backdrop-blur-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Deploy</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Host your app on Vercel, Netlify, Render, Railway, Fly.io, or another supported platform.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Connect</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Paste the target URL in the dashboard and claim a ShareLive subdomain for it.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Launch</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Start on proxy routing now and move to direct DNS when the project is ready.</p>
          </div>
        </div>
      </div>
    ),
    actions: [
      {
        label: 'Create subdomain',
        variant: 'primary' as const,
        href: '/projects/new',
        icon: <FiGlobe className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'cta',
    badge: 'Get Started',
    title: 'Start with tunnels',
    subtitle: 'keep subdomains later',
    description: (
      <>
        Begin with the local workflow most teams need every day. When the app is deployed, keep using ShareLive for branded routing from the dashboard.
      </>
    ),
    highlights: ['Tunnel first', 'Subdomains second', 'One product'],
    extraContent: (
      <CodeTabs
        badge="Next Commands"
        title="Common ShareLive commands"
        description="Use these once you want account-linked tunnels or more control over the public URL."
        tabs={[
          {
            label: 'Login',
            code: 'npx sharelive login',
            helper: 'Stores your auth locally so you can request named tunnels.',
          },
          {
            label: 'Named tunnel',
            code: 'npx sharelive --port 3000 --name sprint-demo',
            helper: 'Great for demos, QA links, and webhook endpoints you want to keep reusing.',
          },
          {
            label: 'Verbose',
            code: 'npx sharelive --port 3000 --verbose',
            helper: 'See incoming traffic while you debug local requests.',
          },
        ]}
        className="mx-auto max-w-3xl"
      />
    ),
    align: 'center' as const,
    actions: [
      {
        label: 'Read official docs',
        variant: 'primary' as const,
        href: '/docs',
        icon: <FiLayers className="h-4 w-4" />,
      },
      {
        label: 'Launch dashboard',
        variant: 'secondary' as const,
        href: '/dashboard',
        icon: <FiGlobe className="h-4 w-4" />,
      },
    ],
  },
];

const globeConfig = {
  positions: [
    { top: '42%', left: '79%', scale: 1.15 },
    { top: '20%', left: '50%', scale: 0.9 },
    { top: '14%', left: '86%', scale: 1.6 },
    { top: '46%', left: '50%', scale: 1.48 },
  ],
};

export default function LandingClient() {
  return (
    <ScrollGlobe
      sections={shareLiveSections}
      globeConfig={globeConfig}
      className="bg-gradient-to-br from-background via-muted/10 to-background"
    />
  );
}
