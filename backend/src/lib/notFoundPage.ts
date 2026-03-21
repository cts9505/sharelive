import { config } from "../config";

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/i;

export function sanitizeSubdomain(subdomain: string | null): string | null {
  if (!subdomain) {
    return null;
  }

  const cleaned = subdomain.trim().toLowerCase();
  if (!SUBDOMAIN_REGEX.test(cleaned) || cleaned.length > 63) {
    return null;
  }

  const reserved = new Set(["www", "api", "admin", "mail", "ftp", "localhost", "test"]);
  return reserved.has(cleaned) ? null : cleaned;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (character) => map[character]);
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function generateNotFoundPage(subdomain: string | null): string {
  const safeSubdomain = sanitizeSubdomain(subdomain);
  const displaySubdomain = safeSubdomain ? escapeHtml(safeSubdomain) : "your next project";
  const frontendUrl = stripTrailingSlash(config.FRONTEND_URL || `https://${config.BASE_DOMAIN}`);
  const mainSiteUrl = frontendUrl;
  const createProjectUrl = safeSubdomain
    ? `${mainSiteUrl}/projects/new?subdomain=${encodeURIComponent(safeSubdomain)}`
    : `${mainSiteUrl}/projects/new`;
  const docsUrl = `${mainSiteUrl}/docs`;
  const headline = safeSubdomain
    ? `${displaySubdomain}.${escapeHtml(config.BASE_DOMAIN)} is still available`
    : `This ShareLive domain is ready to be claimed`;
  const description = safeSubdomain
    ? `No project is connected to this subdomain yet. Claim it now and point it to your deployment in a couple of minutes.`
    : `Spin up a ShareLive subdomain, connect it to your deployment, and publish a polished URL without DNS headaches.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex,nofollow" />
  <meta name="description" content="Claim this ShareLive subdomain and connect it to your deployment." />
  <title>Claim This Domain | ShareLive</title>
  <style>
    :root {
      color-scheme: dark;
      --background: #020817;
      --surface: rgba(15, 23, 42, 0.76);
      --surface-strong: rgba(15, 23, 42, 0.92);
      --border: rgba(148, 163, 184, 0.18);
      --foreground: #e2e8f0;
      --muted: #94a3b8;
      --primary: #22d3ee;
      --primary-strong: #06b6d4;
      --accent: #38bdf8;
      --glow: rgba(34, 211, 238, 0.24);
      --shadow: 0 32px 120px rgba(2, 8, 23, 0.58);
    }

    @media (prefers-color-scheme: light) {
      :root {
        color-scheme: light;
        --background: #f8fbfd;
        --surface: rgba(255, 255, 255, 0.82);
        --surface-strong: rgba(255, 255, 255, 0.96);
        --border: rgba(15, 23, 42, 0.08);
        --foreground: #0f172a;
        --muted: #475569;
        --primary: #0891b2;
        --primary-strong: #0e7490;
        --accent: #0284c7;
        --glow: rgba(14, 116, 144, 0.12);
        --shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
      }
    }

    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(34, 211, 238, 0.14), transparent 28rem),
        radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.16), transparent 30rem),
        linear-gradient(180deg, rgba(15, 23, 42, 0.12), transparent 30%),
        var(--background);
      color: var(--foreground);
      padding: 24px;
    }

    .shell {
      min-height: calc(100vh - 48px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card {
      position: relative;
      overflow: hidden;
      width: min(1040px, 100%);
      border-radius: 32px;
      border: 1px solid var(--border);
      background:
        linear-gradient(145deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
        var(--surface);
      box-shadow: var(--shadow);
      backdrop-filter: blur(22px);
    }

    .card::before {
      content: "";
      position: absolute;
      inset: -30% auto auto -10%;
      width: 18rem;
      height: 18rem;
      background: radial-gradient(circle, var(--glow), transparent 68%);
      pointer-events: none;
    }

    .card::after {
      content: "";
      position: absolute;
      inset: auto -6rem -8rem auto;
      width: 20rem;
      height: 20rem;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.14), transparent 65%);
      pointer-events: none;
    }

    .grid {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.9fr);
      gap: 28px;
      padding: 36px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border-radius: 999px;
      border: 1px solid rgba(34, 211, 238, 0.2);
      background: rgba(34, 211, 238, 0.1);
      color: var(--primary);
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: currentColor;
      box-shadow: 0 0 18px currentColor;
    }

    h1 {
      margin: 20px 0 14px;
      font-size: clamp(2.3rem, 5vw, 4.4rem);
      line-height: 0.96;
      letter-spacing: -0.05em;
      max-width: 11ch;
    }

    .description {
      margin: 0;
      max-width: 38rem;
      color: var(--muted);
      font-size: 1.04rem;
      line-height: 1.75;
    }

    .domain-chip {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin: 26px 0 0;
      padding: 14px 18px;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: var(--surface-strong);
      font-family: "SFMono-Regular", SFMono-Regular, ui-monospace, Menlo, Consolas, monospace;
      font-size: 0.98rem;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .domain-label {
      color: var(--muted);
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 28px;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 52px;
      padding: 0 22px;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 700;
      transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
    }

    .button:hover {
      transform: translateY(-1px);
    }

    .button-primary {
      color: #042f2e;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      box-shadow: 0 20px 40px rgba(34, 211, 238, 0.22);
    }

    .button-secondary {
      color: var(--foreground);
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
    }

    .side-panel {
      border-radius: 24px;
      border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent), var(--surface-strong);
      padding: 24px;
      align-self: stretch;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 22px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .brand-mark {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: #042f2e;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      box-shadow: 0 16px 36px rgba(34, 211, 238, 0.22);
    }

    .eyebrow {
      margin: 0 0 10px;
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .steps {
      display: grid;
      gap: 14px;
      margin-top: 18px;
    }

    .step {
      display: grid;
      grid-template-columns: 34px 1fr;
      gap: 14px;
      align-items: start;
      padding: 14px;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.025);
    }

    .step-index {
      width: 34px;
      height: 34px;
      border-radius: 12px;
      background: rgba(34, 211, 238, 0.12);
      color: var(--primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.95rem;
    }

    .step strong {
      display: block;
      margin-bottom: 5px;
      font-size: 0.98rem;
    }

    .step span {
      color: var(--muted);
      line-height: 1.6;
      font-size: 0.94rem;
    }

    .footer-note {
      margin-top: 18px;
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.7;
    }

    @media (max-width: 860px) {
      body { padding: 16px; }
      .shell { min-height: calc(100vh - 32px); }
      .grid {
        grid-template-columns: 1fr;
        padding: 24px;
        gap: 20px;
      }
      .card { border-radius: 26px; }
      h1 { max-width: none; }
      .actions { flex-direction: column; }
      .button { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="card">
      <div class="grid">
        <div>
          <div class="badge">
            <span class="badge-dot"></span>
            Available on ShareLive
          </div>

          <h1>${headline}</h1>
          <p class="description">${description}</p>

          <div class="domain-chip">
            <span class="domain-label">Domain</span>
            <span>${safeSubdomain ? `${displaySubdomain}.${escapeHtml(config.BASE_DOMAIN)}` : escapeHtml(config.BASE_DOMAIN)}</span>
          </div>

          <div class="actions">
            <a class="button button-primary" href="${escapeHtml(createProjectUrl)}">Register this domain</a>
            <a class="button button-secondary" href="${escapeHtml(docsUrl)}">See how ShareLive works</a>
          </div>
        </div>

        <aside class="side-panel">
          <div class="brand">
            <span class="brand-mark">S</span>
            <span>ShareLive</span>
          </div>

          <p class="eyebrow">Go live in minutes</p>

          <div class="steps">
            <div class="step">
              <span class="step-index">1</span>
              <div>
                <strong>Claim the subdomain</strong>
                <span>Reserve this ShareLive address and attach it to your account.</span>
              </div>
            </div>
            <div class="step">
              <span class="step-index">2</span>
              <div>
                <strong>Point it to your deployment</strong>
                <span>Connect Vercel, Netlify, Render, or any supported target URL without manual DNS stress.</span>
              </div>
            </div>
            <div class="step">
              <span class="step-index">3</span>
              <div>
                <strong>Launch with the same theme</strong>
                <span>Keep your hosting, get a polished ShareLive URL, and upgrade to direct DNS whenever you need it.</span>
              </div>
            </div>
          </div>

          <p class="footer-note">
            Fast setup, branded subdomains, and proxy-first routing for shipping ideas without slowing down.
          </p>
        </aside>
      </div>
    </section>
  </div>
</body>
</html>`;
}
