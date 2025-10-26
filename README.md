# Cascade Auth Module (Drop‑in)

This bundle de-couples Google sign-in/Drive from your app. You can switch between:

- **GIS Popup (recommended for GitHub Pages)** — no redirect URI, avoids `redirect_uri_mismatch`
- **No‑Google Fallback** — works offline and simply **downloads** files locally instead of Drive

## Files
```
auth/
  README.md
  config.example.json
  gis_popup.js
  drive_upload.js
  fallback_local.js
```

## How to wire it up (SPA on GitHub Pages)
1) **Create a real config.json** next to these files:
   ```json
   {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
     "scopes": ["https://www.googleapis.com/auth/drive.file"]
   }
   ```
   - In Google Cloud → OAuth Client (type: **Web application**):
     - **Authorized JavaScript origins**: `https://cascadereservations-del.github.io`
     - **Authorized redirect URIs**: *(none needed for popup flow)*

2) **Include the module** in your page (before your app code):
   ```html
   <script defer src="./auth/gis_popup.js"></script>
   <script defer src="./auth/drive_upload.js"></script>
   ```

3) **Initialize and sign-in when needed**:
   ```html
   <script>
     window.CI = window.CI || {};
     CI.auth = new GooglePopupAuth('./auth/config.json'); // path to your config
     // Example: document.querySelector('#signIn').onclick = ()=> CI.auth.signIn();
   </script>
   ```

4) **Upload to Drive** (after sign-in):
   ```js
   // await CI.auth.ensureToken();
   // const token = CI.auth.getAccessToken();
   // const file = await DriveUpload.uploadString(token, 'example.json', 'application/json', JSON.stringify({ok:true}), /*optionalFolderId*/ null);
   ```

5) **No‑Google mode** (for offline or while credentials are not ready):
   ```html
   <script defer src="./auth/fallback_local.js"></script>
   <script>
     // Fallback usage: FallbackLocal.downloadString('example.json', 'application/json', JSON.stringify({ok:true}));
   </script>
   ```

## Why this fixes your error
- The **popup** flow **does not use** `redirect_uri`, so Google never checks that field → no `redirect_uri_mismatch`.
- You only need to set **Authorized JavaScript origins** to your GitHub Pages origin.

## Optional: If you *must* use redirect/code flow
Create a callback page at:
```
https://cascadereservations-del.github.io/Cascade-Expence-Tracking/oauth/callback.html
```
…and add that exact URL under **Authorized redirect URIs**. For pure front-end apps, Google recommends **popup** instead.

