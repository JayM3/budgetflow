#!/usr/bin/env bash
# ==============================================================================
# BudgetFlow Family Hub - Automated Linux & Android Termux Installer
# ==============================================================================

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║             🌊 BudgetFlow Family Hub Installer               ║"
echo "║          Local-First, Lightweight Household Finance           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# 1. Detect Environment (Termux vs Standard Linux)
IS_TERMUX=false
if [ -n "$TERMUX_VERSION" ] || [ -d "/data/data/com.termux" ]; then
    IS_TERMUX=true
    echo "📱 Environment Detected: Android Termux"
else
    echo "🐧 Environment Detected: Linux Server / Desktop / Raspberry Pi"
fi

# 2. Check / Install Node.js & npm
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "⚠️ Node.js / npm not found. Installing..."
    if [ "$IS_TERMUX" = true ]; then
        pkg update -y
        pkg install -y nodejs git
    elif command -v apt-get >/dev/null 2>&1; then
        echo "Running: sudo apt-get update && sudo apt-get install -y nodejs npm"
        sudo apt-get update && sudo apt-get install -y nodejs npm
    else
        echo "❌ Please install Node.js (version 18 or newer) and npm on your system, then re-run this script."
        exit 1
    fi
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js Ready: $NODE_VERSION"

# 3. Install Root Frontend Dependencies & Build Static Client
echo ""
echo "📦 Installing Frontend Dependencies..."
npm install --no-audit --prefer-offline

echo ""
echo "🔨 Building Production Frontend Bundle (into /dist)..."
npm run build

# 4. Install Server Dependencies (Zero native C++ build tools required!)
echo ""
echo "📦 Installing Lightweight Hub Server Dependencies..."
cd server
npm install --no-audit --prefer-offline
cd ..

# 5. Make CLI & Scripts Executable and Register Globally
chmod +x start.sh 2>/dev/null || true
chmod +x bin/budgetflow.js 2>/dev/null || true

CLI_REGISTERED=false
if [ "$IS_TERMUX" = true ] && [ -d "$PREFIX/bin" ]; then
    ln -sf "$(pwd)/bin/budgetflow.js" "$PREFIX/bin/budgetflow"
    CLI_REGISTERED=true
    echo "🔗 Registered global command: budgetflow -> $PREFIX/bin/budgetflow"
elif [ -d "$HOME/.local/bin" ] || mkdir -p "$HOME/.local/bin" 2>/dev/null; then
    ln -sf "$(pwd)/bin/budgetflow.js" "$HOME/.local/bin/budgetflow" 2>/dev/null || true
    CLI_REGISTERED=true
fi

# Also attempt npm link for global registration
npm link --silent 2>/dev/null || true

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║               🎉 INSTALLATION COMPLETE! 🎉                    ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  BudgetFlow CLI Commands are ready to use:                    ║"
echo "║                                                               ║"
echo "║    budgetflow          - Start Hub server (runs in background)║"
echo "║    budgetflow stop     - Stop the running server              ║"
echo "║    budgetflow restart  - Restart the server                   ║"
echo "║    budgetflow status   - View active status & local Wi-Fi IP  ║"
echo "║    budgetflow logs -f  - Follow live server output logs       ║"
echo "║    budgetflow wipe     - Factory reset & wipe data            ║"
echo "║    budgetflow doctor   - Run system health diagnostics        ║"
echo "║                                                               ║"
echo "║  Default Port: 5050 (or PORT=3000 budgetflow)                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

