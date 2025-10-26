# 🚨 QUICK FIX FOR CORS ERRORS

## The Problem
Your Apps Script doesn't handle CORS preflight requests (OPTIONS).

## The 2-Minute Fix

### 1. Replace Apps Script Code
- Open: https://script.google.com
- Delete all code in `WebApp.gs`
- Copy from: `apps_script/WebApp.gs` (this package)
- Paste and Save

### 2. Redeploy
- Deploy → New deployment → Web app
- Execute as: **Me**
- Who has access: **Anyone** ← CRITICAL
- Deploy → Copy URL

### 3. Update Settings
- Paste URL in index.html Settings → Proxy URL
- Add Spreadsheet ID
- Save → Ping Proxy → Setup Sheet

## Done! ✅

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## Test It Works
```bash
curl -X OPTIONS https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
# Should return 200 OK with CORS headers
```

## What Changed
- Added `doOptions()` function
- Added proper CORS headers
- Added `doGet()` health check
- Better error messages
