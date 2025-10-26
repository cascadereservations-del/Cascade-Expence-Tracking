#!/usr/bin/env bash
# Cascade Expense Capture - Fixed Proxy Deployment Script
set -euo pipefail

echo "🚀 Cascade Expense Capture - Proxy Deployment"
echo "=============================================="
echo ""

cd "$(dirname "$0")/proxy_clasp"

# Check if clasp is installed
if ! command -v clasp >/dev/null 2>&1; then
  echo "📦 Installing @google/clasp..."
  npm install -g @google/clasp
fi

# Check if logged in
if ! clasp status >/dev/null 2>&1; then
  echo "🔐 Please login to Google (one-time setup)"
  echo "Choose: Login with localhost (recommended)"
  clasp login --no-localhost
fi

# Create or update project
if [ ! -f ".clasp.json" ] || [ "$(jq -r .scriptId .clasp.json 2>/dev/null)" = "" ]; then
  echo "📝 Creating new Apps Script project..."
  clasp create --type webapp --title "Cascade Expense Proxy v6.5.1" --rootDir .
  echo "✅ Project created!"
else
  echo "✅ Using existing project: $(jq -r .scriptId .clasp.json)"
fi

echo ""
echo "📤 Pushing code to Apps Script..."
clasp push --force

echo ""
echo "🚀 Creating deployment..."
DEPLOYMENT_ID=$(clasp deploy --description "v6.5.1 - CORS Fixed" | grep -oP 'AKfycb[a-zA-Z0-9_-]+' | head -1)

if [ -n "$DEPLOYMENT_ID" ]; then
  echo ""
  echo "✅ Deployment successful!"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 COPY THIS WEB APP URL:"
  echo ""
  echo "https://script.google.com/macros/s/$DEPLOYMENT_ID/exec"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📝 Next Steps:"
  echo "1. Copy the URL above"
  echo "2. Open index.html in your browser"
  echo "3. Go to Settings tab"
  echo "4. Paste into 'Proxy URL' field"
  echo "5. Add your Spreadsheet ID"
  echo "6. Click 'Save Settings'"
  echo "7. Click 'Ping Proxy' to test"
  echo "8. Click 'Setup Sheet' to initialize"
  echo ""
  echo "✨ Done! Your proxy is ready to use."
else
  echo "❌ Deployment failed. Please check the output above."
  exit 1
fi
