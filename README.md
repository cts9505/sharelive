# ShareLive

ShareLive is a tunnel-first platform for exposing localhost to the internet, then routing deployed apps through branded subdomains from the dashboard.

## Project Layout

```text
backend/   Fastify API, WebSocket tunnel server, public proxy, Prisma schema
frontend/  Next.js marketing site and dashboard
sdk/       npm CLI package published as `sharelive`
docs/      architecture, security, deployment, and migration docs
```

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
npm ci
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

### SDK

```bash
cd sdk
npm ci
npm run build
```

## Root Scripts

From the repository root:

```bash
npm run build
npm run build:backend
npm run build:frontend
npm run build:sdk
```

## Deployment Targets

- `frontend/` -> Vercel
- `backend/` -> EC2 + PM2 + Nginx
- `sdk/` -> npm

Use [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the full production setup.

## Environment Overview

### Backend

Important production variables:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=8080
BASE_DOMAIN=sharelive.site
FRONTEND_URL=https://sharelive.site
CORS_ORIGIN=https://sharelive.site,https://www.sharelive.site
DATABASE_URL=postgresql://user:password@host:5432/sharelive
JWT_SECRET=<minimum-32-character-secret>
REQUIRE_AUTH=true
```

### Frontend

```env
NEXT_PUBLIC_API_BASE_URL=https://api.sharelive.site
NEXTAUTH_URL=https://sharelive.site
AUTH_SECRET=<openssl-rand-base64-32>
NEXTAUTH_SECRET=<same-value-or-omit>
```

### SDK

Optional override:

```env
SHARELIVE_URL=https://api.sharelive.site
```

## Built-In CI/CD

- `.github/workflows/ci.yml` validates `backend`, `frontend`, and `sdk`
- `.github/workflows/deploy-backend.yml` deploys the backend to EC2 on `main`

## Key Docs

- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/API.md](./docs/API.md)
- [docs/SECURITY.md](./docs/SECURITY.md)
- [docs/SDK_INTERACTIVE_CLI.md](./docs/SDK_INTERACTIVE_CLI.md)
