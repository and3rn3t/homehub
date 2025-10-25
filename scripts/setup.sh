#!/bin/bash
# HomeHub Development Setup Script (Bash)
# Run this to set up your development environment quickly

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 HomeHub Development Setup${NC}"
echo -e "${CYAN}==============================\n${NC}"

# Check Node.js version
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found! Please install from https://nodejs.org/${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: v$NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found!${NC}"
    exit 1
fi

# 1. Copy environment file
echo -e "\n${YELLOW}📝 Setting up environment file...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ .env created from template${NC}"
    echo -e "${GRAY}   💡 Edit .env if you need custom settings${NC}"
else
    echo -e "${GREEN}✅ .env already exists${NC}"
fi

# 2. Install main dependencies
echo -e "\n${YELLOW}📦 Installing main project dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Main dependencies installed${NC}"

# 3. Install worker dependencies
echo -e "\n${YELLOW}📦 Installing worker dependencies...${NC}"
cd workers
npm install
echo -e "${GREEN}✅ Worker dependencies installed${NC}"
cd ..

# 4. Run validation
echo -e "\n${YELLOW}🔍 Running validation checks...${NC}"
if npm run validate; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Some validation checks failed (this may be OK for initial setup)${NC}"
fi

# 5. Check for Wrangler
echo -e "\n${YELLOW}🔧 Checking Cloudflare Wrangler...${NC}"
if npx wrangler --version &> /dev/null; then
    WRANGLER_VERSION=$(npx wrangler --version)
    echo -e "${GREEN}✅ Wrangler CLI available: $WRANGLER_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Wrangler CLI not found (will use npx)${NC}"
fi

# 6. Final summary
echo -e "\n${GREEN}✨ Setup Complete!${NC}"
echo -e "${GREEN}==================\n${NC}"

echo -e "${CYAN}📋 Next Steps:${NC}"
echo -e "   ${NC}1. Configure Cloudflare (see docs/SETUP_CHECKLIST.md section 4)${NC}"
echo -e "   ${NC}2. Install VS Code extensions (open project in VS Code)${NC}"
echo -e "   ${NC}3. Start development servers:\n${NC}"
echo -e "      ${GRAY}Terminal 1: npm run worker:dev${NC}"
echo -e "      ${GRAY}Terminal 2: npm run dev\n${NC}"

echo -e "${CYAN}📚 Documentation:${NC}"
echo -e "   ${NC}- Setup Guide: docs/SETUP_CHECKLIST.md${NC}"
echo -e "   ${NC}- Configuration: docs/CONFIGURATION_QUICKREF.md${NC}"
echo -e "   ${NC}- Extensions: EXTENSIONS_QUICKREF.md\n${NC}"

echo -e "${CYAN}🎯 Quick Start:${NC}"
echo -e "   ${NC}npm run dev          # Start frontend (port 5173)${NC}"
echo -e "   ${NC}npm run worker:dev   # Start worker (port 8787)\n${NC}"

echo -e "${MAGENTA}Happy coding! 🚀${NC}"
