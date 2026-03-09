#!/usr/bin/env bash
# ==============================================================================
# SAVote 自動化初始化與部署腳本
# ==============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
export PATH="$REPO_ROOT/packages/circuits/bin:$PATH"

log() { echo -e "\033[0;32m[DEPLOY] $1\033[0m"; }
err() { echo -e "\033[0;31m[ERROR] $1\033[0m"; exit 1; }

check_cmd() { command -v "$1" >/dev/null || err "$1 未安裝，請先安裝。"; }

log "正在檢查環境..."
check_cmd docker
check_cmd curl

# 載入環境變數
if [[ -f "$REPO_ROOT/apps/api/.env" ]]; then
  log "載入環境變數..."
  set -a
  source "$REPO_ROOT/apps/api/.env"
  set +a
else
  err "找不到 apps/api/.env，請先從 .env.example 複製並修改。"
fi

# --- 1. 安裝 Circom ---
CIRCOM_BIN="$REPO_ROOT/packages/circuits/bin/circom"
if [[ ! -x "$CIRCOM_BIN" ]]; then
  log "安裝 Circom 編譯器..."
  mkdir -p "$(dirname "$CIRCOM_BIN")"
  OS_NAME="$(uname -s)"
  case "$OS_NAME" in
    Linux)  URL="https://github.com/iden3/circom/releases/download/v2.2.3/circom-linux-amd64" ;;
    Darwin) URL="https://github.com/iden3/circom/releases/download/v2.2.3/circom-macos-amd64" ;;
    *)      err "不支援的作業系統: $OS_NAME" ;;
  esac
  curl -L -o "$CIRCOM_BIN" "$URL"
  chmod +x "$CIRCOM_BIN"
fi

# --- 2. 產生 JWT RSA 密鑰 ---
log "檢查並產生 JWT RSA 密鑰對..."
if command -v pnpm >/dev/null; then
  # 如果還沒安裝 node_modules，先安裝以執行腳本
  if [[ ! -d "$REPO_ROOT/apps/api/node_modules" ]]; then
    log "安裝後端依賴以執行密鑰產生腳本..."
    pnpm install --filter api
  fi
  # 執行 Node.js 密鑰產生腳本 (內部會檢查有效性)
  pnpm --filter api gen-keys
else
  err "pnpm 未安裝，無法產生密鑰對。"
fi

# --- 3. 建置 ZK 電路 ---
log "建置 ZK 電路 (這可能需要一點時間)..."
if command -v pnpm >/dev/null; then
  pnpm install
  pnpm --filter circuits build
  cp "$REPO_ROOT/packages/circuits/build/verification_key.json" "$REPO_ROOT/packages/crypto-lib/src/verification_key.json" || true
else
  log "略過電路建置 (未安裝 pnpm)，將直接嘗試啟動 Docker。"
fi

# --- 4. 啟動服務 ---
log "啟動 Docker 服務 (自動執行遷移與初始化)..."
docker compose up -d --build

log "部署完成！"
log "投票入口: ${CORS_ORIGIN:-http://localhost:8080}"
log "管理後台: ${CORS_ORIGIN:-http://localhost:8080}/admin"
