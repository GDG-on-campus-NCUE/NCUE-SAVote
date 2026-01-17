#!/usr/bin/env bash
set -euo pipefail

# SAVote Production Deployment Script
# Integrates: Circom install, JWT key gen, ZK build, Nginx setup, Docker start, DB migration.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$REPO_ROOT/packages/circuits/bin:$PATH"

# --- Helper Functions ---

log() { echo -e "\033[0;32m[DEPLOY] $1\033[0m"; }
warn() { echo -e "\033[0;33m[WARN] $1\033[0m"; }
err() { echo -e "\033[0;31m[ERROR] $1\033[0m"; exit 1; }

check_cmd() { command -v "$1" >/dev/null || err "$1 is required but not installed."; }

# --- 1. Pre-flight Checks ---

log "Checking environment..."
check_cmd docker
check_cmd openssl
check_cmd curl
check_cmd node
check_cmd pnpm

# Load env vars from apps/api/.env if it exists
ENV_FILE="$REPO_ROOT/apps/api/.env"
if [[ -f "$ENV_FILE" ]]; then
  log "Loading environment from $ENV_FILE"
  # Export variables from .env file
  set -a
  source "$ENV_FILE"
  set +a
fi

# Check required env vars
: "${OIDC_ISSUER:?OIDC_ISSUER is required}"
: "${OIDC_CLIENT_ID:?OIDC_CLIENT_ID is required}"
: "${OIDC_CLIENT_SECRET:?OIDC_CLIENT_SECRET is required}"
: "${OIDC_CALLBACK_URL:?OIDC_CALLBACK_URL is required}"
: "${CORS_ORIGIN:?CORS_ORIGIN is required}"
: "${DATABASE_URL:?DATABASE_URL is required}"

# --- 2. Install Circom (if missing) ---

CIRCOM_BIN="$REPO_ROOT/packages/circuits/bin/circom"
if [[ ! -x "$CIRCOM_BIN" ]]; then
  log "Circom binary not found. Installing..."
  mkdir -p "$(dirname "$CIRCOM_BIN")"
  OS_NAME="$(uname -s)"
  case "$OS_NAME" in
    Linux)  URL="https://github.com/iden3/circom/releases/download/v2.2.3/circom-linux-amd64" ;;
    Darwin) URL="https://github.com/iden3/circom/releases/download/v2.2.3/circom-macos-amd64" ;;
    *)      err "Unsupported OS for auto-install: $OS_NAME. Please install circom manually." ;;
  esac
  curl -L -o "$CIRCOM_BIN" "$URL"
  chmod +x "$CIRCOM_BIN"
  log "Circom installed to $CIRCOM_BIN"
fi

# --- 3. Generate JWT Keys (if missing) ---

SECRETS_DIR="$REPO_ROOT/apps/api/secrets"
if [[ ! -f "$SECRETS_DIR/jwt-private.key" ]]; then
  log "Generating JWT keys..."
  mkdir -p "$SECRETS_DIR"
  openssl genpkey -algorithm RSA -out "$SECRETS_DIR/jwt-private.key" -pkeyopt rsa_keygen_bits:2048
  openssl rsa -pubout -in "$SECRETS_DIR/jwt-private.key" -out "$SECRETS_DIR/jwt-public.key"
  log "JWT keys generated in $SECRETS_DIR"
fi

# --- 4. Build Project (Circuits & Web) ---

log "Installing dependencies..."
pnpm install

log "Building ZK circuits..."
pnpm --filter circuits build

log "Building Web Frontend..."
pnpm --filter web build

# Copy verification key to crypto-lib (for API usage)
# Note: crypto-lib is updated to look in build/ but copying ensures it's there if logic changes
cp "$REPO_ROOT/packages/circuits/build/verification_key.json" "$REPO_ROOT/packages/crypto-lib/src/verification_key.json" || true

# --- 5. Nginx Configuration ---

NGINX_CONF_SRC="$REPO_ROOT/nginx/savote-https.conf"
NGINX_CONF_DST="/etc/nginx/sites-available/savote.conf"

if [[ -d "/etc/nginx" ]]; then
  log "Configuring Nginx..."
  # Use sudo if not root
  SUDO=""
  [ "$(id -u)" -ne 0 ] && SUDO="sudo"
  
  $SUDO cp "$NGINX_CONF_SRC" "$NGINX_CONF_DST"
  $SUDO ln -sf "$NGINX_CONF_DST" /etc/nginx/sites-enabled/savote.conf
  
  if $SUDO nginx -t; then
    $SUDO systemctl reload nginx
    log "Nginx reloaded."
  else
    warn "Nginx config test failed. Please check $NGINX_CONF_DST manually."
  fi
else
    warn "Nginx directory not found. Skipping Nginx setup (assuming Docker-only or manual proxy)."
fi

# --- 6. Start Docker Services ---

log "Starting Docker services..."
pushd "$REPO_ROOT" >/dev/null
docker compose -f docker-compose.yml up -d --build
popd >/dev/null

# --- 7. Database Migration & Seed ---

log "Running database migrations..."
API_SERVICE="savote-api"
if docker compose ps --services | grep -q "api"; then API_SERVICE="api"; fi

# Wait for DB to be ready (simple retry)
RETRIES=5
while [ $RETRIES -gt 0 ]; do
  if docker compose exec "$API_SERVICE" pnpm prisma migrate deploy; then
    break
  fi
  log "Waiting for DB..."
  sleep 5
  RETRIES=$((RETRIES-1))
done

docker compose exec "$API_SERVICE" pnpm prisma db seed || warn "Seeding failed (might be already seeded)."

# --- 8. SSL Reminder ---

if [[ ! -f "/etc/letsencrypt/live/election.ncuesa.org.tw/fullchain.pem" ]]; then
  warn "SSL certificates not found."
  warn "Run 'bash scripts/setup-ssl.sh' to generate them using Certbot."
fi

log "Deployment completed successfully!"
