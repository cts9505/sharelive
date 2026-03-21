#!/bin/bash

# ShareLive Migration Script
# This script reorganizes the project from two separate folders into a clean 3-folder structure

set -e  # Exit on error

echo "🚀 ShareLive Project Migration Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Current directory: $SCRIPT_DIR"
echo ""

# Check if directories exist
if [ ! -d "$SCRIPT_DIR/packages" ]; then
    echo -e "${RED}❌ Error: packages/ directory not found${NC}"
    exit 1
fi

if [ ! -d "$SCRIPT_DIR/Share-Live-main" ]; then
    echo -e "${RED}❌ Error: Share-Live-main/ directory not found${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This script will reorganize your project structure.${NC}"
echo -e "${YELLOW}   A backup will be created before making changes.${NC}"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled."
    exit 0
fi

echo ""
echo "📦 Step 1/6: Creating backup..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="$SCRIPT_DIR/backup_$timestamp"
mkdir -p "$backup_dir"
cp -r "$SCRIPT_DIR/packages" "$backup_dir/"
cp -r "$SCRIPT_DIR/Share-Live-main" "$backup_dir/"
echo -e "${GREEN}✅ Backup created at: $backup_dir${NC}"
echo ""

echo "📂 Step 2/6: Creating new folder structure..."
mkdir -p "$SCRIPT_DIR/frontend"
mkdir -p "$SCRIPT_DIR/backend"
mkdir -p "$SCRIPT_DIR/sdk"
mkdir -p "$SCRIPT_DIR/docs"
echo -e "${GREEN}✅ Folders created${NC}"
echo ""

echo "🎨 Step 3/6: Migrating frontend (from Share-Live-main/apps/web)..."
if [ -d "$SCRIPT_DIR/Share-Live-main/apps/web" ]; then
    cp -r "$SCRIPT_DIR/Share-Live-main/apps/web/"* "$SCRIPT_DIR/frontend/" 2>/dev/null || true
    cp -r "$SCRIPT_DIR/Share-Live-main/apps/web/."* "$SCRIPT_DIR/frontend/" 2>/dev/null || true
    echo -e "${GREEN}✅ Frontend migrated${NC}"
else
    echo -e "${YELLOW}⚠️  Share-Live-main/apps/web not found, skipping${NC}"
fi
echo ""

echo "⚙️  Step 4/6: Migrating backend (from packages/tunnel-server)..."
if [ -d "$SCRIPT_DIR/packages/tunnel-server" ]; then
    cp -r "$SCRIPT_DIR/packages/tunnel-server/"* "$SCRIPT_DIR/backend/" 2>/dev/null || true
    cp -r "$SCRIPT_DIR/packages/tunnel-server/."* "$SCRIPT_DIR/backend/" 2>/dev/null || true

    # Copy router code if exists (for future integration)
    if [ -d "$SCRIPT_DIR/Share-Live-main/apps/router" ]; then
        echo "   📋 Also copying router code for future integration..."
        mkdir -p "$SCRIPT_DIR/backend/router_reference"
        cp -r "$SCRIPT_DIR/Share-Live-main/apps/router" "$SCRIPT_DIR/backend/router_reference/"
    fi

    echo -e "${GREEN}✅ Backend migrated${NC}"
else
    echo -e "${YELLOW}⚠️  packages/tunnel-server not found, skipping${NC}"
fi
echo ""

echo "🔧 Step 5/6: Migrating SDK (from packages/sdk)..."
if [ -d "$SCRIPT_DIR/packages/sdk" ]; then
    cp -r "$SCRIPT_DIR/packages/sdk/"* "$SCRIPT_DIR/sdk/" 2>/dev/null || true
    cp -r "$SCRIPT_DIR/packages/sdk/."* "$SCRIPT_DIR/sdk/" 2>/dev/null || true
    echo -e "${GREEN}✅ SDK migrated${NC}"
else
    echo -e "${YELLOW}⚠️  packages/sdk not found, skipping${NC}"
fi
echo ""

echo "📚 Step 6/6: Creating documentation files..."

# Create frontend README
cat > "$SCRIPT_DIR/frontend/README.md" << 'EOF'
# ShareLive Frontend

Next.js web application for ShareLive tunnel management.

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
npm run build
npm start
```

## 🌐 Deploy to Vercel

```bash
vercel
```

## 📖 Documentation

See [DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment guide.
EOF

# Create backend README
cat > "$SCRIPT_DIR/backend/README.md" << 'EOF'
# ShareLive Backend

WebSocket tunnel server built with Fastify.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Run development server
npm run dev
```

Server runs on http://localhost:8080

## 📦 Build

```bash
npm run build
npm start
```

## 🌐 Deploy to EC2

See [DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment guide.

## 🔌 WebSocket Endpoint

- **Tunnel:** `ws://localhost:8080/tunnel`
- **HTTP Proxy:** `http://localhost:8080/*`

## 📖 Documentation

- [Architecture](../ARCHITECTURE.md)
- [Deployment](../DEPLOYMENT.md)
EOF

# Create SDK README
cat > "$SCRIPT_DIR/sdk/README.md" << 'EOF'
# ShareLive SDK

CLI tool to expose localhost to the internet via secure tunnels.

## 📦 Installation

```bash
npm install -g sharelive
```

## 🚀 Usage

```bash
# Basic usage (default port 3000)
sharelive

# Specify port
sharelive --port 8080
sharelive -p 8080

# Custom subdomain
sharelive --name myapp
sharelive -n myapp

# Verbose logging
sharelive --verbose
sharelive -v

# All options combined
sharelive -p 3000 -n myapp -v

# View help
sharelive --help
```

## 🔧 Configuration

The SDK connects to:
- Production: `wss://tunnel.sharelive.site/tunnel`
- Development: `ws://localhost:8080/tunnel`

## 📦 Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test locally
npm link
sharelive --help
```

## 📖 Documentation

See [DEPLOYMENT.md](../DEPLOYMENT.md) for publishing to npm.
EOF

# Create main README
cat > "$SCRIPT_DIR/README.md" << 'EOF'
# ShareLive

🚀 Expose your localhost to the internet via secure tunnels. Like ngrok, but open source and self-hostable.

## 📦 Project Structure

```
sharelive/
├── frontend/         # Next.js web app (Vercel)
├── backend/          # Fastify tunnel server (EC2)
├── sdk/              # CLI tool (npm)
└── docs/             # Documentation
```

## 🎯 Quick Start

### For Users

Install the CLI:
```bash
npm install -g sharelive
sharelive --port 3000
```

### For Developers

See individual README files:
- [Frontend Setup](./frontend/README.md)
- [Backend Setup](./backend/README.md)
- [SDK Development](./sdk/README.md)

## 📚 Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Migration Plan](./MIGRATION_PLAN.md)

## 🛠️ Tech Stack

- **Frontend:** Next.js, TailwindCSS, TypeScript
- **Backend:** Fastify, WebSocket, Prisma, PostgreSQL
- **SDK:** Node.js, Commander.js, ws

## 🚀 Deployment

- **Frontend:** Vercel (auto-deploy)
- **Backend:** AWS EC2 + PM2 + Nginx
- **SDK:** npm Registry

## 📖 Features

✅ Instant tunnel creation
✅ Custom subdomains
✅ Request logging
✅ Unlimited tunnel time
✅ Dashboard & analytics
✅ Free & open source

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support

- GitHub Issues: [Report bugs](https://github.com/yourusername/sharelive/issues)
- Email: support@sharelive.site

---

Made with ❤️ by ShareLive Team
EOF

echo -e "${GREEN}✅ Documentation created${NC}"
echo ""

# Create .gitignore for each folder
cat > "$SCRIPT_DIR/frontend/.gitignore" << 'EOF'
# Dependencies
node_modules/

# Production
.next/
out/
build/

# Environment
.env*.local
.env

# Misc
.DS_Store
*.log
.vercel
EOF

cat > "$SCRIPT_DIR/backend/.gitignore" << 'EOF'
# Dependencies
node_modules/

# Build
dist/

# Environment
.env
.env.local

# Logs
*.log
logs/

# Misc
.DS_Store
EOF

cat > "$SCRIPT_DIR/sdk/.gitignore" << 'EOF'
# Dependencies
node_modules/

# Build
dist/

# Logs
*.log

# Misc
.DS_Store
EOF

echo "📋 Creating environment templates..."

# Frontend .env.example
cat > "$SCRIPT_DIR/frontend/.env.example" << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_TUNNEL_URL=ws://localhost:8080/tunnel
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
DATABASE_URL=postgresql://user:password@localhost:5432/sharelive
EOF

# Backend .env.example
cat > "$SCRIPT_DIR/backend/.env.example" << 'EOF'
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://user:password@localhost:5432/sharelive
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
EOF

echo -e "${GREEN}✅ Environment templates created${NC}"
echo ""
echo "========================================"
echo -e "${GREEN}🎉 Migration Complete!${NC}"
echo "========================================"
echo ""
echo "New structure created:"
echo "  📁 frontend/  - Next.js web app"
echo "  📁 backend/   - Fastify tunnel server"
echo "  📁 sdk/       - CLI tool"
echo "  📁 docs/      - Documentation"
echo ""
echo "Next steps:"
echo "  1. Review the new structure"
echo "  2. Install dependencies:"
echo "     cd frontend && npm install"
echo "     cd backend && npm install"
echo "     cd sdk && npm install"
echo "  3. Copy .env.example to .env and configure"
echo "  4. Test each component locally"
echo "  5. Deploy following DEPLOYMENT.md"
echo ""
echo "📦 Backup location: $backup_dir"
echo ""
echo -e "${YELLOW}Note: Old folders (packages/, Share-Live-main/) are still present.${NC}"
echo -e "${YELLOW}You can delete them after verifying the migration.${NC}"
echo ""
