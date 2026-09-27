#!/usr/bin/env bash
# ==============================================================================
# BudgetFlow Family Hub - Quick Launcher
# ==============================================================================

PORT="${PORT:-5050}"

echo "Starting BudgetFlow Family Hub on port $PORT..."
node server/server.js
