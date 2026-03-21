# ShareLive Project Migration Plan

## 🎯 Objective

Restructure the ShareLive project from two separate folders into a clean 3-folder architecture:

1. **frontend/** - Next.js web app (deployable to Vercel)
2. **backend/** - Tunnel server (deployable to EC2)
3. **sdk/** - CLI tool (publishable to npm)

---

## 📊 Current State Analysis

### Current Structure

```
Sharelive-Backend/
├── packages/                    # WebSocket tunnel implementation
│   ├── sdk/                    # ✅ CLI tool with commander
│   └── tunnel-server/          # ✅ Fastify WebSocket server
│
└── Share-Live-main/            # Full SaaS platform monorepo
    ├── apps/
    │   ├── web/               # ✅ Next.js frontend (dashboard, auth)
    │   └── router/            # Express backend (metadata APIs)
    └── packages/
        ├── core/              # Shared types & schemas
        └── config/            # Environment config
```

### What Each Component Does

**packages/sdk/**
- CLI tool using Commander.js
- WebSocket client connecting to tunnel server
- Forwards localhost traffic through tunnel
- Features: custom subdomains, request logging, --help, --port, etc.

**packages/tunnel-server/**
- Fastify + WebSocket server
- Creates public URLs for local development
- Handles tunnel registration and HTTP proxying
- Similar to ngrok/localtunnel

**Share-Live-main/apps/web/**
- Next.js frontend with TailwindCSS
- User authentication and dashboard
- Project management UI
- Landing pages, settings, etc.

**Share-Live-main/apps/router/**
- Express backend with Prisma
- PostgreSQL database
- Metadata APIs
- Free-tier reverse proxy

---

## 🚀 Target Structure

```
sharelive/
├── frontend/                    # Next.js web app
│   ├── app/                    # Next.js 13+ app directory
│   ├── components/             # React components
│   ├── lib/                    # Utilities
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── .env.example
│   └── README.md              # Frontend deployment docs
│
├── backend/                    # Combined backend server
│   ├── src/
│   │   ├── tunnel/            # WebSocket tunnel logic
│   │   │   ├── tunnelManager.ts
│   │   │   ├── tunnelSocket.ts
│   │   │   └── types.ts
│   │   ├── routes/            # HTTP routes
│   │   │   └── publicProxy.ts
│   │   ├── api/               # REST APIs (from router)
│   │   │   ├── projects.ts
│   │   │   ├── auth.ts
│   │   │   └── metadata.ts
│   │   ├── prisma/            # Database schema
│   │   │   └── schema.prisma
│   │   ├── config.ts
│   │   └── server.ts          # Main entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md              # Backend deployment docs
│
├── sdk/                        # CLI tool
│   ├── src/
│   │   ├── cli.ts             # Commander CLI
│   │   ├── client.ts          # WebSocket client
│   │   └── index.ts           # Public API
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md              # SDK usage docs
│
├── docs/                       # Comprehensive documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── DEPLOYMENT.md          # Deployment guides
│   ├── API.md                 # API documentation
│   └── CONTRIBUTING.md        # Contribution guide
│
├── README.md                   # Main project README
├── package.json               # Root package (optional)
└── .gitignore
```

---

## 📝 Migration Steps

### Step 1: Create New Folder Structure

```bash
# Create main directories
mkdir -p frontend backend sdk docs

# Frontend - Copy from Share-Live-main/apps/web
cp -r Share-Live-main/apps/web/* frontend/

# Backend - Start with tunnel-server
cp -r packages/tunnel-server/* backend/

# SDK - Copy from packages/sdk
cp -r packages/sdk/* sdk/
```

### Step 2: Backend Integration

Merge the Express router (Share-Live-main/apps/router) into the Fastify backend:

**Option A: Keep Fastify + Add REST Routes**
- Add Prisma to backend/
- Create backend/src/api/ for REST endpoints
- Keep WebSocket tunnel logic separate

**Option B: Migrate to Express**
- Replace Fastify with Express
- Use `express-ws` for WebSocket support
- Integrate router code directly

**Recommendation: Option A (Fastify)**
- Fastify has excellent WebSocket support
- Better performance than Express
- Can easily add REST routes with Fastify plugins

### Step 3: Shared Code

**Option 1: Duplicate (Simple)**
- Copy shared types into each folder
- Good for independent deployment

**Option 2: Shared Package (Advanced)**
- Create `packages/shared/` for types
- Use npm workspaces
- Good for monorepo approach

**Recommendation: Option 1** for your use case (separate deployments)

### Step 4: Update Package Dependencies

**frontend/package.json:**
- Remove monorepo references
- Standalone Next.js app

**backend/package.json:**
- Merge dependencies from tunnel-server + router
- Add Prisma, database drivers

**sdk/package.json:**
- Clean, minimal dependencies
- Ready for npm publish

### Step 5: Update Environment Variables

Create `.env.example` files:

**frontend/.env.example:**
```env
NEXT_PUBLIC_API_URL=https://api.sharelive.site
NEXT_PUBLIC_TUNNEL_URL=https://tunnel.sharelive.site
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
DATABASE_URL=
```

**backend/.env.example:**
```env
PORT=8080
DATABASE_URL=postgresql://user:pass@host:5432/sharelive
JWT_SECRET=
CORS_ORIGIN=https://sharelive.site
```

**sdk/.env.example:**
```env
TUNNEL_URL=wss://tunnel.sharelive.site/tunnel
```

### Step 6: Update Import Paths

Frontend:
- No changes needed (stays self-contained)

Backend:
- Update relative imports
- Remove `@sharelive/*` workspace imports

SDK:
- Update TUNNEL_URL to production

---

## 🔧 Configuration Changes

### Frontend (Vercel Deployment)

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### Backend (EC2 Deployment)

**ecosystem.config.js** (for PM2):
```js
module.exports = {
  apps: [{
    name: 'sharelive-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
}
```

### SDK (npm Publishing)

**package.json additions:**
```json
{
  "name": "sharelive",
  "version": "1.0.0",
  "bin": {
    "sharelive": "./dist/cli.js"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

---

## ✅ Testing Checklist

- [ ] Frontend builds successfully (`npm run build`)
- [ ] Frontend deploys to Vercel
- [ ] Backend starts without errors
- [ ] Backend WebSocket tunnel works
- [ ] Backend REST APIs respond
- [ ] Database migrations run
- [ ] SDK installs globally (`npm link`)
- [ ] SDK connects to backend
- [ ] SDK creates tunnels
- [ ] End-to-end: SDK → Backend → Frontend

---

## 🚨 Potential Issues & Solutions

### Issue 1: Port Conflicts
- **Problem:** Frontend (3000), Backend (8080) might conflict locally
- **Solution:** Use different ports, document in README

### Issue 2: Database Migrations
- **Problem:** Prisma schema from router app
- **Solution:** Copy prisma/ folder, run migrations fresh

### Issue 3: Shared Types
- **Problem:** Frontend and Backend need same TypeScript types
- **Solution:** Duplicate types or use git submodules

### Issue 4: CORS Issues
- **Problem:** Frontend on Vercel, Backend on EC2
- **Solution:** Already fixed! CORS enabled in server.ts

### Issue 5: Environment Variables
- **Problem:** Different envs for dev/staging/prod
- **Solution:** Use `.env.local`, `.env.production`, etc.

---

## 📦 Deployment Strategy

### Frontend → Vercel
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy automatically on push

### Backend → EC2
1. SSH into EC2 instance
2. Install Node.js, PM2
3. Clone repo, `cd backend`
4. `npm install && npm run build`
5. `pm2 start ecosystem.config.js`
6. Setup nginx reverse proxy

### SDK → npm
1. Update version in package.json
2. `npm run build`
3. `npm publish`
4. Users install via `npm install -g sharelive`

---

## 🎉 Success Criteria

✅ **Frontend:**
- Deployed to Vercel
- Accessible via `https://sharelive.site`
- Dashboard, auth working

✅ **Backend:**
- Running on EC2
- WebSocket tunnels working
- REST APIs responding
- Database connected

✅ **SDK:**
- Published on npm
- `npm install -g sharelive` works
- `sharelive --help` shows options
- Creates working tunnels

---

## 📅 Timeline Estimate

- **Step 1-2:** Folder restructure (1-2 hours)
- **Step 3:** Backend integration (2-3 hours)
- **Step 4-5:** Dependencies & env (1 hour)
- **Step 6:** Import paths (1 hour)
- **Testing:** (2-3 hours)
- **Deployment:** (2-4 hours)

**Total:** 1-2 days

---

## Next Steps

1. ✅ Read this migration plan
2. ⬜ Review target structure
3. ⬜ Backup current code
4. ⬜ Execute migration (I can help!)
5. ⬜ Test locally
6. ⬜ Deploy to production

Ready to start? Let me know and I'll help you execute the migration step by step!
