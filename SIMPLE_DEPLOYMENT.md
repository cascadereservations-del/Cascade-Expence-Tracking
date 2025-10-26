# 🎯 SIMPLE DEPLOYMENT GUIDE - No Confusion

## What You're Deploying

**A Web App proxy** that fixes CORS errors so your HTML file can talk to Google Sheets.

## What You Need

**1 file:** `WebApp.gs` (from the fix package)

## Step-by-Step (5 Minutes)

### Step 1: Create New Apps Script Project
1. Go to https://script.google.com
2. Click **+ New project**
3. You'll see a file called `Code.gs`
4. **Rename it to `WebApp.gs`** (click the name at top)

### Step 2: Paste the Fixed Code
1. **Delete all existing code** in the editor
2. **Open** `apps_script/WebApp.gs` from the fix package
3. **Copy ALL the code** (Ctrl+A, Ctrl+C)
4. **Paste** into the Apps Script editor (Ctrl+V)
5. **Save** (Ctrl+S or click disk icon)
6. Name your project: "Cascade Expense Proxy"

### Step 3: Deploy as Web App
1. Click **Deploy** (top right)
2. Click **New deployment**
3. Click the **gear icon** ⚙️
4. Select **Web app**
5. Fill in:
   - Description: `v6.5.1 CORS Fixed`
   - Execute as: **Me (your-email@gmail.com)**
   - Who has access: **Anyone** ← CRITICAL!
6. Click **Deploy**

### Step 4: Authorize
1. Click **Authorize access**
2. Choose your Google account
3. Click **Advanced**
4. Click **Go to Cascade Expense Proxy (unsafe)**
5. Click **Allow**
6. **COPY the Web App URL** (it ends with `/exec`)

### Step 5: Configure Your App
1. Open `index.html` in your browser
2. Click **Settings** tab
3. Make sure "Use Proxy Web App" is checked ✓
4. **Paste** the Web App URL into "Proxy URL" field
5. Enter your **Spreadsheet ID** 
   - Get from your sheet URL: `docs.google.com/spreadsheets/d/[THIS_PART]`
6. Click **Save Settings**

### Step 6: Test
1. Click **Ping Proxy**
   - Should see: "Proxy OK" ✅
2. Click **Setup Sheet**
   - Should see: "Sheet setup ✓" ✅
3. Click **Run Diagnostics**
   - Should show green checkmarks ✅

### Step 7: Add Test Record
1. Go to **Form** tab
2. Fill in:
   - Date: Today
   - Category: Test
   - Amount: 100
   - Vendor: Test Vendor
3. Click **Add**
4. Check your Google Sheet
5. Should see the record! ✅

## 🎉 Done!

Your Cascade Expense Capture is now working!

## ❌ Common Mistakes to Avoid

### Mistake 1: Including Code.gs
**Problem:** You also pasted Code.gs file  
**Error:** "Cannot call SpreadsheetApp.getUi()"  
**Fix:** Delete Code.gs, keep only WebApp.gs

### Mistake 2: Wrong Access Setting
**Problem:** Set "Who has access" to "Only myself"  
**Error:** CORS errors continue  
**Fix:** Change to "Anyone"

### Mistake 3: Using Old Deployment
**Problem:** Didn't archive old deployment  
**Error:** Still getting old errors  
**Fix:** Archive old, create new deployment

### Mistake 4: Wrong URL
**Problem:** Copied wrong URL (doesn't end with /exec)  
**Error:** 404 or wrong responses  
**Fix:** Copy the Web App URL from deployment

### Mistake 5: Not Saving Settings
**Problem:** Pasted URL but didn't click Save  
**Error:** Still not working  
**Fix:** Always click Save Settings button

## 🔍 Troubleshooting

### "Proxy ping failed"
- [ ] Check URL ends with `/exec`
- [ ] Check "Who has access" is "Anyone"
- [ ] Check you saved settings
- [ ] Try hard refresh: Ctrl+Shift+R

### "Missing sheetId"
- [ ] Enter Spreadsheet ID in Settings
- [ ] Must be the long ID from URL
- [ ] Click Save Settings

### Still getting CORS errors?
- [ ] Archive old deployment
- [ ] Create fresh new deployment
- [ ] Copy NEW Web App URL
- [ ] Update Settings with new URL
- [ ] Hard refresh browser

### "Cannot call SpreadsheetApp.getUi()"
- [ ] You included Code.gs by mistake
- [ ] Delete Code.gs file
- [ ] Keep only WebApp.gs
- [ ] Redeploy

## 📋 Verification Checklist

After deployment, verify:

- [ ] Apps Script has only 1 file: WebApp.gs
- [ ] Deployment type is "Web app"
- [ ] Access is set to "Anyone"
- [ ] Web App URL ends with `/exec`
- [ ] URL pasted in Settings
- [ ] Spreadsheet ID entered
- [ ] Settings saved
- [ ] Ping Proxy returns success
- [ ] Setup Sheet completes
- [ ] Test record appears in Sheet

## 🎯 What Success Looks Like

### In Apps Script:
```
Your Project
└── WebApp.gs (only file)
    └── Deployed as Web app
        └── Anyone access
```

### In Browser:
```
Settings Tab:
✓ Use Proxy Web App (checked)
✓ Proxy URL: https://script.google.com/.../exec
✓ Spreadsheet ID: 1ABC...xyz
✓ Ping Proxy → "Proxy OK"
✓ Setup Sheet → "Sheet setup ✓"
```

### In Google Sheet:
```
Row 1: Headers (date, property, vendor, ...)
Data validation on Category column
Number formatting on Amount columns
```

## 🚀 Next Steps

1. ✅ Start capturing expenses
2. ✅ Upload receipt images for OCR
3. ✅ Use Smart Parse for categorization
4. ✅ Export data when needed
5. ✅ Backup regularly

---

**That's it! Simple, clean, working.**

If you followed these steps exactly, everything should work perfectly.

**Questions?** Check [ONOPEN_ERROR_FIX.md](computer:///mnt/user-data/outputs/ONOPEN_ERROR_FIX.md) for more details.
