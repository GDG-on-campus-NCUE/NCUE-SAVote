# 資料模型

**功能**: SAML SSO 驗證與 Nullifier Secret 管理
**階段**: 1 - 設計與合約
**日期**: 2025-11-30
**參考**: [spec.md](./spec.md), [research.md](./research.md)

---

## 實體關係圖 (ERD)

```
┌─────────────────┐          ┌──────────────────┐
│      User       │──────────│     Session      │
│                 │ 1     N  │                  │
├─────────────────┤          ├──────────────────┤
│ id (PK)         │          │ id (PK)          │
│ studentIdHash   │          │ userId (FK)      │
│ class           │          │ jti (unique)     │
│ email           │          │ issuedAt         │
│ enrollmentStatus│          │ expiresAt        │
│ createdAt       │          │ refreshToken     │
│ updatedAt       │          │ revoked          │
└─────────────────┘          └──────────────────┘

┌─────────────────┐          ┌──────────────────┐
│    Election     │──────────│ EligibleVoter    │
│                 │ 1     N  │                  │
├─────────────────┤          ├──────────────────┤
│ id (PK)         │          │ id (PK)          │
│ name            │          │ studentId        │
│ merkleRootHash  │          │ class            │
│ ...             │          │ electionId (FK)  │
└─────────────────┘          │ createdAt        │
                              └──────────────────┘

┌──────────────────────────────┐
│   僅限客戶端 (localStorage)    │
├──────────────────────────────┤
│ NullifierSecret              │
│ - value: Uint8Array (32B)    │
│ - stored as hex string       │
│ - 絕不傳送至後端              │
└──────────────────────────────┘
```

---

## 1. User 實體

**目的**: 代表已完成 SAML SSO 登入的學生。儲存從 SAML 斷言中提取的最少量屬性。

### Schema (Prisma)

```prisma
model User {
  id               String   @id @default(uuid())
  studentIdHash    String   @unique @db.VarChar(64) // SHA-256 雜湊 (hex)
  class            String   @db.VarChar(50)         // 例如 "CSIE_3A"
  email            String?  @db.VarChar(255)        // 選填，用於復原
  enrollmentStatus Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // 關聯
  sessions         Session[]

  @@index([studentIdHash])
  @@index([class])
  @@map("users")
}
```

### 欄位

| 欄位 | 型別 | 限制 | 描述 |
|-------|------|-------------|-------------|
| `id` | UUID | 主鍵 | 內部使用者識別碼 |
| `studentIdHash` | String(64) | 唯一, 非空值 | 學號的 SHA-256 雜湊（保護隱私） |
| `class` | String(50) | 非空值 | 來自 SAML 的班級/系所（例如 "CSIE_3A"） |
| `email` | String(255) | 可為空值 | 選填 Email，用於投票收據與復原 |
| `enrollmentStatus` | Boolean | 預設: true | 從 SAML 提取，表示在學狀態 |
| `createdAt` | DateTime | 自動 | 首次登入時間戳記 |
| `updatedAt` | DateTime | 自動 | 最後個人資料更新時間戳記 |

### 驗證規則

- **studentIdHash**: 必須剛好是 64 個十六進位字元 (SHA-256 輸出)
- **class**: 符合模式 `^[A-Z0-9_]{2,50}$`
- **email**: 符合 RFC 5322 Email 格式（若有提供）
- **enrollmentStatus**: 若設為 `false` 則無法投票

### 隱私註記

- **學號**: 絕不以明文儲存。後端在 SAML 回調後接收 `SHA256(studentID)`。
- **個人資料**: 不儲存姓名、生日或電話號碼。
- **GDPR 合規**: 使用者可透過管理介面請求刪除（軟刪除模式）。

---

## 2. Session 實體

**目的**: 追蹤活躍的 JWT 工作階段，用於 Access Token 撤銷與 Refresh Token 管理。

### Schema (Prisma)

```prisma
model Session {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  jti          String   @unique @db.VarChar(36) // JWT ID (UUID 格式)
  issuedAt     DateTime
  expiresAt    DateTime
  refreshToken String?  @unique @db.VarChar(255)
  revoked      Boolean  @default(false)
  revokedAt    DateTime?
  userAgent    String?  @db.VarChar(500)
  ipAddress    String?  @db.VarChar(45) // IPv6 最大長度

  @@index([userId, revoked])
  @@index([jti])
  @@index([expiresAt]) // 用於清理工作
  @@map("sessions")
}
```

### 欄位

| 欄位 | 型別 | 限制 | 描述 |
|-------|------|-------------|-------------|
| `id` | UUID | 主鍵 | 工作階段記錄識別碼 |
| `userId` | UUID | 外鍵 | 參照 `users.id` |
| `jti` | String(36) | 唯一, 非空值 | 嵌入 Access Token 中的 JWT ID |
| `issuedAt` | DateTime | 非空值 | Token 發放時間戳記 |
| `expiresAt` | DateTime | 非空值 | Token 過期時間戳記（發放後 15 分鐘） |
| `refreshToken` | String(255) | 唯一, 可為空值 | 加密的 Refresh Token（7 天 TTL） |
| `revoked` | Boolean | 預設: false | 手動撤銷旗標（登出） |
| `revokedAt` | DateTime | 可為空值 | 撤銷時間戳記 |
| `userAgent` | String(500) | 可為空值 | 客戶端 User-Agent 用於安全稽核 |
| `ipAddress` | String(45) | 可為空值 | 客戶端 IP 用於異常偵測 |

### 驗證規則

- **jti**: 必須是有效的 UUID v4
- **expiresAt**: 必須 > `issuedAt`
- **refreshToken**: 必須 > 32 字元，Base64 編碼
- **ipAddress**: 有效的 IPv4 或 IPv6 位址

### 生命週期

1. **建立**: 於 SAML 回調成功時 (`POST /auth/saml/callback`)
2. **重新整理**: 當 Access Token 過期時 (`POST /auth/refresh`)
3. **撤銷**: 於明確登出或安全事件時 (`POST /auth/logout`)
4. **清理**: Cron job 刪除 `expiresAt < now() - 30 days` 的工作階段

---

## 3. EligibleVoter 實體

**目的**: 儲存特定選舉中有資格投票的學生名單。用於產生 Merkle Tree 以進行零知識資格證明。

### Schema (Prisma)

```prisma
model EligibleVoter {
  id         String   @id @default(uuid())
  studentId  String   @db.VarChar(20)  // 明文學號（用於 Merkle 證明產生）
  class      String   @db.VarChar(50)
  electionId String
  election   Election @relation(fields: [electionId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([studentId, electionId]) // 每個學生每場選舉一筆記錄
  @@index([electionId])
  @@index([studentId])
  @@map("eligible_voters")
}
```

### 欄位

| 欄位 | 型別 | 限制 | 描述 |
|-------|------|-------------|-------------|
| `id` | UUID | 主鍵 | 記錄識別碼 |
| `studentId` | String(20) | 非空值 | 明文學號（例如 "410012345"） |
| `class` | String(50) | 非空值 | 用於資格篩選的班級/系所 |
| `electionId` | UUID | 外鍵 | 參照 `elections.id` |
| `createdAt` | DateTime | 自動 | 匯入時間戳記 |

### 驗證規則

- **studentId**: 符合模式 `^[A-Z0-9]{8,20}$`
- **class**: 符合模式 `^[A-Z0-9_]{2,50}$`
- **唯一性**: 不能有重複的 `(studentId, electionId)` 配對

### Merkle Tree 產生

當管理員透過 CSV 匯入合格選民時：

1. **匯入**: 解析 CSV → 驗證 → 插入 `eligible_voters` 資料表
2. **產生葉節點**: 對每個選民計算 `SHA256(studentId:class)`
3. **建構樹**: 使用 `merkletreejs` 建構 Merkle Tree
4. **儲存 Root**: 更新 `elections.merkleRootHash` 為樹的 root
5. **持久化葉節點**: 保留 `eligible_voters` 記錄用於證明產生

**CSV 格式**:
```csv
studentId,class
410012345,CSIE_3A
410054321,MATH_2B
```

### 隱私考量

- **明文儲存**: 學號在此以明文儲存，因為 Merkle 證明需要確切的葉節點值。
- **存取控制**: 僅管理員可查詢此資料表。絕不透過公開 API 暴露。
- **刪除**: 當選舉結束 + 驗證期過後，合格選民資料可被封存/刪除。

---

## 4. Election 實體 (部分 Schema 供參考)

**目的**: 代表一場投票選舉。此功能僅關注 Merkle root hash 欄位。

### 相關欄位

```prisma
model Election {
  id             String          @id @default(uuid())
  name           String
  merkleRootHash String?         @db.VarChar(64) // SHA-256 雜湊 (hex)
  status         ElectionStatus  @default(DRAFT)
  createdAt      DateTime        @default(now())

  eligibleVoters EligibleVoter[]

  @@map("elections")
}

enum ElectionStatus {
  DRAFT
  REGISTRATION_OPEN
  VOTING_OPEN
  VOTING_CLOSED
  TALLIED
}
```

### Merkle Root Hash

- **型別**: SHA-256 雜湊 (64 個十六進位字元)
- **產生**: 當管理員定案選民名單時，從 `eligible_voters` 計算
- **用途**: 嵌入 ZK 電路公開輸入中，用於資格驗證
- **不可變性**: 一旦投票開始，Merkle root 即不可變更

---

## 5. NullifierSecret (僅限客戶端)

**目的**: 僅儲存於瀏覽器 LocalStorage 的加密秘密。用於產生匿名投票的 Nullifier。

### 儲存 Schema (LocalStorage)

```typescript
interface NullifierSecretStorage {
  version: string;          // "v1"
  secret: string;           // 64 字元 hex 字串 (32 bytes)
  createdAt: number;        // Unix 時間戳記
  studentIdHash: string;    // 用於驗證
}

// LocalStorage Key: "ncuesa_voting_nullifier_secret_v1"
```

### 資料流

1. **產生**: `crypto.getRandomValues(new Uint8Array(32))`
2. **編碼**: 轉換為 hex 字串
3. **儲存**: `localStorage.setItem(key, JSON.stringify(data))`
4. **擷取**: `JSON.parse(localStorage.getItem(key))`
5. **驗證**: 比對 `studentIdHash` 與當前使用者以偵測不符

### 安全屬性

- **僅限客戶端**: 絕不傳送至後端（不在任何 API 請求中）
- **每裝置**: 儲存於每個瀏覽器，不跨裝置同步
- **手動備份**: 使用者可下載為 `.txt` 檔案進行復原
- **無伺服器副本**: 後端對 Nullifier Secret 零知識

### 復原流程

若使用者遺失 Secret（清除 LocalStorage）：

1. 使用者透過 SAML 成功登入
2. 前端檢查 LocalStorage → Secret 遺失
3. 顯示復原 UI：「重新輸入您的 Nullifier Secret」
4. 使用者輸入 Secret（來自備份檔案）
5. 前端雜湊 Secret → 與儲存的雜湊比對（若先前有雜湊）
6. 若有效 → 還原至 LocalStorage → 進入儀表板
7. 若無效 → 錯誤訊息，無法投票直到解決

---

## 狀態轉換

### 使用者建立流程

```
SAML 回調 → 提取屬性 → 雜湊學號 → 檢查 DB
    ↓
    存在？ → 更新在學狀態 → 回傳 User
    ↓
    新使用者？ → 建立 User 記錄 → 回傳 User
```

### 工作階段流程

```
登入 → 建立 Session (Access Token + Refresh Token) → 存入 DB
    ↓
Token 過期？ → 使用 Refresh Token → 發放新 Access Token → 更新 Session
    ↓
登出？ → 撤銷 Session → 設定 revoked=true
```

### Nullifier Secret 流程

```
首次登入 → 產生 Secret (客戶端) → 顯示給使用者 → 存入 LocalStorage
    ↓
回訪？ → 檢查 LocalStorage → 找到？ → 繼續
    ↓
    遺失？ → 提示手動輸入 → 驗證 → 還原
```

---

## 資料庫索引

### 效能最佳化

```sql
-- Users
CREATE INDEX idx_users_student_id_hash ON users(student_id_hash);
CREATE INDEX idx_users_class ON users(class);

-- Sessions
CREATE INDEX idx_sessions_user_id_revoked ON sessions(user_id, revoked);
CREATE INDEX idx_sessions_jti ON sessions(jti);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at); -- 用於清理

-- EligibleVoters
CREATE UNIQUE INDEX idx_eligible_voters_unique ON eligible_voters(student_id, election_id);
CREATE INDEX idx_eligible_voters_election_id ON eligible_voters(election_id);
CREATE INDEX idx_eligible_voters_student_id ON eligible_voters(student_id);
```

---

## 資料保留政策

| 實體 | 保留期間 | 刪除政策 |
|--------|------------------|-----------------|
| **User** | 無限期（在學期間） | 畢業或請求時軟刪除 |
| **Session** | 過期後 30 天 | 透過 Cron job 自動刪除 |
| **EligibleVoter** | 直到選舉封存 | 選舉結束 180 天後刪除 |
| **NullifierSecret** | 使用者控制 | 使用者可隨時清除 LocalStorage |

---

## 合規與隱私

### GDPR 權利

- **存取權**: 使用者可透過 `/users/me` 端點檢視其個人資料
- **更正權**: 使用者可透過個人資料頁面更新 Email
- **刪除權**: 使用者可透過管理員請求刪除（匿名化投票）
- **可攜權**: 使用者可下載 Nullifier Secret 與投票收據

### 資料最小化

僅從 SAML 收集必要屬性：
- ✅ 學號 (雜湊)
- ✅ 班級 (用於資格)
- ✅ 在學狀態 (用於資格)
- ❌ 姓名 (不儲存)
- ❌ Email (選填，僅當使用者提供時)
- ❌ 電話 (不收集)

---

## 摘要

設計了四個核心實體：
1. **User**: 儲存雜湊學號、班級、選填 Email。連結至工作階段。
2. **Session**: 追蹤 JWT token 用於撤銷與重新整理。包含安全稽核欄位。
3. **EligibleVoter**: 用於 Merkle Tree 產生的明文選民名單。僅限管理員存取。
4. **NullifierSecret**: 僅限客戶端，絕不接觸後端。儲存於 LocalStorage。

**關鍵隱私保證**:
- 後端絕不看見明文學號（僅雜湊）
- 後端絕不看見 Nullifier Secret（僅限客戶端）
- 收集最少量的 SAML 屬性
- Merkle Tree 實現零知識證明而不洩露身分

**下一步**: 產生 API 合約。
