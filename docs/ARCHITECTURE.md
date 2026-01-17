# SAVote 系統架構文檔

## 1. 系統概述 (System Overview)

SAVote 是一個專為 NCUESA 設計的去中心化投票系統，利用 **Groth16 零知識證明 (ZKP)** 技術來確保投票的隱私性與可驗證性。

### 核心技術 (Core Technologies)

- **前端**: React 18, Vite, TailwindCSS
- **後端**: NestJS (Node.js), Prisma ORM, **NCUE OIDC**
- **資料庫**: PostgreSQL 16
- **零知識證明**: Circom 2.1, SnarkJS, Groth16 (BN128 curve)

---

## 2. 零知識證明與金鑰管理機制 (ZK & Key Management)

### 2.1 金鑰角色定義
-   **無效化金鑰 (Nullifier Secret)**: 
    -   由使用者瀏覽器生成並保存在 LocalStorage 的私鑰。
-   **身分承諾 (Identity Commitment)**:
    -   `Commitment = Poseidon(StudentIdHash, Secret)`
    -   用於註冊至 Merkle Tree。

### 2.2 運作流程

1.  **第一步：綁定身分（註冊階段）**
    -   使用者透過 **OIDC** 登入。
    -   瀏覽器生成 Secret，結合學號 Hash 計算 `Commitment`。
    -   將 `Commitment` 傳送給伺服器儲存於 `EligibleVoter`。

2.  **第二步：匿名投票（投票階段）**
    -   前端生成 Proof，包含 `StudentIdHash` 與 `Secret` 作為 Private Inputs。
    -   伺服器驗證 Proof 與 `NullifierHash`。

---

## 3. 驗證架構 (Authentication Architecture)

系統支援兩種登入入口：

1.  **一般投票者 (Voter)**: 透過 **NCUE OIDC** 登入。
2.  **管理員 (Admin)**: 透過帳號密碼直接登入後台。

### OIDC 流程
1.  使用者點擊「登入」 -> 重導向至 NCUE SSO。
2.  驗證成功後回調 API (`/auth/callback`)。
3.  API 取得 UserInfo (含學號)，發放 JWT。

### 環境變數配置 (`apps/api/.env`)
```env
OIDC_ISSUER="https://sso.ncuesa.org.tw/webman/sso/.well-known/openid-configuration"
OIDC_CLIENT_ID="..."
OIDC_CLIENT_SECRET="..."
OIDC_CALLBACK_URL="https://.../auth/callback"
```

---

## 4. 資料庫設計 (Database Design)

### Schema 概覽

-   **User**: 儲存使用者資格資訊 (`studentIdHash`)。
-   **Election**: 儲存選舉資料與 `merkleRoot`。
-   **EligibleVoter**: 連結選舉與學生，儲存 `identityCommitment`。
-   **Vote**: 儲存匿名選票。
    -   `nullifierHash`: 防止重複投票的唯一標記。
    -   `proof`: ZK 證明 JSON。
    -   `publicSignals`: 公開輸入數據。

---

## 5. 頁面流程 (UI/UX Flow)

1.  **登入**: OIDC SSO。
2.  **金鑰設置**: 生成 Secret，計算 Commitment 並註冊。
3.  **投票**: 選擇候選人 -> 生成 Proof (Web Worker) -> 提交。
4.  **驗證**: 查詢 Nullifier Hash 或下載 Audit Logs。