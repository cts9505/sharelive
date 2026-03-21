# ShareLive Architecture Documentation

## 🏗️ System Overview

ShareLive is a **local development tunneling platform** that exposes localhost applications to the internet via secure public URLs. Think ngrok/localtunnel, but with a full-featured dashboard and project management.

---

## 📐 Architecture Components

### 1. **Frontend (Next.js on Vercel)**

**Purpose:** User-facing web application for account management and tunnel monitoring.

**Tech Stack:**
- Next.js 13+ (App Router)
- TailwindCSS
- TypeScript
- NextAuth.js (Authentication)
- React components

**Key Features:**
- User registration & authentication
- Dashboard showing active tunnels
- Project management
- Custom subdomain reservation
- Analytics & logs
- Billing & subscriptions

**Entry Point:** `app/page.tsx`

**Deployment:** Vercel (auto-deploy from Git)

---

### 2. **Backend (Fastify on EC2)**

**Purpose:** WebSocket tunnel server + REST API for metadata and user management.

**Tech Stack:**
- Fastify (HTTP + WebSocket server)
- Prisma ORM
- PostgreSQL (Neon or RDS)
- TypeScript
- ws (WebSocket library)

**Key Features:**

**A) Tunnel Server (WebSocket)**
- Accepts WebSocket connections from CLI clients
- Generates unique subdomains (auto or custom)
- Proxies public HTTP requests to local clients
- Handles request/response forwarding
- Real-time connection management

**B) REST API**
- User authentication (JWT)
- Project CRUD operations
- Tunnel metadata storage
- Analytics & logging
- Payment webhooks (Stripe)

**Entry Point:** `src/server.ts`

**Deployment:** EC2 instance with PM2

---

### 3. **SDK (CLI Tool on npm)**

**Purpose:** Command-line tool developers install to create tunnels.

**Tech Stack:**
- Node.js
- Commander.js (CLI framework)
- ws (WebSocket client)
- TypeScript

**Key Features:**
- Simple CLI: `sharelive --port 3000`
- Custom subdomains: `sharelive --name myapp`
- Request logging: `sharelive --verbose`
- WebSocket connection to backend
- Forwards localhost HTTP traffic

**Entry Point:** `src/cli.ts`

**Distribution:** npm package (`npm install -g sharelive`)

---

## 🔄 Data Flow

### Tunnel Creation Flow

```
┌─────────────────┐
│   Developer's   │
│  Local Machine  │
└────────┬────────┘
         │
         │ 1. sharelive --port 3000
         │
         ▼
┌─────────────────────────────────────────┐
│           SDK CLI Client                │
│  - Reads port from CLI args             │
│  - Connects to wss://tunnel.../tunnel   │
└────────┬────────────────────────────────┘
         │
         │ 2. WebSocket connection
         │
         ▼
┌─────────────────────────────────────────┐
│        Backend Tunnel Server            │
│  - Accepts WebSocket connection         │
│  - Generates subdomain (e.g., abc123)   │
│  - Stores in tunnelManager (Map)        │
│  - Returns: tunnel_created message      │
└────────┬────────────────────────────────┘
         │
         │ 3. Tunnel created response
         │    { subdomain: "abc123" }
         │
         ▼
┌─────────────────────────────────────────┐
│           SDK CLI Client                │
│  - Shows: https://abc123.sharelive.site │
│  - Waits for incoming requests          │
└─────────────────────────────────────────┘
```

---

### HTTP Request Proxying Flow

```
┌─────────────┐
│   Browser   │  (User visits https://abc123.sharelive.site/api/users)
└──────┬──────┘
       │
       │ 1. HTTP GET /api/users
       │    Host: abc123.sharelive.site
       │
       ▼
┌──────────────────────────────────────────┐
│      Backend (publicProxy.ts)            │
│  - Extracts subdomain from Host header   │
│  - Looks up WebSocket in tunnelManager   │
│  - Generates requestId (UUID)            │
│  - Stores reply object in pending Map    │
└──────┬───────────────────────────────────┘
       │
       │ 2. Forward request via WebSocket
       │    {
       │      type: "request",
       │      requestId: "...",
       │      method: "GET",
       │      path: "/api/users",
       │      headers: {...}
       │    }
       │
       ▼
┌──────────────────────────────────────────┐
│       SDK CLI Client (client.ts)         │
│  - Receives request message              │
│  - Makes HTTP request to localhost:3000  │
│  - Waits for local server response       │
└──────┬───────────────────────────────────┘
       │
       │ 3. Local server response
       │    { status: 200, body: [...] }
       │
       ▼
┌──────────────────────────────────────────┐
│       SDK CLI Client (client.ts)         │
│  - Converts response body to Base64      │
│  - Sends back via WebSocket              │
│    {
│      type: "response",
│      requestId: "...",
│      status: 200,
│      headers: {...},
│      body: "<base64>"
│    }
└──────┬───────────────────────────────────┘
       │
       │ 4. Response forwarded
       │
       ▼
┌──────────────────────────────────────────┐
│      Backend (tunnelManager.ts)          │
│  - Finds pending reply by requestId      │
│  - Decodes Base64 body                   │
│  - Sets headers and status               │
│  - Sends HTTP response                   │
└──────┬───────────────────────────────────┘
       │
       │ 5. HTTP response
       │
       ▼
┌─────────────┐
│   Browser   │  (Receives response)
└─────────────┘
```

---

## 🗄️ Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  passwordHash  String
  createdAt     DateTime  @default(now())
  projects      Project[]
}

model Project {
  id            String    @id @default(uuid())
  name          String
  subdomain     String    @unique
  targetUrl     String?
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  analytics     Analytics[]
}

model Analytics {
  id          String    @id @default(uuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
  method      String
  path        String
  statusCode  Int
  timestamp   DateTime  @default(now())
}
```

---

## 🔐 Security Architecture

### 1. **WebSocket Authentication**

Currently: Anonymous tunnels (anyone can create)

**Future Enhancement:**
- Require JWT token on WebSocket connection
- Validate token before tunnel creation
- Tie tunnels to user accounts

```typescript
// Future implementation
ws.on("open", () => {
  ws.send(JSON.stringify({
    type: "auth_required",
    message: "Send JWT token"
  }));
});

ws.on("message", (data) => {
  const msg = JSON.parse(data);
  if (msg.type === "auth" && !authenticated) {
    const isValid = verifyJWT(msg.token);
    if (isValid) {
      authenticated = true;
      // Create tunnel
    }
  }
});
```

### 2. **CORS Protection**

✅ Already implemented:
```typescript
// backend/src/server.ts
fastify.register(cors, {
  origin: "*",  // For development
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
});
```

**Production:** Restrict to specific origins:
```typescript
origin: ["https://sharelive.site", "https://dashboard.sharelive.site"]
```

### 3. **Rate Limiting**

**Recommended:**
```bash
npm install @fastify/rate-limit
```

```typescript
import rateLimit from '@fastify/rate-limit';

fastify.register(rateLimit, {
  max: 100,           // Max 100 requests
  timeWindow: '1 minute'
});
```

---

## 🚀 Deployment Architecture

### Production Setup

```
                    ┌──────────────────┐
                    │   Cloudflare     │
                    │   (DNS + CDN)    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   Vercel    │  │   EC2       │  │   RDS       │
    │  (Frontend) │  │  (Backend)  │  │ (Postgres)  │
    │             │  │             │  │             │
    │ Next.js App │  │  Fastify    │  │  Database   │
    │ Static Site │  │  WebSocket  │  │  Metadata   │
    └─────────────┘  └─────────────┘  └─────────────┘
```

### DNS Configuration

**Cloudflare DNS:**

| Record Type | Name          | Value                     | Proxy |
|-------------|---------------|---------------------------|-------|
| A           | @             | Vercel IP                 | ✅    |
| CNAME       | www           | sharelive.site            | ✅    |
| A           | tunnel        | EC2 Public IP             | ❌    |
| CNAME       | *.sharelive   | tunnel.sharelive.site     | ❌    |

**Why proxy OFF for tunnel?**
- WebSocket connections require direct access
- Cloudflare WebSocket support needs Workers (paid)
- SSL termination at EC2 (Let's Encrypt)

---

## ⚡ Performance Optimization

### 1. **Backend Clustering**

```javascript
// ecosystem.config.js (PM2)
module.exports = {
  apps: [{
    name: 'sharelive-backend',
    script: 'dist/server.js',
    instances: 4,  // 4 processes
    exec_mode: 'cluster'
  }]
}
```

**Problem:** WebSocket sticky sessions needed!

**Solution:** Use nginx upstream with `ip_hash`:

```nginx
upstream backend {
  ip_hash;  # Sticky sessions
  server 127.0.0.1:8080;
  server 127.0.0.1:8081;
  server 127.0.0.1:8082;
  server 127.0.0.1:8083;
}
```

### 2. **Frontend: Edge Caching**

```typescript
// app/page.tsx
export const revalidate = 3600; // Cache for 1 hour
```

### 3. **Database: Connection Pooling**

```typescript
// Prisma connection pool
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_timeout = 30
  connection_limit = 20
}
```

---

## 🔧 Monitoring & Logging

### Backend Logging

```typescript
// Structured logging with pino (Fastify default)
fastify.log.info({
  subdomain,
  method,
  path,
  status
}, 'Request processed');
```

### Metrics to Track

- **Tunnel Metrics:**
  - Active tunnel count
  - Tunnel creation rate
  - Tunnel duration average

- **Request Metrics:**
  - Requests per tunnel
  - Response time (p50, p95, p99)
  - Error rate

- **Infrastructure:**
  - CPU usage
  - Memory usage
  - WebSocket connection count

**Recommended Tools:**
- **Logs:** CloudWatch, Logtail, Datadog
- **Metrics:** Prometheus + Grafana
- **APM:** New Relic, Datadog APM

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// backend/src/tunnel/tunnelManager.test.ts
import { tunnelManager } from './tunnelManager';

describe('TunnelManager', () => {
  test('registers tunnel with subdomain', () => {
    const socket = createMockWebSocket();
    tunnelManager.register({
      id: '123',
      subdomain: 'test',
      socket
    });

    expect(tunnelManager.get('test')).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// Test end-to-end flow
test('HTTP request proxied through tunnel', async () => {
  // 1. Create tunnel via WebSocket
  // 2. Send HTTP request to tunnel URL
  // 3. Verify local server receives request
  // 4. Verify response returned correctly
});
```

### Load Testing

```bash
# Artillery.io
artillery quick --count 100 --num 1000 https://tunnel.sharelive.site
```

---

## 📊 Scaling Considerations

### Horizontal Scaling

**Problem:** In-memory `tunnelManager` Map doesn't work across servers.

**Solution:** Use Redis for shared state:

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

class TunnelManager {
  async register(client: TunnelClient) {
    await redis.hset(`tunnel:${client.subdomain}`, {
      id: client.id,
      serverId: process.env.SERVER_ID
    });
  }

  async get(subdomain: string) {
    return await redis.hget(`tunnel:${subdomain}`);
  }
}
```

**Architecture with Redis:**

```
┌───────────┐     ┌───────────┐
│ Backend 1 │     │ Backend 2 │
└─────┬─────┘     └─────┬─────┘
      │                 │
      └────┬───────┬────┘
           ▼       ▼
      ┌──────────────┐
      │    Redis     │
      │  (Shared)    │
      └──────────────┘
```

---

## 🎯 Future Enhancements

1. **Custom Domains**
   - Allow users to use their own domains
   - Automatic SSL with Let's Encrypt

2. **Authentication for Tunnels**
   - Require login to create tunnels
   - Tunnel analytics per user

3. **Webhook Forwarding**
   - Persist requests while tunnel offline
   - Replay when tunnel comes back

4. **Team Collaboration**
   - Share tunnels with team members
   - Access control

5. **Advanced Analytics**
   - Request/response inspection
   - Performance metrics
   - Error tracking

---

## 📚 References

- [Fastify Documentation](https://www.fastify.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [Commander.js](https://github.com/tj/commander.js/)

---

**Last Updated:** 2026-03-20
