#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/proxy_clasp"
if ! command -v clasp >/dev/null 2>&1; then
  echo "Installing @google/clasp..."; npm i -g @google/clasp
fi
if ! clasp status >/dev/null 2>&1; then
  echo "Login to Google (one-time)"; clasp login --no-localhost
fi
if [ ! -f ".clasp.json" ] || [ "$(jq -r .scriptId .clasp.json 2>/dev/null)" = "" ]; then
  echo "Creating new Apps Script project..."
  clasp create --type webapp --title "Cascade Expense Proxy" --rootDir .
fi
echo "Pushing code..."; clasp push
echo "Deploying..."; clasp deploy -d "auto-deploy"
echo "Done. Use 'clasp deployments' to see the Web App URL."
