# 快速入門指南：SAML SSO 身份驗證

**功能**：SAML SSO 身份驗證與 Nullifier Secret 管理  
**適用對象**：實作或測試此功能的開發人員  
**最後更新**：2025-11-30

---

## 先決條件

- 已安裝 Node.js v20+
- 已安裝 pnpm v10+
- PostgreSQL 16 正在運行（或使用 Docker）
- Redis 正在運行（可選，用於速率限制）
- 已複製 Git 儲存庫
- 學校 SAML IdP 憑證（或測試用的 IdP 設定）

---

## 1. 環境設定

### 1.1 安裝依賴套件

```bash
# 從儲存庫根目錄
pnpm install
```

### 1.2 設定環境變數

在 `apps/api/` 中建立 `.env` 檔案（可複製 `.env.example`）：

```env
# 資料庫
DATABASE_URL="postgresql://postgres:password@localhost:5432/savote_dev?schema=public"

# JWT 金鑰
JWT_PRIVATE_KEY_PATH="./secrets/jwt-private.key"
JWT_PUBLIC_KEY_PATH="./secrets/jwt-public.key"
JWT_ACCESS_TOKEN_EXPIRES_IN="15m"
JWT_REFRESH_TOKEN_EXPIRES_IN="7d"

# SAML 設定 (Synology SSO Server 範例)
SAML_ENTRY_POINT="https://sso.ncuesa.org.tw/webman/sso/SSOOauth.cgi"
SAML_ISSUER="https://api.voting.ncuesa.edu.tw/saml/metadata"
SAML_CALLBACK_URL="http://localhost:3000/auth/saml/callback"
SAML_CERT="MIIFcDCCA1igAwIBAgIUGG2l/96TyBeK+zUTNSOp+5FDzsgwDQYJKoZIhvcNAQEL..."

# 伺服器
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"
```

### 1.3 產生 JWT 金鑰

```bash
# 產生用於 JWT 簽署的 RSA 金鑰對
mkdir -p apps/api/secrets

# 私鑰（請妥善保管！）
openssl genrsa -out apps/api/secrets/jwt-private.key 2048

# 公鑰
openssl rsa -in apps/api/secrets/jwt-private.key -pubout -out apps/api/secrets/jwt-public.key
```

### 1.4 設定資料庫

```bash
# 透過 Docker 啟動 PostgreSQL（如果本機未安裝）
docker-compose up -d

# 執行 Prisma 遷移
cd apps/api
pnpm prisma migrate deploy
```

---

## 2. 開發流程

### 2.1 快速啟動 (推薦)

我們提供了一個自動化腳本，可以一次完成環境檢查、金鑰生成、資料庫啟動與遷移，以及服務啟動。

```cmd
start-dev.bat
```

### 2.2 手動啟動

若需手動啟動個別服務：

```bash
# 啟動後端 API (http://localhost:3000)
pnpm --filter api dev

# 啟動前端 (http://localhost:5173)
pnpm --filter web dev
```

### 2.3 測試 SAML SSO 流程

#### 選項 A：使用真實學校 IdP

1. 前往 `http://localhost:5173/login`
2. 點擊「使用學校帳號登入」
3. 重新導向至學校 IdP → 進行驗證
4. 回呼至 `http://localhost:5173/callback?SAMLResponse=...`
5. 前端提取 JWT Token → 重新導向至儀表板

#### 選項 B：模擬 SAML 回應（用於測試）

```bash
# 安裝 saml-idp 進行本機測試
npm install -g saml-idp

# 啟動模擬 IdP
saml-idp --port 7000
```

使用測試 SAML 斷言（Assertion）：
```xml
<saml:Assertion>
  <saml:AttributeStatement>
    <saml:Attribute Name="urn:oid:0.9.2342.19200300.100.1.1">
      <saml:AttributeValue>410012345</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="urn:oid:2.5.4.11">
      <saml:AttributeValue>CSIE_3A</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>
```

---

## 3. 測試

### 3.1 執行單元測試

```bash
# 後端測試
cd apps/api
pnpm test

# 前端測試
cd apps/web
pnpm test
```

### 3.2 執行整合測試

```bash
# API 整合測試
cd apps/api
pnpm test:integration
```

### 3.3 執行 E2E 測試

```bash
# 安裝 Playwright（僅首次需要）
cd apps/web
pnpm exec playwright install

# 執行 E2E 測試
pnpm test:e2e

# 在 UI 模式下執行
pnpm exec playwright test --ui
```

---

## 4. 關鍵端點

### 身份驗證

| 方法 | 端點 | 描述 |
|--------|----------|-------------|
| GET | `/auth/saml/login` | 啟動 SAML SSO |
| POST | `/auth/saml/callback` | SAML 回呼處理 |
| POST | `/auth/refresh` | 重新整理 Access Token |
| POST | `/auth/logout` | 登出使用者 |
| GET | `/auth/jwks` | 取得用於 JWT 驗證的公鑰 |

### 使用者管理

| 方法 | 端點 | 描述 |
|--------|----------|-------------|
| GET | `/users/me` | 取得當前使用者個人資料 |
| PATCH | `/users/me` | 更新使用者個人資料 |

### 選民管理（管理員）

| 方法 | 端點 | 描述 |
|--------|----------|-------------|
| POST | `/voters/import` | 匯入合格選民 CSV |
| POST | `/voters/verify-eligibility` | 檢查使用者資格 |

---

## 5. 除錯技巧

### 檢查 JWT Token

```bash
# 解碼 JWT（使用 jwt.io 或 CLI 工具）
npm install -g jwt-cli

jwt decode <YOUR_ACCESS_TOKEN>
```

預期 Payload：
```json
{
  "sub": "5e9f8e3b2c1a4d6f...",  // SHA-256 雜湊
  "class": "CSIE_3A",
  "iat": 1701360000,
  "exp": 1701360900,
  "jti": "550e8400-e29b-41d4-a716-446655440000",
  "iss": "voting.ncuesa.edu.tw"
}
```

### 驗證 SAML 設定

```bash
# 測試 SAML metadata 端點
curl http://localhost:3000/auth/saml/metadata

# 應回傳包含 EntityDescriptor 的 XML
```

### 檢查資料庫記錄

```bash
cd apps/api

# 開啟 Prisma Studio
pnpm prisma studio

# 瀏覽 users, sessions, eligible_voters 資料表
```

### 檢查 LocalStorage

開啟瀏覽器開發者工具（DevTools）→ Application → Local Storage

預期 Key：
- `access_token`: JWT access token
- `refresh_token`: Refresh token
- `ncuesa_voting_nullifier_secret_v1`: Nullifier secret (JSON)

### 測試 Nullifier Secret 產生

開啟瀏覽器 Console：

```javascript
// 產生 nullifier secret
const secret = new Uint8Array(32);
crypto.getRandomValues(secret);

// 轉換為 hex
const hex = Array.from(secret)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

console.log('Nullifier Secret:', hex);

// 儲存於 LocalStorage
localStorage.setItem('ncuesa_voting_nullifier_secret_v1', JSON.stringify({
  version: 'v1',
  secret: hex,
  createdAt: Date.now(),
  studentIdHash: '<user_student_id_hash>'
}));
```

---

## 6. 常見問題

### 問題：SAML Callback 401 Unauthorized

**原因**：SAML assertion 簽章無效

**解決方案**：
1. 檢查 `.env` 中的 `SAML_IDP_CERT` 是否與 IdP 憑證相符
2. 驗證 IdP 憑證是否過期：`openssl x509 -in cert.pem -noout -dates`
3. 檢查 IdP 時鐘同步（SAML assertions 對時間敏感）

### 問題：JWT Token 立即過期

**原因**：伺服器時鐘偏差

**解決方案**：
```bash
# 同步系統時鐘
sudo ntpdate -s time.nist.gov

# 或安裝 NTP
sudo apt-get install ntp
```

### 問題：Nullifier Secret 未持久化

**原因**：LocalStorage 被停用或封鎖

**解決方案**：
1. 檢查瀏覽器隱私設定（啟用 LocalStorage）
2. 停用封鎖儲存的瀏覽器擴充功能
3. 在無痕模式下測試

### 問題：Merkle Tree 產生失敗

**原因**：CSV 格式無效

**解決方案**：
1. 確保 CSV 有標頭：`studentId,class`
2. 無空行
3. 學號符合模式 `^[A-Z0-9]{8,20}$`

有效 CSV 範例：
```csv
studentId,class
410012345,CSIE_3A
410054321,MATH_2B
```

---

## 7. 開發檢查清單

提交程式碼前：

- [ ] 所有單元測試通過 (`pnpm test`)
- [ ] 整合測試通過 (`pnpm test:integration`)
- [ ] E2E 測試通過 (`pnpm test:e2e`)
- [ ] Linter 通過 (`pnpm lint`)
- [ ] TypeScript 編譯無錯誤 (`pnpm build`)
- [ ] API 文件已更新（如果端點有變更）
- [ ] 資料庫遷移已建立（如果 Schema 有變更）
- [ ] 環境變數已記錄（如果新增了變數）

---

## 8. 下一步

完成此功能後：

1. **端對端測試 SAML 流程**：使用真實學校 IdP
2. **驗證 Nullifier Secret**：正確儲存於 LocalStorage
3. **匯入測試合格選民**：透過 CSV
4. **產生 Merkle Tree**：並驗證 Root Hash
5. **進入路線圖第一階段**：ZK 電路開發

---

## 資源

- [規格文件](./spec.md)
- [資料模型](./data-model.md)
- [API 合約](./contracts/openapi.yaml)
- [研究筆記](./research.md)
- [NestJS SAML 指南](https://docs.nestjs.com/security/authentication)
- [Web Crypto API 文件](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

**有問題嗎？** 請聯繫 NCUESA 開發團隊 dev@ncuesa.edu.tw
