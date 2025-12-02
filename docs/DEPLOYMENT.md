# SAVote 佈署指南（Production Only）

本文件為「單一入口」的正式佈署指南，僅保留實際上線所需的步驟與指令。開發與測試流程已移除；如需查閱詳細規格與背景，請參考：

- SAML 詳細規格與流程：`specs/001-saml-sso-auth/`
- 其他參考文件：`docs/`（database-setup.md、saml-configuration.md、ui-design-spec.md）

---

## 1. 前置需求

- Linux 伺服器（含 `bash`、`curl`、`docker`、`docker compose`）
- 網域與憑證（可用 `scripts/setup-ssl.sh` 或自備憑證）
- Postgres 資料庫（由 docker-compose 管理）

---

## 2. 佈署指令（單一腳本）

請使用：`scripts/deploy.sh`

```bash
bash scripts/deploy.sh
```

此腳本會完成：
- 檢查必要工具與環境變數
- 建置 ZK 電路與產出驗證金鑰
- 啟動/更新後端 API 與前端 Web（Docker Compose 生產版）
- 初始化資料庫（Prisma migration + seed）
- 更新 Nginx 設定與憑證（如需要）

---

## 3. 必要環境變數（`.env`）

- `SAML_ENTRY_POINT`：IdP 入口點
- `SAML_ISSUER`：SP EntityID（metadata issuer）
- `SAML_CALLBACK_URL`：`https://<domain>/auth/saml/callback`
- `CORS_ORIGIN`：前端站台，例如 `https://<web-domain>`
- `DATABASE_URL`：Postgres 連線字串
- 其他與部署環境相關的變數（見 `docker-compose.yml` 和 `apps/api/.env` 範例）

---

## 4. 產出與檔案位置

- ZK 電路產出：`packages/circuits/build/`
  - `main.wasm`
  - `main_final.zkey`
  - `verification_key.json`
- 後端/前端容器：依 `docker-compose.yml` 啟動
- Nginx 設定：`nginx/`（`savote.conf` 或 `savote-https.conf`）

---

## 5. 常見問題（Production）

- SAML 驗簽失敗：確認 `SAML_CERT` 與 IdP 憑證一致、時間同步正確。
- 容器啟動失敗：確認 `DATABASE_URL`、`CORS_ORIGIN` 與檔案路徑無誤。
- 電路建置失敗：伺服器上需可存取 `https://github.com/iden3/circom/releases`，或預先放置 `packages/circuits/bin/circom`。

---

## 6. 維運建議

- 將 `scripts/deploy.sh` 納入 CI/CD（例如手動或 pipeline 觸發）
- 版本升級時，先在 staging 執行同腳本，確認風險後再上線
