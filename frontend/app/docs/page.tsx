import Link from 'next/link';
import { CodeTabs } from '@/components/marketing/code-tabs';
import {
  FiActivity,
  FiArrowRight,
  FiCommand,
  FiCompass,
  FiGlobe,
  FiGrid,
  FiLink,
  FiLock,
  FiRadio,
  FiSidebar,
  FiTerminal,
  FiZap,
} from 'react-icons/fi';

const sidebarGroups = [
  {
    title: 'Getting started',
    items: [
      { href: '#overview', label: 'Overview', icon: FiCompass },
      { href: '#installation', label: 'Installation', icon: FiTerminal },
      { href: '#authenticate', label: 'Authentication', icon: FiLock },
      { href: '#tunnel', label: 'Tunnel localhost', icon: FiRadio },
    ],
  },
  {
    title: 'CLI',
    items: [
      { href: '#named-url', label: 'Named URLs', icon: FiLink },
      { href: '#debugging', label: 'Debugging', icon: FiActivity },
      { href: '#command-reference', label: 'Command reference', icon: FiCommand },
    ],
  },
  {
    title: 'Routing',
    items: [
      { href: '#subdomains', label: 'Subdomains', icon: FiGlobe },
      { href: '#dashboard-routing', label: 'Dashboard routing', icon: FiGrid },
    ],
  },
];

const contents = [
  { href: '#installation', label: 'Installation' },
  { href: '#authenticate', label: 'Authentication' },
  { href: '#tunnel', label: 'Tunnel localhost' },
  { href: '#named-url', label: 'Named URLs' },
  { href: '#debugging', label: 'Debugging' },
  { href: '#subdomains', label: 'Subdomains' },
  { href: '#dashboard-routing', label: 'Dashboard routing' },
];

export default function DocsPage() {
  return (
    <main className="bg-background px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[28px] border border-slate-800 bg-[#07111f] text-slate-100 shadow-2xl shadow-slate-950/20">
        <div className="border-b border-slate-800 bg-[#0b1526]/95 px-5 py-4 backdrop-blur sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-300">
                <FiSidebar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">ShareLive Docs</p>
                <p className="mt-1 text-sm text-slate-400">Tunnel first. Subdomains second.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)_240px]">
          <aside className="hidden border-r border-slate-800 bg-[#0b1526]/65 lg:block">
            <div className="sticky top-0 h-[calc(100vh-96px)] overflow-y-auto px-5 py-8">
              {sidebarGroups.map((group) => (
                <div key={group.title} className="mb-8">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{group.title}</p>
                  <nav className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;

                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-900/70 hover:text-white"
                        >
                          <Icon className="h-4 w-4 text-slate-500" />
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </aside>

          <article className="min-w-0 px-5 py-8 sm:px-8 lg:px-12">
            <section id="overview">
              <p className="text-sm font-medium text-cyan-300">Getting started</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Installation</h1>
              <p className="mt-4 max-w-3xl text-lg leading-9 text-slate-400">
                Install ShareLive, expose localhost to the internet, and keep the dashboard ready for branded subdomains when your app is deployed.
              </p>
            </section>

            <section id="installation" className="mt-14">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Default installation</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-400">
                Start with the CLI. The fastest path is <span className="font-mono text-slate-100">npx sharelive</span>, but you can also install the command globally if you use it every day.
              </p>

              <div className="mt-6">
                <CodeTabs
                  tabs={[
                    {
                      label: 'npx',
                      code: 'npx sharelive --port 3000',
                      helper: 'Best for one-off sessions and quick sharing from a fresh machine.',
                    },
                    {
                      label: 'npm',
                      code: 'npm install -g sharelive\nsharelive --port 3000',
                      helper: 'Great when you want the sharelive command available globally.',
                    },
                  ]}
                />
              </div>
            </section>

            <section id="authenticate" className="mt-16">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Authentication</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-400">
                Login once to associate tunnels with your account and unlock stable named URLs for recurring demos, QA, and webhook testing.
              </p>

              <div className="mt-6">
                <CodeTabs
                  tabs={[
                    {
                      label: 'login',
                      code: 'npx sharelive login',
                      helper: 'Your token is stored locally so future sessions can request account-linked tunnels.',
                    },
                  ]}
                />
              </div>
            </section>

            <section id="tunnel" className="mt-16">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Tunnel localhost</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-400">
                Use ShareLive when the app is still on your machine but the URL needs to be public. This is the main ShareLive workflow now.
              </p>

              <div className="mt-8 grid gap-5 xl:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                  <FiTerminal className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-4 text-lg font-semibold text-white">Local previews</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Share work-in-progress apps before they are deployed anywhere.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                  <FiZap className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-4 text-lg font-semibold text-white">Webhook testing</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Point external services at a live endpoint while you keep the server local.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                  <FiArrowRight className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-4 text-lg font-semibold text-white">Faster reviews</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Give teammates and clients a real URL instead of waiting for another deploy cycle.</p>
                </div>
              </div>
            </section>

            <section id="named-url" className="mt-16">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Named URLs</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-400">
                Stable names make the tunnel easier to remember and better suited for recurring usage like stakeholder demos or callback endpoints.
              </p>

              <div className="mt-6">
                <CodeTabs
                  tabs={[
                    {
                      label: 'named tunnel',
                      code: 'npx sharelive --port 3000 --name sprint-demo',
                      helper: 'ShareLive will try to reserve the requested public URL for your session.',
                    },
                  ]}
                />
              </div>
            </section>

            <section id="debugging" className="mt-16">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Debugging</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-400">
                Turn on verbose logging when you want to watch requests flow through the tunnel while debugging integrations or local APIs.
              </p>

              <div className="mt-6">
                <CodeTabs
                  tabs={[
                    {
                      label: 'verbose',
                      code: 'npx sharelive --port 3000 --verbose',
                      helper: 'Useful when tracing incoming webhook requests or checking that the right path reaches your local service.',
                    },
                  ]}
                />
              </div>
            </section>

            <section id="subdomains" className="mt-16">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Subdomains</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-400">
                Subdomains are the second ShareLive workflow. Use them when your app is already deployed and you want a clean branded URL managed from the dashboard.
              </p>

              <div className="mt-8 grid gap-5 xl:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                  <FiLink className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-4 text-lg font-semibold text-white">Free proxy mode</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Connect the target URL quickly and start routing traffic without DNS friction.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                  <FiGlobe className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-4 text-lg font-semibold text-white">Direct DNS later</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Upgrade when you want a more direct browser-to-host path and platform-level domain ownership.</p>
                </div>
              </div>
            </section>

            <section id="dashboard-routing" className="mt-16">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Dashboard routing</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-400">
                The dashboard remains the home for project routing, analytics, upgrade paths, and managed subdomain setup once the app is deployed.
              </p>

              <div className="mt-6 rounded-[28px] border border-cyan-500/20 bg-cyan-500/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-300">
                    <FiGrid className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Recommended split</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Start with tunnels when the app is local. Move to subdomains when the app is deployed. ShareLive supports both, but the homepage and docs now lead with the tunnel workflow first.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="command-reference" className="mt-16 pb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Command reference</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-400">
                These are the commands most developers use every day with ShareLive.
              </p>

              <div className="mt-6">
                <CodeTabs
                  tabs={[
                    {
                      label: 'Start',
                      code: 'npx sharelive --port 3000',
                    },
                    {
                      label: 'Login',
                      code: 'npx sharelive login',
                    },
                    {
                      label: 'Named',
                      code: 'npx sharelive --port 3000 --name sprint-demo',
                    },
                    {
                      label: 'Verbose',
                      code: 'npx sharelive --port 3000 --verbose',
                    },
                  ]}
                />
              </div>
            </section>
          </article>

          <aside className="hidden border-l border-slate-800 bg-[#0b1526]/35 xl:block">
            <div className="sticky top-0 h-[calc(100vh-96px)] overflow-y-auto px-6 py-8">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Contents</p>
              <nav className="space-y-2">
                {contents.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-900/70 hover:text-slate-100"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
