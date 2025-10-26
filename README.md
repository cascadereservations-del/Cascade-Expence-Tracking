# Cascade Expense Capture — v6.2

This build implements your requests:
- **Permanent Quick Guides per tab** (no button, no dismiss). Greyscale + glass effects.
- **Start OCR** button for PDFs and images → Quick Edit → **Send to Form**.
- **Automatic mode**: **Append to Google Sheets on Add** (live ops) + **Weekly Drive backup** (JSON+CSV). manual “Run Backup Now” also available.
- Mobile polish: centered headers and swipe between tabs.
- Property locked to **Cascade Hideaway_BRIA**.

## Setup
1. Open `index.html` over HTTPS or a local server.
2. Settings → add Google Client ID → **Sign in to Google**.
3. Provide **Spreadsheet ID** + **Sheet Name** and a **Drive Folder ID**.
4. Enable **Tesseract** (client OCR). Optionally **Gemini** for smarter parsing.

## Notes
- Weekly backup triggers when it’s due (7+ days since last). If not signed in, a toast offers **Run now**.
- Attachments upload to Drive and set `attachment_drive_file_id` in the form.

