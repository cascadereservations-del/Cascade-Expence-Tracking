# Cascade Expense Capture v6.5 — Proxy-first + Provenance

## Option B (recommended): Apps Script Web App Proxy
No Cloud Console. The front-end posts to your **Apps Script Web App** which reads/writes Sheets and Drive.

### Deploy (one-click CLASP)
1. Install Node 18+. In this folder run:

```bash
# First time
npm i -g @google/clasp
npx clasp login --no-localhost

# Create new Apps Script project as Web App
cd proxy_clasp
npx clasp create --type webapp --title "Cascade Expense Proxy" --rootDir .
# This prints a new scriptId; it's also saved to .clasp.json

# Push code and deploy
npx clasp push
npx clasp deploy -d "v1"
# Copy the Web App URL from the deployment output.
```

2. In **index.html** → Settings:
   - Toggle **Use Proxy Web App** ON (default).
   - Paste the **Proxy URL** from the deployment.
   - Paste your **Spreadsheet ID** and optional **Drive Folder ID**.
   - Click **Setup Sheet** to lay down headers + validation.
   - Use **Run Diagnostics**/**Ping Proxy** to verify.

> You can also paste the code directly in **Extensions → Apps Script** and click **Deploy → Web app**.

## Field Provenance
The Form shows colored badges next to **Date/Vendor/Category/Amount**:
- **H** = Heuristic (from OCR text)
- **R** = Rule matched
- **AI** = AI categorization via proxy

## Files
- `index.html` – full app (proxy-first).
- `apps_script/WebApp.gs` – Web App backend (same as in proxy_clasp).
- `apps_script/Code.gs` – optional spreadsheet menu helpers.
- `proxy_clasp/` – CLASP-ready project (`appsscript.json`, `WebApp.gs`).
