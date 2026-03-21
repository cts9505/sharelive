# ShareLive API Documentation

## Overview

ShareLive provides WebSocket and REST APIs for tunnel management.

---

## 🔌 WebSocket API

### Endpoint

```
wss://tunnel.sharelive.site/tunnel
```

### Connection Flow

```typescript
import WebSocket from 'ws';

const ws = new WebSocket('wss://tunnel.sharelive.site/tunnel');

ws.on('open', () => {
  console.log('Connected');

  // Optional: Register with custom subdomain
  ws.send(JSON.stringify({
    type: 'register',
    subdomain: 'myapp'
  }));
});
```

### Message Types

#### 1. Client → Server: `register` (Optional)

Request a custom subdomain. Must be sent within 2 seconds of connection.

```json
{
  "type": "register",
  "subdomain": "myapp"
}
```

**Validation:**
- 3-20 characters
- Alphanumeric and hyphens only
- Lowercase
- Must be unique

**Responses:**

Success:
```json
{
  "type": "tunnel_created",
  "subdomain": "myapp"
}
```

Error (subdomain taken):
```json
{
  "type": "error",
  "message": "Subdomain 'myapp' is already in use. Please choose another."
}
```

Error (invalid format):
```json
{
  "type": "error",
  "message": "Invalid subdomain. Use 3-20 characters (letters, numbers, hyphens only)"
}
```

#### 2. Server → Client: `tunnel_created`

Server confirms tunnel creation and provides subdomain.

```json
{
  "type": "tunnel_created",
  "subdomain": "abc123"
}
```

The tunnel URL will be: `https://abc123.sharelive.site`

#### 3. Server → Client: `request`

HTTP request received on tunnel URL. Client should proxy to localhost and respond.

```json
{
  "type": "request",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/users?page=1",
  "headers": {
    "host": "abc123.sharelive.site",
    "user-agent": "Mozilla/5.0...",
    "accept": "application/json",
    ...
  },
  "body": ""
}
```

**Fields:**
- `requestId` - Unique UUID to track this request
- `method` - HTTP method (GET, POST, PUT, DELETE, etc.)
- `path` - Request path including query string
- `headers` - HTTP headers object
- `body` - Request body (for POST/PUT) as string

#### 4. Client → Server: `response`

Client responds with the result from localhost.

```json
{
  "type": "response",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "status": 200,
  "headers": {
    "content-type": "application/json",
    "cache-control": "no-cache"
  },
  "body": "<base64-encoded-body>"
}
```

**Fields:**
- `requestId` - Same UUID from the request
- `status` - HTTP status code (200, 404, 500, etc.)
- `headers` - Response headers object
- `body` - Response body encoded in Base64

**Example:**
```typescript
const response = {
  type: 'response',
  requestId: msg.requestId,
  status: 200,
  headers: { 'content-type': 'application/json' },
  body: Buffer.from(JSON.stringify({ success: true })).toString('base64')
};

ws.send(JSON.stringify(response));
```

#### 5. Server → Client: `error`

Error occurred (e.g., subdomain conflict).

```json
{
  "type": "error",
  "message": "Error description"
}
```

---

## 🌐 HTTP API

### Base URL

```
https://tunnel.sharelive.site
```

### 1. Public Tunnel Proxy

#### `ANY /*`

Proxies HTTP requests to tunnel client.

**Request:**
```http
GET /api/users HTTP/1.1
Host: abc123.sharelive.site
```

**Behavior:**
1. Extracts subdomain from `Host` header
2. Looks up active tunnel
3. Forwards request via WebSocket
4. Waits for response (30s timeout)
5. Returns response to browser

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{"users": [...]}
```

**Error Cases:**

Tunnel not found:
```http
HTTP/1.1 404 Not Found

Tunnel not found
```

Tunnel timeout (client didn't respond in 30s):
```http
HTTP/1.1 504 Gateway Timeout

Gateway Timeout: Local tunnel did not respond.
```

Local server offline:
```http
HTTP/1.1 502 Bad Gateway
Content-Type: text/html

<html>
  <body>
    <h1>Tunnel is Active!</h1>
    <p>Nothing is running on localhost:3000 yet.</p>
  </body>
</html>
```

---

## 🔐 REST API (Future)

These endpoints will handle user management and tunnel metadata.

### Authentication

All REST endpoints require JWT authentication:

```http
Authorization: Bearer <jwt-token>
```

### Endpoints

#### `POST /api/auth/register`

Register new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/auth/login`

Login existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### `GET /api/projects`

List user's projects.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "projects": [
    {
      "id": "...",
      "name": "My App",
      "subdomain": "myapp",
      "isActive": true,
      "createdAt": "2026-03-20T10:00:00Z",
      "lastActive": "2026-03-20T15:30:00Z"
    }
  ]
}
```

#### `POST /api/projects`

Create new project (reserve subdomain).

**Request:**
```json
{
  "name": "My App",
  "subdomain": "myapp",
  "targetUrl": "https://myapp.herokuapp.com"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "...",
    "name": "My App",
    "subdomain": "myapp",
    "targetUrl": null,
    "isActive": true
  }
}
```

#### `GET /api/projects/:id`

Get project details.

**Response:**
```json
{
  "project": {
    "id": "...",
    "name": "My App",
    "subdomain": "myapp",
    "isActive": true,
    "analytics": {
      "totalRequests": 1234,
      "last24h": 56,
      "topPaths": [
        { "path": "/api/users", "count": 45 },
        { "path": "/", "count": 32 }
      ]
    }
  }
}
```

#### `PUT /api/projects/:id`

Update project.

**Request:**
```json
{
  "name": "My Updated App",
  "isActive": false
}
```

#### `DELETE /api/projects/:id`

Delete project.

**Response:**
```json
{
  "success": true,
  "message": "Project deleted"
}
```

#### `GET /api/analytics/:projectId`

Get project analytics.

**Query Parameters:**
- `from` - Start date (ISO 8601)
- `to` - End date (ISO 8601)
- `limit` - Max results (default: 100)

**Response:**
```json
{
  "analytics": [
    {
      "id": "...",
      "method": "GET",
      "path": "/api/users",
      "statusCode": 200,
      "timestamp": "2026-03-20T15:30:00Z"
    },
    ...
  ],
  "summary": {
    "total": 1234,
    "byStatus": {
      "2xx": 1100,
      "4xx": 100,
      "5xx": 34
    }
  }
}
```

---

## 🚨 Error Codes

### WebSocket Errors

| Code | Message | Description |
|------|---------|-------------|
| 1000 | Normal Closure | Client disconnected normally |
| 1001 | Going Away | Server shutting down |
| 1002 | Protocol Error | Invalid WebSocket frame |
| 1003 | Unsupported Data | Invalid message format |

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Tunnel doesn't exist |
| 409 | Conflict | Subdomain already taken |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | Local server offline |
| 504 | Gateway Timeout | Request timed out |

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| WebSocket `/tunnel` | 10 connections | Per IP per minute |
| HTTP Proxy `/*` | 1000 requests | Per tunnel per minute |
| REST API `/api/*` | 100 requests | Per user per minute |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1679318400
```

---

## 🔧 SDK Usage Examples

### Basic Tunnel

```typescript
import { expose } from 'sharelive';

expose(3000);
```

### Custom Subdomain

```typescript
import { expose } from 'sharelive';

expose(3000, {
  customSubdomain: 'myapp',
  verbose: true
});
```

### Handling Requests

```typescript
import http from 'http';
import { expose } from 'sharelive';

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from localhost!');
});

server.listen(3000, () => {
  console.log('Local server on port 3000');
  expose(3000, { verbose: true });
});
```

---

## 🧪 Testing API Endpoints

### WebSocket Test

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c wss://tunnel.sharelive.site/tunnel

# Send register message
{"type":"register","subdomain":"test123"}

# You should receive: {"type":"tunnel_created","subdomain":"test123"}
```

### HTTP Proxy Test

```bash
# After creating tunnel
curl https://abc123.sharelive.site/
```

### REST API Test

```bash
# Register user
curl -X POST https://tunnel.sharelive.site/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST https://tunnel.sharelive.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get projects
curl https://tunnel.sharelive.site/api/projects \
  -H "Authorization: Bearer <token>"
```

---

## 📝 Changelog

### v1.0.0 (Current)

- ✅ WebSocket tunnel creation
- ✅ Custom subdomain support
- ✅ HTTP request proxying
- ✅ CLI tool with options
- ✅ Request logging
- ✅ Unlimited tunnel time

### v1.1.0 (Planned)

- ⬜ User authentication
- ⬜ REST API for projects
- ⬜ Analytics dashboard
- ⬜ Rate limiting
- ⬜ Custom domains

### v2.0.0 (Future)

- ⬜ Team collaboration
- ⬜ Webhook replay
- ⬜ Request inspection
- ⬜ Custom TLS certificates
- ⬜ Multi-region support

---

## 🔗 Related Resources

- [Main Documentation](./README.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [GitHub Repository](https://github.com/yourusername/sharelive)

---

**Last Updated:** 2026-03-20
