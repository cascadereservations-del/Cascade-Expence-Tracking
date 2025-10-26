@echo off
REM Cascade Expense Capture - Fixed Proxy Deployment Script (Windows)
echo ============================================
echo Cascade Expense Capture - Proxy Deployment
echo ============================================
echo.

cd /d "%~dp0proxy_clasp"

REM Check if clasp is installed
where clasp >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing @google/clasp...
    call npm install -g @google/clasp
)

REM Check if logged in
clasp status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Please login to Google (one-time setup^)
    echo Choose: Login with localhost (recommended^)
    call clasp login --no-localhost
)

REM Check if project exists
if not exist .clasp.json (
    echo Creating new Apps Script project...
    call clasp create --type webapp --title "Cascade Expense Proxy v6.5.1" --rootDir .
    echo Project created!
) else (
    echo Using existing project
)

echo.
echo Pushing code to Apps Script...
call clasp push --force

echo.
echo Creating deployment...
call clasp deploy --description "v6.5.1 - CORS Fixed"

echo.
echo ============================================
echo NEXT STEPS:
echo 1. Copy the Web App URL from above
echo 2. Open index.html in your browser
echo 3. Go to Settings tab
echo 4. Paste URL into 'Proxy URL' field
echo 5. Add your Spreadsheet ID
echo 6. Click 'Save Settings'
echo 7. Click 'Ping Proxy' to test
echo 8. Click 'Setup Sheet' to initialize
echo ============================================
echo.
pause
