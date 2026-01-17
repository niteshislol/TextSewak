@echo off
echo ====================================================
echo      Starting TextSewak-OCR System
echo ====================================================

REM Set the project root directory
set "PROJECT_ROOT=C:\Users\nites\TextSewak-OCR"

REM --- Dynamic IP Detection ---
echo Detecting Local IP Address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4" ^| find "10."') do set IP_ADDR=%%a
REM Fallback for 192.168
if "%IP_ADDR%"=="" for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4" ^| find "192.168"') do set IP_ADDR=%%a
REM Clean up whitespace
set IP_ADDR=%IP_ADDR: =%

if "%IP_ADDR%"=="" (
    echo [WARNING] Could not detect local IP. Using localhost.
    set IP_ADDR=localhost
) else (
    echo [INFO] Detected Network IP: %IP_ADDR%
)
REM ---------------------------

echo 1. Starting BNS Legal Engine (Backend)...
start "BNS Legal Engine" /D "%PROJECT_ROOT%\BNS Legal Engine" cmd /k "python app.py"

echo 2. Starting Speech/Mic Server (Offline)...
start "Speech Server" /D "%PROJECT_ROOT%\textsewakspeech" cmd /k "python offline_app.py"

echo 3. Starting Web Frontend (Client)...
start "TextSewak Client" /D "%PROJECT_ROOT%" cmd /k "npm run dev"

echo Waiting for services to initialize...
timeout /t 5 /nobreak

echo Opening Application in Browser...
if "%IP_ADDR%"=="localhost" (
    start "" "http://localhost:8080"
) else (
    start "" "http://%IP_ADDR%:8080"
)

echo.
echo ====================================================
echo   All Systems Go!
echo.
echo   [PC Access]
echo   - Local: http://localhost:8080
echo.
echo   [Mobile/Network Access]
echo   - App URL:    http://%IP_ADDR%:8080
echo   - Legal API:  http://%IP_ADDR%:5000
echo   - Speech API: http://%IP_ADDR%:5056
echo.
echo   * Ensure your mobile is on the same Wi-Fi.
echo ====================================================
echo.
echo NOTE: Do not close the popped-up terminal windows.
echo Minimize them to keep the servers running.
echo.
pause
