# ShareLive SDK

Command-line tool to expose localhost to the internet via secure tunnels.

## 📦 Installation

```bash
# Global installation (after publishing to npm)
npm install -g sharelive

# Or use locally
npm link
```

## 🚀 Usage

### Authentication

```bash
# Login to your account
sharelive login

# Logout
sharelive logout
```

### Create Tunnels

```bash
# Basic usage (default port 3000)
sharelive

# Specify port
sharelive --port 8080
sharelive -p 8080

# Custom subdomain
sharelive --name myapp
sharelive -n myapp -p 3000

# Verbose logging
sharelive --verbose
sharelive -v

# All options combined
sharelive -p 3000 -n myapp -v
```

### Help

```bash
# Show all commands
sharelive --help

# Show version
sharelive --version
```

## ⚙️ Configuration

Config stored in `~/.sharelive/config.json`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "serverUrl": "https://tunnel.sharelive.site"
}
```

## 🔐 Authentication

Login before creating tunnels:

```bash
sharelive login
# Enter your email and password
# Token saved securely (permissions: 0o600)

sharelive -p 3000
# Creates authenticated tunnel
# Shows: 🔐 Authenticated tunnel for user@example.com
```

## 📝 Environment Variables

```bash
# Optional: override server URL
export SHARELIVE_URL=https://tunnel.sharelive.site
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Link for local testing
npm link

# Test
sharelive --help
```

## 🔌 How It Works

1. **Connect**: SDK opens WebSocket to server
2. **Authenticate** (optional): Sends JWT token
3. **Register**: Gets unique subdomain (e.g., abc123.sharelive.site)
4. **Forward**: Proxies requests from public URL to localhost
5. **Respond**: Sends localhost response back to browser

## 🎯 Features

- ✅ Unlimited tunnel time
- ✅ Custom subdomains
- ✅ Request logging
- ✅ Authentication support
- ✅ Works even if port offline
- ✅ Beautiful error pages

## 📚 Documentation

- [Architecture](../docs/ARCHITECTURE.md)
- [Complete Implementation](../docs/COMPLETE_IMPLEMENTATION.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
