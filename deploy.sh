#!/usr/bin/env bash
# ==============================================================================
# SAVote 自動化部署腳本 (Production Deployment Script)
#
#   整合了 Circom 安裝、JWT 金鑰生成、零知識電路 (ZK Circuits) 建置、
#   Web 前端建置、Nginx 設定配置、Docker 服務啟動以及資料庫遷移。
#
# 注意事項: 請確保執行此腳本前已設定好 apps/api/.env 相關環境變數。
# ==============================================================================

# 設定 Bash 嚴格模式
# -e: 若指令執行失敗 (Exit Code != 0)，立即中止腳本。
# -u: 使用未定義的變數視為錯誤。
# -o pipefail: Pipeline (|) 中若有指令失敗，則整行回傳失敗狀態。
set -euo pipefail

# 取得專案根目錄的絕對路徑，確保後續路徑參照正確
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# 將 Circom binary 加入 PATH，方便後續呼叫
export PATH="$REPO_ROOT/packages/circuits/bin:$PATH"

# --- 輔助函式 ---
log() { echo -e "\033[0;32m[DEPLOY] $1\033[0m"; }
warn() { echo -e "\033[0;33m[WARN] $1\033[0m"; }
err() { echo -e "\033[0;31m[ERROR] $1\033[0m"; exit 1; }

# 檢查指令是否存在，若不存在則報錯
check_cmd() { command -v "$1" >/dev/null || err "$1 is required but not installed."; }

# --- 環境前置檢查 ---
log "Checking environment..."
check_cmd docker
check_cmd openssl
check_cmd curl
check_cmd node
check_cmd pnpm

# 載入 API 環境變數 (apps/api/.env)
ENV_FILE="$REPO_ROOT/apps/api/.env"
if [[ -f "$ENV_FILE" ]]; then
  log "Loading environment from $ENV_FILE"
  # 使用 set -a 自動匯出 source 的變數
  set -a
  source "$ENV_FILE"
  set +a
fi

# 驗證必要環境變數是否已設定
: "${OIDC_ISSUER:?OIDC_ISSUER is required}"
: "${OIDC_CLIENT_ID:?OIDC_CLIENT_ID is required}"
: "${OIDC_CLIENT_SECRET:?OIDC_CLIENT_SECRET is required}"
: "${OIDC_CALLBACK_URL:?OIDC_CALLBACK_URL is required}"
: "${CORS_ORIGIN:?CORS_ORIGIN is required}"
: "${DATABASE_URL:?DATABASE_URL is required}"

# --- 安裝 Circom 編譯器  ---
CIRCOM_BIN="$REPO_ROOT/packages/circuits/bin/circom"
if [[ ! -x "$CIRCOM_BIN" ]]; then
  log "Circom binary not found. Installing... "
  mkdir -p "$(dirname "$CIRCOM_BIN")"
  OS_NAME="$(uname -s)"
  
  # 根據作業系統選擇下載連結 (Linux/MacOS)
  case "$OS_NAME" in
    Linux)  URL="https://github.com/iden3/circom/releases/download/v2.2.3/circom-linux-amd64" ;;
    Darwin) URL="https://github.com/iden3/circom/releases/download/v2.2.3/circom-macos-amd64" ;;
    *)      err "Unsupported OS for auto-install: $OS_NAME. Please install circom manually." ;;
  esac
  
  curl -L -o "$CIRCOM_BIN" "$URL"
  chmod +x "$CIRCOM_BIN"
  log "Circom installed to $CIRCOM_BIN"
fi

# --- 產生 JWT 金鑰對 ---
SECRETS_DIR="$REPO_ROOT/apps/api/secrets"
# 若私鑰不存在，則自動產生 RSA 2048 位元金鑰對
if [[ ! -f "$SECRETS_DIR/jwt-private.key" ]]; then
  log "Generating JWT keys... (產生 JWT 金鑰)"
  mkdir -p "$SECRETS_DIR"
  # 產生私鑰
  openssl genpkey -algorithm RSA -out "$SECRETS_DIR/jwt-private.key" -pkeyopt rsa_keygen_bits:2048
  # 從私鑰導出公鑰
  openssl rsa -pubout -in "$SECRETS_DIR/jwt-private.key" -out "$SECRETS_DIR/jwt-public.key"
  log "JWT keys generated in $SECRETS_DIR"
fi

# --- 建置專案 ---
log "Installing dependencies..."
pnpm install

log "Building ZK circuits..."
# 僅針對 circuits package 執行 build
pnpm --filter circuits build

log "Building Web Frontend..."
# 僅針對 web package 執行 build
pnpm --filter web build

# 複製驗證金鑰 (Verification Key) 到 crypto-lib，確保 API 層能夠存取到最新的驗證金鑰
cp "$REPO_ROOT/packages/circuits/build/verification_key.json" "$REPO_ROOT/packages/crypto-lib/src/verification_key.json" || true

# --- Nginx 設定 ---
NGINX_CONF_SRC="$REPO_ROOT/nginx/savote.conf"
NGINX_CONF_DST="/etc/nginx/sites-available/savote.conf"

if [[ -d "/etc/nginx" ]]; then
  log "Configuring Nginx... (設定 Nginx)"
  
  # 檢查是否需要 sudo 權限
  SUDO=""
  [ "$(id -u)" -ne 0 ] && SUDO="sudo"
  
  # 複製設定檔並建立符號連結 (Symlink)
  $SUDO cp "$NGINX_CONF_SRC" "$NGINX_CONF_DST"
  $SUDO ln -sf "$NGINX_CONF_DST" /etc/nginx/sites-enabled/savote.conf
  
  # 測試 Nginx 設定檔語法是否正確
  if $SUDO nginx -t; then
    $SUDO systemctl reload nginx
    log "Nginx reloaded."
  else
    warn "Nginx config test failed. Please check $NGINX_CONF_DST manually."
  fi
else
    warn "Nginx directory not found. Skipping Nginx setup (assuming Docker-only or manual proxy)."
fi

# --- 啟動 Docker 服務 ---

log "Starting Docker services..."
pushd "$REPO_ROOT" >/dev/null
# 啟動並重新建置容器，背景執行
docker compose -f docker-compose.yml up -d --build
popd >/dev/null

# --- 資料庫遷移與種子資料 ---

log "Running database migrations... "
API_SERVICE="savote-api"
# 檢查 docker compose 中 API 服務的名稱
if docker compose ps --services | grep -q "api"; then API_SERVICE="api"; fi

# 等待資料庫就緒
RETRIES=5
while [ $RETRIES -gt 0 ]; do
  # 嘗試執行 migration
  if docker compose exec "$API_SERVICE" pnpm prisma migrate deploy; then
    break
  fi
  log "Waiting for DB... "
  sleep 5
  RETRIES=$((RETRIES-1))
done

# 執行 Seed 資料填充 (若失敗代表已填充過，僅顯示警告)
docker compose exec "$API_SERVICE" pnpm prisma db seed || warn "Seeding failed (might be already seeded)."

# --- SSL 憑證提醒 ---
if [[ ! -f "/etc/letsencrypt/live/election.ncuesa.org.tw/fullchain.pem" ]]; then
  warn "SSL certificates not found."
  warn "Run 'bash scripts/setup-ssl.sh' to generate them using Certbot."
fi

log "Deployment completed successfully!"