# ShareLive Deployment Guide

This repository deploys as three separate deliverables:

- `frontend/` -> Next.js app on Vercel
- `backend/` -> Fastify API + WebSocket tunnel server on EC2
- `sdk/` -> npm package published as `sharelive`

## Prerequisites

- Node.js 20.x for CI/CD and servers
- PostgreSQL database for the backend
- A domain for the marketing app and wildcard tunnel/subdomain traffic
- Vercel project connected to this repository
- EC2 instance with SSH access
- npm account for publishing the SDK

## Recommended Production Topology

- `sharelive.site` -> Vercel frontend
- `api.sharelive.site` or `tunnel.sharelive.site` -> EC2 backend
- `*.sharelive.site` -> same EC2 backend for public tunnel/subdomain proxy traffic

The frontend talks to the backend over HTTPS, and the SDK opens WebSocket tunnel connections to the backend domain.

## 1. Frontend Deployment

Deploy the `frontend/` folder as its own Vercel project.

### Vercel project settings

- Framework preset: `Next.js`
- Root directory: `frontend`
- Install command: `npm ci`
- Build command: `npm run build`
- Output setting: default Next.js output

### Required frontend environment variables

```env
NEXT_PUBLIC_API_BASE_URL=https://api.sharelive.site
NEXTAUTH_URL=https://sharelive.site
AUTH_SECRET=<openssl-rand-base64-32>
NEXTAUTH_SECRET=<same-value-or-omit>
```

Notes:

- `AUTH_SECRET` is the primary variable used by the current frontend auth config.
- `NEXTAUTH_SECRET` is also supported for compatibility.
- The frontend does not currently require its own `DATABASE_URL`.

### Vercel deployment flow

1. Import the GitHub repository into Vercel.
2. Set the root directory to `frontend`.
3. Add the production environment variables above.
4. Attach `sharelive.site` and `www.sharelive.site`.
5. Redeploy after setting env vars.

## 2. Backend Deployment

Deploy the `backend/` folder to an Ubuntu EC2 instance. The repository already includes a GitHub Actions workflow at `.github/workflows/deploy-backend.yml` that builds the backend and ships a tarball to EC2.

### Required EC2 bootstrap

Run this once on the server:

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2

mkdir -p /home/ubuntu/sharelive-backend
```

### Required backend environment variables

Create `/home/<user>/sharelive-backend/.env` on EC2:

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

Add SMTP, Razorpay, or Cloudflare values only if you use those features in production.

### GitHub Actions secrets for backend deploy

Add these repository secrets:

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `BACKEND_URL`

`BACKEND_URL` should be the externally reachable backend origin, for example:

```text
https://api.sharelive.site
```

### What the backend deploy workflow does

On every push to `main` affecting `backend/**`, it:

1. installs backend dependencies
2. builds `backend/dist`
3. uploads a deployment tarball to EC2
4. runs `npm ci`, `npx prisma generate`, and `npx prisma migrate deploy`
5. restarts `sharelive-backend` with PM2
6. verifies `GET /health`

### Nginx reverse proxy example

Use Nginx in front of the backend app:

```nginx
upstream sharelive_backend {
  server 127.0.0.1:8080;
}

server {
  listen 80;
  server_name api.sharelive.site *.sharelive.site;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.sharelive.site *.sharelive.site;

  ssl_certificate /etc/letsencrypt/live/sharelive.site/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sharelive.site/privkey.pem;

  location /tunnel {
    proxy_pass http://sharelive_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
  }

  location / {
    proxy_pass http://sharelive_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 3. SDK Publishing

Publish the `sdk/` folder to npm as the `sharelive` package.

### SDK package expectations

The SDK is now prepared to:

- build to `dist/`
- expose `dist/cli.js` as the `sharelive` binary
- publish only the package artifacts needed for npm consumers
- use `SHARELIVE_URL` or the saved config value instead of a hardcoded production URL

### Publish steps

```bash
cd sdk
npm ci
npm run build
npm publish
```

### Optional SDK runtime override

```bash
export SHARELIVE_URL=https://api.sharelive.site
```

The CLI will convert that base URL to the correct WebSocket tunnel endpoint automatically.

## 4. DNS Checklist

Create records similar to:

```text
A      @        76.76.21.21         # Vercel frontend
CNAME  www      cname.vercel-dns.com
A      api      <your-ec2-public-ip>
A      *        <your-ec2-public-ip>
```

If you place wildcard traffic behind Cloudflare, make sure WebSocket and proxy behavior are configured to match your backend setup.

## 5. Verification

Run these checks after deployment:

### Backend

```bash
curl https://api.sharelive.site/health
```

Expected response:

```json
{"status":"ok","timestamp":"..."}
```

### Frontend

- open `https://sharelive.site`
- confirm login page loads
- confirm `/api/auth/session` returns `200`

### SDK

```bash
npx sharelive --port 3000
```

Expected result:

- WebSocket connects successfully
- a public ShareLive URL is printed
- requests forward to localhost

## 6. CI/CD in This Repo

This repository now includes:

- `.github/workflows/ci.yml` -> builds `backend`, `frontend`, and `sdk`
- `.github/workflows/deploy-backend.yml` -> deploys the backend to EC2

Vercel remains the recommended deployment target for the frontend via Git integration.

## Final Pre-Launch Checklist

- [ ] `backend/.env` production values are present on EC2
- [ ] Vercel environment variables are set for the frontend
- [ ] DNS points frontend and backend domains to the correct targets
- [ ] Wildcard subdomain routing reaches the backend
- [ ] PostgreSQL database is reachable from EC2
- [ ] `npx prisma migrate deploy` succeeds in production
- [ ] `pm2 status` shows `sharelive-backend` online
- [ ] `curl <backend-url>/health` returns `200`
- [ ] `cd frontend && npm run build` passes
- [ ] `cd sdk && npm run build` passes
