# ShareLive Security Documentation

## Overview

This document outlines the security measures implemented in ShareLive's tunnel system to protect both the server infrastructure and users' local development environments.

## Security Implementations

### 1. ✅ Request Body Handling (CRITICAL FIX)

**Issue Fixed:** Previously, all tunnel requests forwarded an empty body, breaking POST/PUT/PATCH requests.

**Solution:**
- Properly encode request bodies as base64 before forwarding to tunnel clients
- Support for JSON, form-urlencoded, and binary data
- Automatic content-type detection

**Location:** `backend/src/routes/publicProxy.ts:78`

---

### 2. ✅ Header Sanitization

**Protection:** Prevents header injection attacks and malicious header forwarding.

**Implementation:**
- Strips dangerous headers: `x-real-ip`, `x-forwarded-for`, `x-forwarded-host`, `x-forwarded-proto`
- Prevents header-based attacks like XSS, session hijacking, and IP spoofing
- Only safe headers are forwarded to local tunnel clients

**Location:** `backend/src/routes/publicProxy.ts:11-27`

**Headers Blocked:**
```typescript
const DANGEROUS_HEADERS = [
  'x-real-ip',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
];
```

---

### 3. ✅ Request Size Limits

**Protection:** Prevents DoS attacks through large payload uploads.

**Configuration:**
- Default: 10MB per request
- Configurable via `MAX_REQUEST_SIZE` environment variable
- Applied globally to all Fastify routes

**Location:** `backend/src/server.ts:18` and `backend/src/config.ts:42`

**Example:**
```bash
# In .env file
MAX_REQUEST_SIZE=10485760  # 10MB in bytes
```

---

### 4. ✅ Tunnel Access Tokens (Optional)

**Protection:** Adds an extra layer of authentication for tunnel access.

**Implementation:**
- Generates a unique 64-character hex token per tunnel
- Token sent to CLI client during tunnel creation
- Can be used for future token-based access validation

**Configuration:**
```bash
ENABLE_TUNNEL_TOKENS=true
```

**Location:** `backend/src/tunnel/tunnelSocket.ts:19-22`

**Response Example:**
```json
{
  "type": "tunnel_created",
  "subdomain": "abc123",
  "accessToken": "a1b2c3d4...",
  "expiresAt": "2026-03-20T12:00:00.000Z"
}
```

---

### 5. ✅ Per-Tunnel Rate Limiting

**Protection:** Prevents abuse of individual tunnels through request flooding.

**Implementation:**
- 100 requests per minute per tunnel (configurable)
- Sliding window algorithm with 1-minute windows
- Returns 429 status when limit exceeded

**Configuration:**
```bash
TUNNEL_RATE_LIMIT=100  # requests per minute
```

**Location:** `backend/src/tunnel/tunnelManager.ts:35-56`

**Response on Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests to tunnel 'abc123'. Please slow down."
}
```

---

### 6. ✅ Tunnel Expiration

**Protection:** Prevents indefinite tunnel occupation and resource exhaustion.

**Implementation:**
- Default lifetime: 4 hours
- Automatic cleanup on expiration
- Configurable via environment variable

**Configuration:**
```bash
MAX_TUNNEL_LIFETIME=14400000  # 4 hours in milliseconds
```

**Location:** `backend/src/tunnel/tunnelSocket.ts:42-44`

**Behavior:**
- Tunnel automatically closes after expiration
- Client needs to reconnect to create a new tunnel
- Expiration time sent to client on creation

---

### 7. ✅ JWT Authentication (Optional)

**Protection:** Identity verification for tunnel creation and API access.

**Implementation:**
- Optional authentication mode (disabled by default for easier onboarding)
- JWT token verification for tunnel WebSocket connections
- User ID tracking for authenticated tunnels

**Configuration:**
```bash
REQUIRE_AUTH=true  # Set to true to enforce authentication
```

**Location:** `backend/src/tunnel/tunnelSocket.ts:28-35`

**Authentication Flow:**
```javascript
// Client sends auth message
{ type: "auth", token: "jwt_token_here" }

// Server responds
{ type: "authenticated", email: "user@example.com", userId: "123" }
```

---

### 8. ✅ Timeout Protection

**Protection:** Prevents hanging connections when local clients don't respond.

**Implementation:**
- 30-second timeout for pending requests
- Automatic cleanup of stale pending requests
- Returns 504 Gateway Timeout to clients

**Location:** `backend/src/tunnel/tunnelManager.ts:63-75`

---

### 9. ✅ Subdomain Validation

**Protection:** Prevents subdomain injection and malicious subdomain names.

**Implementation:**
- 3-20 character length limit
- Alphanumeric and hyphens only
- Lowercase normalization
- Duplicate subdomain detection

**Validation Pattern:** `/^[a-z0-9-]{3,20}$/`

**Location:** `backend/src/tunnel/tunnelSocket.ts:114-116`

---

### 10. ✅ CORS Protection

**Protection:** Prevents unauthorized cross-origin requests in production.

**Implementation:**
- Production: Whitelist-based origin validation
- Development: Permissive for local development
- Credentials support for authenticated requests

**Configuration:**
```bash
CORS_ORIGIN=https://app.sharelive.site,https://sharelive.site
```

**Location:** `backend/src/server.ts:20-26`

---

## Environment Variables

### Security Configuration

Add these to your `.env` file:

```bash
# Authentication (recommended for production)
REQUIRE_AUTH=true
JWT_SECRET=your-super-secret-jwt-key-here

# Tunnel Security
MAX_REQUEST_SIZE=10485760        # 10MB
MAX_TUNNEL_LIFETIME=14400000     # 4 hours in ms
TUNNEL_RATE_LIMIT=100            # requests per minute per tunnel
ENABLE_TUNNEL_TOKENS=true        # Enable access tokens

# CORS
CORS_ORIGIN=https://your-frontend.com
```

---

## Security Best Practices for Users

### ⚠️ For Tunnel Users

1. **Never expose sensitive endpoints** through tunnels
   - Avoid exposing admin panels, database interfaces, or sensitive APIs

2. **Use authentication on your local server**
   - Don't rely solely on tunnel security
   - Implement your own auth layer

3. **Validate all inputs** in your local application
   - Treat all incoming requests as untrusted
   - Sanitize and validate user inputs

4. **Monitor tunnel logs** for suspicious activity
   - Check console output for unusual patterns
   - Watch for unexpected request methods or paths

5. **Close tunnels when not in use**
   - Don't leave tunnels running overnight
   - Tunnels auto-expire after 4 hours by default

6. **Don't use production databases** with tunnels
   - Use separate dev/test databases
   - Never expose production credentials

7. **Use HTTPS on your local server** when possible
   - ShareLive provides SSL termination
   - Consider local SSL for end-to-end encryption

---

## Known Limitations

### 🔴 Not Yet Implemented

1. **IP Whitelisting**
   - No IP-based access control
   - All internet traffic can access active tunnels

2. **Advanced Audit Logging**
   - Request logging is console-only
   - No database persistence of access logs

3. **Method Restrictions**
   - All HTTP methods allowed (GET, POST, PUT, DELETE, etc.)
   - Cannot restrict to read-only tunnels

4. **Geographic Restrictions**
   - No geofencing capabilities
   - Cannot block traffic from specific countries

5. **Token Validation on Requests**
   - Access tokens are generated but not yet validated on incoming requests
   - Future enhancement to require token in request headers

---

## Attack Scenarios & Mitigations

### Scenario 1: Rate Limit Bypass Attempt

**Attack:** Attacker tries to flood a tunnel with requests
**Mitigation:** ✅ Per-tunnel rate limiting (100 req/min)
**Status:** Protected

### Scenario 2: Large Payload DoS

**Attack:** Attacker sends GB-sized payloads
**Mitigation:** ✅ Request size limit (10MB default)
**Status:** Protected

### Scenario 3: Long-Running Tunnel Occupation

**Attack:** Attacker creates tunnel and holds it indefinitely
**Mitigation:** ✅ 4-hour tunnel expiration
**Status:** Protected

### Scenario 4: Header Injection

**Attack:** Malicious headers like `X-Forwarded-For: <script>alert('XSS')</script>`
**Mitigation:** ✅ Header sanitization strips dangerous headers
**Status:** Protected

### Scenario 5: Request Timeout Exploitation

**Attack:** Many requests sent to overwhelm pending queue
**Mitigation:** ✅ 30-second timeout + rate limiting
**Status:** Protected

### Scenario 6: Unauthorized Access

**Attack:** Accessing someone else's tunnel
**Mitigation:** ⚠️ Subdomain validation only (tokens generated but not enforced)
**Status:** Partially Protected
**Recommendation:** Enable `REQUIRE_AUTH=true` for production

---

## Reporting Security Issues

If you discover a security vulnerability, please report it to:

**Email:** security@sharelive.site (or your contact email)

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Please do NOT:**
- Publicly disclose the vulnerability before it's fixed
- Exploit the vulnerability for malicious purposes
- Access other users' data without permission

---

## Changelog

### 2026-03-20 - Security Hardening Update

- ✅ Fixed critical body forwarding bug
- ✅ Implemented header sanitization
- ✅ Added request size limits (10MB)
- ✅ Implemented per-tunnel rate limiting (100 req/min)
- ✅ Added tunnel expiration (4 hours)
- ✅ Generated access tokens for future use
- ✅ Enhanced tunnel metadata tracking
- ✅ Improved timeout handling

---

## Future Enhancements

### Planned Security Features

1. **IP Whitelisting** (Priority: High)
   - Allow users to restrict tunnel access to specific IPs
   - Configurable per tunnel

2. **Request Audit Trail** (Priority: High)
   - Database persistence of all tunnel requests
   - Queryable access logs
   - Anomaly detection

3. **Method Restrictions** (Priority: Medium)
   - Read-only tunnels (GET/HEAD only)
   - Configurable allowed methods per tunnel

4. **Token Validation** (Priority: High)
   - Enforce access tokens on incoming requests
   - Header-based token authentication: `X-Tunnel-Token`

5. **DDoS Protection** (Priority: Medium)
   - Connection-level rate limiting
   - Automatic blacklisting of abusive IPs

6. **Tunnel Analytics** (Priority: Low)
   - Real-time dashboard for tunnel activity
   - Traffic statistics and patterns

---

## Compliance

### Data Privacy

- ShareLive acts as a proxy and does not store request/response bodies
- Console logs contain: timestamp, method, path, and subdomain
- No user data or request contents are persisted to disk
- Temporary request metadata stored in memory only

### GDPR Considerations

- No personal data collected without authentication
- Authenticated users: email and user ID stored
- Right to erasure: Contact admin to delete account data
- Data retention: Session data cleared on tunnel close

---

## Testing Security

### Manual Security Testing

```bash
# Test rate limiting
for i in {1..150}; do
  curl https://yourtunnel.sharelive.site/api/test
done

# Test request size limit
dd if=/dev/zero bs=1M count=20 | curl -X POST https://yourtunnel.sharelive.site/upload --data-binary @-

# Test tunnel expiration
# Create tunnel and wait 4+ hours, should auto-close

# Test header sanitization
curl -H "X-Forwarded-For: attacker.com" https://yourtunnel.sharelive.site/api/info
# Local server should not receive X-Forwarded-For header
```

---

## Support

For security questions or concerns:
- GitHub Issues: https://github.com/yourusername/sharelive/issues
- Email: support@sharelive.site
- Documentation: https://docs.sharelive.site

---

Last Updated: 2026-03-20
Version: 1.0.0
