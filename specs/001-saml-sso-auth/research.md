# 研究與技術決策

**功能**: SAML SSO 驗證與 Nullifier Secret 管理
**階段**: 0 - 概要與研究
**日期**: 2025-11-30

---

## 1. SAML 2.0 與 NestJS 整合

### 決策
使用 `@node-saml/passport-saml` 套件搭配 Passport.js strategy 進行 SAML 驗證。

### 理由
- **官方支援**: `@node-saml/passport-saml` 是原始 `passport-saml` 套件（已棄用）的維護分支。
- **NestJS 整合**: 透過 `@nestjs/passport` 模組與 NestJS 無縫整合。
- **生產就緒**: 被主要教育機構用於 SSO（相容 Shibboleth, SimpleSAMLphp）。
- **活躍維護**: 定期安全性更新與 SAML 2.0 規格合規。

### 設定需求
- **Issuer**: 應用程式 EntityID (例如 `https://voting.ncuesa.edu.tw/saml/metadata`)
- **Entry Point**: 學校 IdP SSO URL (由學校資訊中心提供)
- **Callback URL**: `https://voting.ncuesa.edu.tw/auth/saml/callback`
- **Certificate**: 來自學校 IdP 的 X.509 憑證，用於簽章驗證
- **屬性對應**:
  - `urn:oid:0.9.2342.19200300.100.1.1` → 學號
  - `urn:oid:2.5.4.11` → 班級/系所
  - `urn:oid:1.3.6.1.4.1.5923.1.1.1.9` → 在學狀態

### 考慮過的替代方案
- **Keycloak**: 對於單一 IdP 整合過於笨重，增加基礎設施複雜度。
- **Auth0**: 第三方依賴，違反自託管原則，且有成本考量。
- **手動實作 SAML**: 風險高，XML 解析漏洞，耗時。

**參考資料**:
- [node-saml 文件](https://github.com/node-saml/node-saml)
- [NestJS Passport 指南](https://docs.nestjs.com/security/authentication#implementing-passport-strategies)

---

## 2. Nullifier Secret 產生 (客戶端加密)

### 決策
使用 Web Crypto API (`crypto.getRandomValues()`) 在瀏覽器中產生 256 位元 (32 位元組) 的 Nullifier Secret。

### 理由
- **原生瀏覽器 API**: 無外部依賴，支援所有現代瀏覽器 (Chrome 37+, Firefox 36+, Safari 11+)。
- **加密安全**: 使用作業系統級熵源 (CSPRNG)，適用於加密金鑰。
- **零後端暴露**: Secret 從未傳輸至後端，符合「隱私設計」原則。
- **效能**: 瞬間產生 (<1ms)，無網路延遲。

### 實作模式
```typescript
// crypto.service.ts
export function generateNullifierSecret(): Uint8Array {
  const secret = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(secret);
  return secret;
}

export function nullifierToHex(secret: Uint8Array): string {
  return Array.from(secret)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### 儲存策略
- **主要儲存**: 瀏覽器 LocalStorage (Hex 字串)
- **鍵名**: `ncuesa_voting_nullifier_secret_v1` (版本化以利未來遷移)
- **備份機制**: 使用者下載 Secret 為 `.txt` 檔案 (選用)
- **復原**: 透過安全輸入欄位手動重新輸入並進行雜湊驗證

### 考慮過的替代方案
- **後端產生**: 違反憲章原則（後端絕不能知道 Secret）。
- **硬體權杖 (YubiKey)**: 存取障礙，並非所有學生都有硬體金鑰。
- **助記詞 (BIP39)**: 過度設計，對非加密貨幣使用者增加 UX 複雜度。

**參考資料**:
- [Web Crypto API 規格](https://www.w3.org/TR/WebCryptoAPI/)
- [MDN: crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)

---

## 3. JWT 工作階段管理

### 決策
使用 `jsonwebtoken` 函式庫搭配 RS256 演算法 (RSA 簽章) 進行 JWT token 管理。

### 理由
- **無狀態**: 無需工作階段儲存，可水平擴展。
- **RS256 安全性**: 私鑰簽署（僅限後端），公鑰驗證（可分發）。
- **標準合規**: RFC 7519，前端函式庫廣泛支援。
- **Refresh Token 模式**: 短效 Access Token (15分) + 長效 Refresh Token (7天)。

### Token 結構
```json
{
  "sub": "sha256(student_id)",  // 主體 (雜湊以保護隱私)
  "class": "CSIE_3A",           // 班級識別碼
  "iat": 1701360000,            // 發放時間
  "exp": 1701360900,            // 過期時間 (15分)
  "jti": "uuid-v4",             // JWT ID (用於撤銷)
  "iss": "voting.ncuesa.edu.tw" // 發行者
}
```

### 金鑰管理
- **私鑰**: 儲存於環境變數 (`JWT_PRIVATE_KEY_PATH`)
- **公鑰**: 暴露於 `/auth/jwks.json` 端點
- **輪替**: 年度金鑰輪替，設有寬限期（兩把金鑰皆有效 30 天）

### 考慮過的替代方案
- **HS256 (HMAC)**: 對稱金鑰，無法分發公鑰供客戶端驗證。
- **不透明 Token (Opaque Tokens)**: 需要資料庫查詢驗證（失去無狀態優勢）。
- **Session Cookies**: 易受 CSRF 攻擊，較難用於行動應用程式。

**參考資料**:
- [JWT 最佳實踐](https://datatracker.ietf.org/doc/html/rfc8725)
- [NestJS JWT 模組](https://docs.nestjs.com/security/authentication#jwt-functionality)

---

## 4. 用於選民資格的 Merkle Tree 產生

### 決策
使用 `merkletreejs` 函式庫搭配 SHA-256 雜湊函數建構 Merkle Tree。

### 理由
- **ZK 友善**: SHA-256 支援 Circom 電路（雖然 Poseidon 對 ZK 更佳，但 SHA-256 在初始階段可接受）。
- **經過驗證的函式庫**: `merkletreejs` 廣泛用於區塊鏈專案（相容 OpenZeppelin）。
- **高效驗證**: O(log n) 證明大小與驗證時間。
- **未來遷移**: 當整合 ZK 電路時可切換至 Poseidon 雜湊（路線圖 Phase 1）。

### 實作策略
```typescript
// voters.service.ts
import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256';

async generateMerkleTree(voters: EligibleVoter[]): Promise<string> {
  const leaves = voters.map(v =>
    SHA256(`${v.studentId}:${v.class}`).toString()
  );
  const tree = new MerkleTree(leaves, SHA256, { sortPairs: true });
  return tree.getRoot().toString('hex');
}
```

### 資料庫儲存
- **Merkle Root**: 儲存於 `elections` 資料表 (`merkle_root_hash` 欄位)
- **選民葉節點**: 儲存於 `eligible_voters` 資料表（用於證明產生）
- **樹元資料**: 高度、葉節點數量、產生時間戳記

### 考慮過的替代方案
- **Poseidon Hash**: ZK 效率更高但需要 WASM，在驗證階段過早最佳化。
- **Bloom Filters**: 機率性，偽陽性對投票而言不可接受。
- **純清單**: O(n) 查詢，不支援零知識證明。

**參考資料**:
- [merkletreejs 文件](https://github.com/merkletreejs/merkletreejs)
- [ZK 系統中的 Merkle Trees](https://docs.circom.io/circom-language/constraint-generation/)

---

## 5. 資料庫 Schema 設計 (Prisma ORM)

### 決策
使用 Prisma 作為 ORM，搭配 PostgreSQL 16 進行關聯式資料管理。

### 理由
- **型別安全**: 從 Schema 自動產生 TypeScript 型別。
- **遷移系統**: 版本控制的資料庫變更。
- **效能**: 連線池、預備語句、查詢最佳化。
- **開發者體驗**: 直覺的查詢 API，優秀的 VS Code 整合。

### 核心資料表 (本功能)
```prisma
model User {
  id             String   @id @default(uuid())
  studentIdHash  String   @unique // 學號 SHA-256 雜湊
  class          String
  email          String?  // 選填，用於復原
  enrollmentStatus Boolean @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  sessions       Session[]
}

model Session {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  jti         String   @unique // JWT ID
  issuedAt    DateTime
  expiresAt   DateTime
  refreshToken String?  @unique
  revoked     Boolean  @default(false)
}

model EligibleVoter {
  id         String   @id @default(uuid())
  studentId  String   // 未雜湊（用於 Merkle 證明產生）
  class      String
  electionId String
  createdAt  DateTime @default(now())

  @@unique([studentId, electionId])
}
```

### 考慮過的替代方案
- **TypeORM**: 樣板程式碼較多，型別推斷較弱。
- **Sequelize**: 基於回調的 API，TypeScript 支援次佳。
- **Knex.js**: 原始 SQL 建構器，無實體建模。

**參考資料**:
- [Prisma Schema 參考](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [PostgreSQL 資料型別](https://www.postgresql.org/docs/16/datatype.html)

---

## 6. 前端狀態管理

### 決策
使用 Zustand 進行全域驗證狀態管理 + React Query 進行伺服器狀態管理。

### 理由
- **Zustand (Auth 狀態)**:
  - 相比 Redux 極少的樣板程式碼。
  - TypeScript 優先設計。
  - <1KB bundle 大小。
  - 完美適用於簡單的 Auth 狀態（使用者、Token、Nullifier Secret 存在與否）。

- **React Query (API 狀態)**:
  - 自動快取、重新擷取、背景更新。
  - 樂觀更新 (Optimistic updates) 提升 UX。
  - 內建載入/錯誤狀態。

### 狀態結構
```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  hasNullifierSecret: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkNullifierSecret: () => boolean;
}

const useAuthStore = create<AuthState>((set) => ({ /* ... */ }));
```

### 考慮過的替代方案
- **Redux Toolkit**: 對於簡單 Auth 狀態過度設計。
- **Context API**: 頻繁更新會有效能問題。
- **Recoil**: 以 Facebook 為中心，社群採用度較低。

**參考資料**:
- [Zustand 文件](https://github.com/pmndrs/zustand)
- [React Query 指南](https://tanstack.com/query/latest/docs/react/overview)

---

## 7. 安全性考量

### 速率限制
- **策略**: `@nestjs/throttler` 模組搭配 Redis 後端
- **限制**:
  - SAML 登入: 每 IP 每 15 分鐘 5 次嘗試
  - JWT Refresh: 每使用者每小時 10 次嘗試
  - Nullifier 驗證: 每分鐘 100 次請求 (每使用者)

### HTTPS & 憑證綁定
- **生產環境**: 透過 Nginx 反向代理強制 HTTPS
- **憑證**: Let's Encrypt 萬用字元憑證 `*.ncuesa.edu.tw`
- **HSTS**: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 內容安全策略 (CSP)
```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://idp.school.edu.tw;
```

### 輸入驗證
- **SAML 屬性**: 白名單允許的屬性，拒絕非預期欄位。
- **學號格式**: Regex 驗證 (`^[A-Z0-9]{8,12}$`)。
- **Email**: RFC 5322 驗證搭配 DNS MX 記錄檢查 (選用)。

**參考資料**:
- [OWASP 驗證作弊表](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [SAML 安全性指南](https://docs.oasis-open.org/security/saml/v2.0/saml-sec-consider-2.0-os.pdf)

---

## 8. 測試策略

### 單元測試 (Jest)
- **前端**:
  - `crypto.service.test.ts`: Nullifier 產生、Hex 轉換
  - `useNullifierSecret.test.ts`: LocalStorage 操作
  - `authStore.test.ts`: 狀態轉換
- **後端**:
  - `auth.service.test.ts`: JWT 簽署/驗證
  - `voters.service.test.ts`: Merkle Tree 產生

### 整合測試 (Supertest)
- SAML 登入流程 (Mock IdP 回應)
- JWT Refresh Token 流程
- 合格選民 CSV 匯入

### E2E 測試 (Playwright)
- 首次使用者: 登入 → SAML 回調 → Nullifier 設定 → 儀表板
- 回訪使用者: 登入 → 自動導向儀表板
- 遺失 Secret: 登入 → 復原提示 → 手動輸入 → 儀表板

### 測試覆蓋率目標
- **單元測試**: >80% 行覆蓋率
- **整合測試**: 所有 API 端點
- **E2E 測試**: 3 個關鍵路徑 (上述)

**參考資料**:
- [NestJS 測試指南](https://docs.nestjs.com/fundamentals/testing)
- [Playwright 最佳實踐](https://playwright.dev/docs/best-practices)

---

## 摘要

所有技術未知數已解決。關鍵技術定案：
1. **SAML**: `@node-saml/passport-saml` 搭配 NestJS Passport 整合
2. **Crypto**: Web Crypto API 用於客戶端 Nullifier 產生
3. **JWT**: `jsonwebtoken` 搭配 RS256，15分過期 + Refresh Tokens
4. **Merkle Tree**: `merkletreejs` 搭配 SHA-256 (未來遷移至 Poseidon)
5. **ORM**: Prisma 搭配 PostgreSQL 16
6. **狀態**: Zustand (Auth) + React Query (API)
7. **安全性**: 速率限制, HTTPS, CSP, 輸入驗證
8. **測試**: Jest + Supertest + Playwright

**下一階段**: 產生資料模型與 API 合約。
