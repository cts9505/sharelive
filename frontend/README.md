# ShareLive Frontend

Next.js web application for tunnel management and user dashboard.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your settings

# Run development server
npm run dev
```

Visit http://localhost:3000

## 📦 Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## 🌐 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Then deploy again
vercel --prod
```

## 📝 Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_TUNNEL_URL=ws://localhost:8080/tunnel
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-nextauth-secret
NEXTAUTH_SECRET=your-nextauth-secret
DATABASE_URL=postgresql://user:pass@localhost:5432/sharelive
```

## 🎨 Features

- ✅ User authentication (Next Auth)
- ✅ Dashboard UI
- ✅ Project management
- ✅ Tunnel monitoring
- ✅ Analytics
- ✅ Settings & profile
- ✅ Responsive design

## 📖 Pages

- `/` - Landing page
- `/dashboard` - User dashboard
- `/projects` - Project list
- `/projects/new` - Create project
- `/projects/[id]` - Project details
- `/settings` - User settings
- `/profile` - User profile

## 🛠️ Tech Stack

- Next.js 13+ (App Router)
- TailwindCSS
- TypeScript
- NextAuth.js
- React components

## 📚 Documentation

- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [Complete Implementation](../docs/COMPLETE_IMPLEMENTATION.md)
