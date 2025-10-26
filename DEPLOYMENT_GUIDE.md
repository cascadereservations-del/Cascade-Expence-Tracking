# Cascade Expense Capture v6.5 - CORS Fix & Deployment Guide

## 🔴 CRITICAL: The CORS Issue Explained

The CORS errors you're seeing happen because:
1. Apps Script Web Apps require OPTIONS preflight handling
2. The deployment must be configured correctly
3. The script needs proper permissions

## ✅ COMPLETE FIX (5 Minutes)

### Step 1: Delete Old Deployment
1. Open your Apps Script project: https://script.google.com
2. Click **Deploy** → **Manage deployments**
3. Click the **three dots** (⋮) next to your current deployment
4. Click **Archive** (or **Delete**)

### Step 2: Upload Fixed Code
1. In Apps Script editor, **DELETE** all existing code in `WebApp.gs`
2. **Copy ALL code** from `apps_script/WebApp.gs` (the fixed version)
3. **Paste** into Apps Script editor
4. Click **💾 Save** (Ctrl+S)

### Step 3: Create New Deployment
1. Click **Deploy** → **New deployment**
2. Click the **gear icon** ⚙️ next to "Select type"
3. Select **Web app**
4. Configure deployment:
   - **Description**: `Cascade Proxy v6.5.1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` ← **CRITICAL!**
5. Click **Deploy**
6. Click **Authorize access**
7. Select your Google account
8. Click **Advanced** → **Go to [Project Name] (unsafe)**
9. Click **Allow**
10. **COPY** the Web App URL (ends with `/exec`)

### Step 4: Update Your HTML File
1. Open `index.html` in text editor
2. Go to **Settings tab** in the browser
3. Paste the **new Web App URL** into the "Proxy URL" field
4. Enter your **Spreadsheet ID**
5. Click **Save Settings**
6. Click **Ping Proxy** to test

### Step 5: Setup Sheet
1. Click **Setup Sheet** button
2. Wait for "Sheet setup ✓" message
3. Click **Run Diagnostics** to verify everything works

## 🎯 Expected Results

After completing these steps:
- ✅ Ping Proxy returns: `{"ok":true,"time":"2025-10-26T..."}`
- ✅ Setup Sheet creates headers and validation
- ✅ Add button appends records to Sheet
- ✅ No CORS errors in browser console

## 🔧 Troubleshooting

### Error: "Proxy URL not set"
→ Make sure you pasted the full URL ending with `/exec`

### Error: "Missing sheetId"
→ Enter your Spreadsheet ID in Settings

### Error: "Exception: You do not have permission"
→ Re-run Step 3 and make sure you selected **Anyone** for access

### Error: Still getting CORS errors
→ Make sure you archived/deleted the old deployment
→ Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Error: "Script function not found: doOptions"
→ Make sure you copied the ENTIRE fixed WebApp.gs code

## 📋 Verification Checklist

- [ ] Old deployment archived/deleted
- [ ] Fixed WebApp.gs code pasted completely
- [ ] New deployment created with "Anyone" access
- [ ] Authorization completed successfully
- [ ] Web App URL copied and pasted into Settings
- [ ] Spreadsheet ID entered in Settings
- [ ] Settings saved
- [ ] Ping Proxy returns success
- [ ] Setup Sheet completes without errors
- [ ] Test record appends successfully

## 🚀 What's Fixed in v6.5.1

### CORS Issues
✅ Added `doOptions()` function for preflight requests
✅ Added `doGet()` for health checks
✅ Proper CORS headers on all responses
✅ Better error messages with CORS headers

### Improved Error Handling
✅ Clearer error messages
✅ Better validation
✅ Success messages included
✅ Version tracking

### Better User Experience
✅ Detailed response messages
✅ Health check endpoint
✅ Improved diagnostics

## 📞 Still Having Issues?

1. **Check Browser Console**: Press F12 → Console tab
2. **Look for errors**: Should show the exact problem
3. **Check Apps Script Logs**: In Apps Script editor → Executions tab
4. **Verify URL**: Should end with `/exec` not `/dev`

## 🎓 Understanding the Fix

**Why OPTIONS is needed:**
When your browser makes a POST request to a different domain (Apps Script), it first sends an OPTIONS "preflight" request to check if CORS is allowed. Without `doOptions()`, this fails and blocks the actual POST request.

**Why "Anyone" access:**
Your HTML file runs on your local computer or GitHub Pages, which is a different domain than Apps Script. Setting access to "Anyone" allows cross-origin requests.

**Security Note:**
Even with "Anyone" access, users still need your Spreadsheet ID to access YOUR data. The Apps Script just acts as a proxy - it doesn't expose any data without the correct Sheet ID.

---

## ✨ Next Steps After Setup

1. **Test OCR**: Upload a receipt image
2. **Test AI Categorize**: Add a record and use Smart Parse
3. **Test Export**: Use Export JSON/CSV buttons
4. **Test Drive Upload**: Upload a dataset to Google Drive

Enjoy your fixed Cascade Expense Capture! 🎉
