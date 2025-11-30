@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo   SAVote Development Environment Starter
echo ==========================================

REM Check for pnpm
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [Error] pnpm is not installed or not in PATH.
    echo Please install pnpm: npm install -g pnpm
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo [Setup] Installing dependencies...
    call pnpm install
)

REM 1. Check and create .env for API
if not exist "apps\api\.env" (
    echo [Setup] Creating apps\api\.env from example...
    copy "apps\api\.env.example" "apps\api\.env"
)

REM 2. Check and generate JWT keys
if not exist "apps\api\secrets\jwt-private.key" (
    echo [Setup] Generating JWT keys...
    if not exist "apps\api\secrets" mkdir "apps\api\secrets"
    node scripts\generate-jwt-keys.js
)

REM 3. Start Database
echo [Docker] Starting Database...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Failed to start Docker containers. Is Docker Desktop running?
    pause
    exit /b 1
)

REM 4. Wait for DB
echo [Docker] Waiting for Database to initialize...
timeout /t 5 /nobreak >nul

REM 5. Run Migrations
echo [Prisma] Running Database Migrations...
cd apps\api
call npx prisma migrate deploy
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Migration failed.
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

REM 6. Start Development Server
echo [Turbo] Starting Development Server...
echo Access the web app at http://localhost:5173
echo Access the api at http://localhost:3000
call pnpm dev
