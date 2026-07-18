@echo off
title Veritas Chain - Pharmaceutical Integrity Ledger
color 0F

echo.
echo  ============================================================
echo   VERITAS CHAIN - Pharmaceutical Integrity Ledger
echo   Decentralized Supply Chain + Counterfeit Detection
echo  ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo.
    echo  Please install Node.js v18+ from https://nodejs.org
    echo  Then run this file again.
    echo.
    pause
    exit /b 1
)

REM Show Node version
echo  [OK] Node.js detected:
for /f "delims=" %%i in ('node -v') do set NODE_VER=%%i
echo       %NODE_VER%
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo  [SETUP] First run detected. Installing dependencies...
    echo          This may take a few minutes...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo  [ERROR] Failed to install dependencies.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Dependencies installed successfully.
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo  [WARNING] No .env file found. Creating from template...
    (
        echo NEXT_PUBLIC_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
    ) > .env
    echo  [OK] .env file created.
    echo.
)

REM Build the project
echo  [BUILD] Compiling the application...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Build failed. See errors above.
    echo.
    pause
    exit /b 1
)
echo.
echo  [OK] Build successful.
echo.

REM Start the production server
echo  ============================================================
echo   Starting Veritas Chain on http://localhost:3000
echo  ============================================================
echo.
echo  Press Ctrl+C to stop the server.
echo.

call npm start

echo.
echo  Server stopped.
pause
