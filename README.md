# Cascade Expense Capture — v6.3

**New**
- **Smart Parse (AI)**: heuristic + rules + Gemini to extract Date/Vendor/Amount and choose the best **Category** (from a controlled taxonomy).
- **Sheet Setup**: one-click **Setup Sheet** button (Settings) to create headers, freeze row 1, auto-size, add **Category data validation**, and numeric/date formats.
- **Auto AI on Add** (toggle) and **AI Suggest** button on the Form.
- **Quick Guides toggle** in Settings (show/hide everywhere).

**Workflow**
1) Capture → Start OCR → (optional) **Smart Parse** → **Send to Form**.  
2) Form → **AI Suggest** (if needed) → **Add** → auto-append to Google Sheets.  
3) Batch → validate/dedupe/export → optional Drive dataset upload.  
4) Weekly Drive backup runs automatically when due.

**Setup Sheet (what it does)**
- Creates `SheetName` (if missing) and `Meta` sheet with category list.
- Writes header row (26 columns exactly, aligned with the app’s schema).
- Freezes row 1, auto-resizes, sets formats, and adds Category validation (dropdown from taxonomy).

**Apps Script (optional)**
- `apps_script/Code.gs` adds a custom **Cascade Tools** menu with “Normalize New Rows” and “Recompute Categories” helpers if you want extra spreadsheet-side controls.

**Security**
- All data lives in your browser until you export or upload (Drive/Sheets).

