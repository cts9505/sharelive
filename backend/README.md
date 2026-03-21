# ShareLive Backend

Complete Fastify server with WebSocket tunnels, authentication, and projects API.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your settings

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 📦 Features

- ✅ WebSocket tunnel server
- ✅ HTTP request proxying
- ✅ JWT authentication
- ✅ Projects CRUD API
- ✅ Rate limiting
- ✅ CORS configured
- ✅ Prisma ORM
- ✅ PostgreSQL support

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login (get token)
- `GET /auth/me` - Get current user

### Projects (Protected)
- `GET /projects/my` - List user projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/check/:subdomain` - Check availability

### Tunnels
- `WS /tunnel` - WebSocket tunnel connection
- `ANY /*` - HTTP proxy handler

### Health
- `GET /health` - Server health check

## 📝 Environment Variables

```bash
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://user:pass@localhost:5432/sharelive
JWT_SECRET=your-super-secret-key-min-32-chars
CORS_ORIGIN=https://sharelive.site
REQUIRE_AUTH=false
```

## 🗄️ Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

## 🧪 Testing

```bash
# Register user
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create project (requires token)
curl -X POST http://localhost:8080/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"myapp","targetUrl":"https://example.com"}'
```

## 🚀 Deployment

See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for the complete deployment guide.

## 📚 Documentation

- [Architecture](../docs/ARCHITECTURE.md)
- [API Reference](../docs/API.md)
- [Security Implementation](../docs/SECURITY_IMPLEMENTATION.md)
- [Complete Implementation](../docs/COMPLETE_IMPLEMENTATION.md)
