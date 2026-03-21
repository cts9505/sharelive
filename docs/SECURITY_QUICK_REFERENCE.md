# Security Quick Reference

## For Developers

### Quick Setup

1. **Copy environment template:**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Configure security settings in `.env`:**
   ```bash
   # Recommended for production
   REQUIRE_AUTH=true
   ENABLE_TUNNEL_TOKENS=true
   MAX_REQUEST_SIZE=10485760
   MAX_TUNNEL_LIFETIME=14400000
   TUNNEL_RATE_LIMIT=100
   ```

3. **Build and start:**
   ```bash
   cd backend
   npm run build
   npm start
   ```

---

## Security Features Summary

| Feature | Status | Default | Config Variable |
|---------|--------|---------|-----------------|
| Request Body Forwarding | ✅ Fixed | Enabled | N/A |
| Header Sanitization | ✅ Active | Enabled | N/A |
| Request Size Limit | ✅ Active | 10MB | `MAX_REQUEST_SIZE` |
| Tunnel Rate Limiting | ✅ Active | 100/min | `TUNNEL_RATE_LIMIT` |
| Tunnel Expiration | ✅ Active | 4 hours | `MAX_TUNNEL_LIFETIME` |
| Access Tokens | ✅ Optional | Disabled | `ENABLE_TUNNEL_TOKENS` |
| JWT Authentication | ✅ Optional | Disabled | `REQUIRE_AUTH` |
| Request Timeout | ✅ Active | 30s | Hardcoded |
| CORS Protection | ✅ Active | Varies | `CORS_ORIGIN` |
| Subdomain Validation | ✅ Active | Enabled | N/A |

---

## Testing Security Features

### 1. Test Rate Limiting
```bash
# Should succeed for first 100, then fail with 429
for i in {1..150}; do
  curl -w "\n%{http_code}\n" https://yourtunnel.sharelive.site/
done
```

### 2. Test Request Size Limit
```bash
# Should fail with 413 Payload Too Large
dd if=/dev/zero bs=1M count=20 | \
  curl -X POST https://yourtunnel.sharelive.site/upload \
  --data-binary @- -w "\n%{http_code}\n"
```

### 3. Test Header Sanitization
```bash
# Start local server that logs headers
# These headers should NOT appear in local logs:
curl -H "X-Forwarded-For: attacker.com" \
     -H "X-Real-IP: 1.2.3.4" \
     https://yourtunnel.sharelive.site/api/info
```

### 4. Test Body Forwarding (POST/PUT/PATCH)
```bash
# Should receive the JSON body in local server
curl -X POST https://yourtunnel.sharelive.site/api/data \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 5. Test Tunnel Expiration
```bash
# Tunnel should auto-close after 4 hours
# Check tunnel status after MAX_TUNNEL_LIFETIME
```

---

## Environment Variables

### Required (Minimum)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (32+ chars)

### Recommended for Production
- `REQUIRE_AUTH=true` - Enforce authentication
- `CORS_ORIGIN` - Comma-separated allowed origins
- `MAX_REQUEST_SIZE=10485760` - 10MB limit
- `ENABLE_TUNNEL_TOKENS=true` - Enable access tokens

### Optional
- `SMTP_*` - Email configuration
- `RAZORPAY_*` - Payment gateway
- `CLOUDFLARE_*` - DNS management
- `MAX_TUNNEL_LIFETIME` - Tunnel auto-expiration
- `TUNNEL_RATE_LIMIT` - Requests per minute

---

## Security Checklist

### Before Production Deployment

- [ ] Set `REQUIRE_AUTH=true`
- [ ] Generate strong `JWT_SECRET` (32+ chars)
- [ ] Configure `CORS_ORIGIN` with exact domains
- [ ] Set `NODE_ENV=production`
- [ ] Enable `ENABLE_TUNNEL_TOKENS=true`
- [ ] Configure proper `MAX_REQUEST_SIZE` for your use case
- [ ] Set up HTTPS/SSL termination
- [ ] Review and adjust `TUNNEL_RATE_LIMIT` if needed
- [ ] Set up proper logging/monitoring
- [ ] Remove `.env` from version control
- [ ] Add `.env` to `.gitignore`
- [ ] Test all security features
- [ ] Review SECURITY.md documentation

---

## Common Issues & Solutions

### Issue: "Authentication required" error
**Solution:**
- Set `REQUIRE_AUTH=false` for development
- Or authenticate CLI with JWT token

### Issue: "Rate limit exceeded"
**Solution:**
- Increase `TUNNEL_RATE_LIMIT` value
- Optimize request patterns
- Reduce request frequency

### Issue: "413 Payload Too Large"
**Solution:**
- Increase `MAX_REQUEST_SIZE` if uploading large files
- Default is 10MB (10485760 bytes)

### Issue: POST/PUT requests not working
**Solution:**
- This was fixed in the security update
- Ensure you're running latest backend build

### Issue: Tunnel expires too quickly
**Solution:**
- Increase `MAX_TUNNEL_LIFETIME` value
- Default is 4 hours (14400000ms)

---

## Security Best Practices

### ✅ DO
- Use authentication in production (`REQUIRE_AUTH=true`)
- Keep JWT_SECRET secret and complex
- Monitor tunnel access logs
- Close unused tunnels
- Use separate dev/test databases
- Implement rate limiting
- Validate all user inputs
- Use HTTPS everywhere

### ❌ DON'T
- Commit `.env` file to Git
- Use weak JWT secrets
- Expose admin endpoints via tunnels
- Use production databases with tunnels
- Share tunnel URLs publicly
- Ignore rate limit warnings
- Disable security features in production

---

## Code Locations

Quick reference for where security features are implemented:

| Feature | File | Line(s) |
|---------|------|---------|
| Header Sanitization | `routes/publicProxy.ts` | 11-27 |
| Body Forwarding Fix | `routes/publicProxy.ts` | 78-79 |
| Rate Limiting | `tunnel/tunnelManager.ts` | 35-56 |
| Tunnel Expiration | `tunnel/tunnelSocket.ts` | 42-44 |
| Request Size Limit | `server.ts` | 18 |
| Access Tokens | `tunnel/tunnelSocket.ts` | 19-22 |
| Security Config | `config.ts` | 42-46 |

---

## Monitoring

### Check Active Tunnels
```typescript
// In code
const tunnels = tunnelManager.getActiveTunnels();
console.log('Active tunnels:', tunnels.length);
```

### Console Logs Format
```
[TUNNEL] New tunnel created: abc123.sharelive.site (expires: 2026-03-20T16:00:00.000Z)
[2026-03-20T12:00:00.000Z] GET /api/users -> abc123.sharelive.site
[TUNNEL] Tunnel closed: abc123.sharelive.site
```

---

## Support

- **Documentation:** `/docs/SECURITY.md`
- **Issues:** GitHub Issues
- **Security Reports:** security@sharelive.site

---

Last Updated: 2026-03-20
