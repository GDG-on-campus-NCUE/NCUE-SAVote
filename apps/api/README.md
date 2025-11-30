# SAVote 後端服務 (apps/api)

本目錄包含 SAVote 系統的後端 API 服務，基於 NestJS 框架構建。

## 技術堆疊

- **框架**: NestJS 11
- **語言**: TypeScript
- **資料庫**: PostgreSQL (透過 Prisma ORM)
- **驗證**: Passport-SAML (SSO), JWT (Session)
- **密碼學**: merkletreejs, crypto (SHA-256)
- **測試**: Jest, Supertest

## 主要功能模組

1.  **AuthModule**:
    *   處理 SAML SSO 登入 (`/auth/saml/login`) 與回調 (`/auth/saml/callback`)。
    *   發放與驗證 JWT Access Token 與 Refresh Token。
    *   提供登出機制。

2.  **UsersModule**:
    *   管理使用者資料。
    *   提供當前使用者資訊查詢 (`/users/me`)。

3.  **VotersModule**:
    *   **選民匯入**: 支援 CSV 檔案上傳 (`/voters/import`)，僅限管理員。
    *   **Merkle Tree**: 解析 CSV 資料，計算每個選民的雜湊值，並建構 Merkle Tree。
    *   **資格驗證**: 提供 API 讓前端查詢選民資格與 Merkle Proof (`/voters/eligibility/:electionId`)。

4.  **PrismaModule**:
    *   封裝 Prisma Client，負責與資料庫互動。

## 環境變數設定 (.env)

請在 `apps/api` 目錄下建立 `.env` 檔案：

```env
# 資料庫連線
DATABASE_URL="postgresql://postgres:password@localhost:5432/savote?schema=public"

# JWT 設定
JWT_PRIVATE_KEY_PATH="./secrets/jwt-private.key"
JWT_PUBLIC_KEY_PATH="./secrets/jwt-public.key"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"

# SAML 設定 (範例)
SAML_ENTRY_POINT="https://idp.example.com/saml/sso"
SAML_CALLBACK_URL="http://localhost:3000/auth/saml/callback"
SAML_ISSUER="https://savote.local/auth/metadata"
SAML_IDP_CERT="-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----"

# 應用程式設定
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

## 執行指令

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm --filter api dev

# 執行測試
pnpm --filter api test
pnpm --filter api test:e2e

# Prisma 資料庫遷移
pnpm prisma migrate dev
```

## 測試策略

- **單元測試 (Unit Tests)**: 針對 Service 層邏輯進行測試 (如 `voters.service.spec.ts`)。
- **整合測試 (Integration Tests)**: 針對 Controller 與 Module 互動進行測試 (如 `auth.controller.spec.ts`)。
- **E2E 測試**: 模擬完整請求流程。

## 相關文件

詳細規格與設計請參考 `specs/001-saml-sso-auth/` 目錄下的文件。
