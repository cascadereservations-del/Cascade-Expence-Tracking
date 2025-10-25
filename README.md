# Expense Data Capture (Frontend-Only) — with Tests

## GitHub Pages
- Push this folder to a repo and enable **GitHub Pages** (deploy from `/`).
- App entry: `index.html`
- Browser unit tests page: `tests/browser/index.html`

## Settings (in app)
- Default Drive Folder ID: paste from your Google Drive folder URL.
- Google Client ID: OAuth Web client (Drive scope: `drive.file`).
- Gemini API Key: optional (for LLM parsing).

## Dev & CI (Playwright E2E)
```bash
npm i
npm run test:e2e
```
CI is configured in `.github/workflows/ci.yml` to run Playwright against a simple static server.

## Notes
- OCR is client-side via Tesseract; PDFs use pdf.js text layer first.
- LLM is off unless explicitly enabled in Settings.
