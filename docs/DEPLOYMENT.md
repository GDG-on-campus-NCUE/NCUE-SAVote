# SAVote 佈署指南（Production Only）

本文件為正式佈署指南。

---

## 1. 前置需求

- Linux 伺服器
- Docker & Docker Compose
- Node.js & pnpm

---

## 2. 佈署指令

請使用：`scripts/deploy.sh`

```bash
sudo ./scripts/deploy.sh
```

此腳本會：
- 載入 `.env` 設定。
- 建置 ZK 電路 (`packages/circuits`)。
- 建置前端 (`apps/web`) 與後端 (`apps/api`)。
- 執行資料庫遷移 (`prisma migrate`)。

---

## 3. 必要環境變數 (`apps/api/.env`)

**OIDC 設定 (NCUE):**
- `OIDC_ISSUER`: `https://sso.ncuesa.org.tw/webman/sso/.well-known/openid-configuration`
- `OIDC_CLIENT_ID`: Client ID
- `OIDC_CLIENT_SECRET`: Client Secret
- `OIDC_CALLBACK_URL`: `https://<domain>/auth/callback`

**系統設定:**
- `DATABASE_URL`: Postgres 連線字串
- `CORS_ORIGIN`: 前端網域
- `JWT_PRIVATE_KEY_PATH`: `./secrets/jwt-private.key`

---

## 4. 檔案位置

- **ZK Artifacts:** `apps/web/public/zk/` (wasm, zkey)
- **Keys:** `apps/api/secrets/` (JWT keys)
- **Logs:** Docker logs