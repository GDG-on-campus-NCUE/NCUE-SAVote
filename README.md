# SAVote (Secure Anonymous Voting)

**NCUESA 學生會選舉系統 (Decentralized, Privacy-Preserving Voting System)**

SAVote 是一個專為國立彰化師範大學學生會 (NCUESA) 設計的次世代電子投票平台，採用 **Zero-Knowledge Proofs (Groth16)** 技術建構。本系統確保投票具備以下特性：
1.  **匿名性 (Anonymous)**: 無人（包含管理員）能將選票連結至特定投票者。
2.  **可驗證性 (Verifiable)**: 任何使用者皆可透過密碼學證明確認其選票已被計入。
3.  **唯一性 (Unique)**: 每位合資格的選民在單次選舉中僅能投下一票。

---

## 文件索引 (Documentation)

### 核心文件
*   **[開發文件 (Doc.md)](./Doc.md)**: 包含系統架構、技術細節、API 規格與資料庫設計的完整說明。

### 其他指南
*   **[部署腳本 (deploy.sh)](./deploy.sh)**: 自動化部署腳本，包含 Docker、Nginx 與 ZK 電路建置流程。

---

## 快速開始 (Quick Start - Production)

若要立即部署完整堆疊：

```bash
# 1. Clone the repo
git clone https://github.com/GDG-on-campus-NCUE/SAVote.git
cd SAVote

# 2. 設定環境變數
cp apps/api/.env.example apps/api/.env
# 編輯 apps/api/.env 填入正確的 OIDC 與 DB 資訊

# 3. 執行部署腳本
# 此腳本會自動：檢查環境、安裝 Circom、建置電路與前後端、設定 Nginx 並啟動 Docker 服務
sudo ./deploy.sh
```

---

## 技術堆疊 (Tech Stack)

*   **Frontend**: React 18, Vite, TailwindCSS (Material Design 3)
*   **Backend**: NestJS (Node.js), Prisma ORM, **NCUE OIDC**
*   **Database**: PostgreSQL 16
*   **Zero Knowledge**: Circom 2.1, SnarkJS, Groth16 (BN128 curve)
*   **Infrastructure**: Docker Compose, Nginx

---

## 系統架構概要 (System Architecture)

### 身份與匿名流程 (The Privacy Flow)
1.  **身份驗證 (Auth)**: 使用者透過 **NCUE OIDC (SSO)** 登入，後端驗證學籍資格。
2.  **匿名承諾 (Identity Commitment)**: 
    *   前端生成隨機秘密 `Nullifier Secret`。
    *   計算 `Commitment = Poseidon(StudentIdHash, Secret)` 並註冊至區塊鏈/資料庫。
    *   **關鍵**: 伺服器僅儲存 Commitment，無法反推使用者真實身分。
3.  **零知識證明投票 (ZK Voting)**: 
    *   前端生成 ZK Proof，證明「我知道某個 Secret 對應到名單上的 Commitment，且尚未在本次選舉投票」。
    *   後端驗證 Proof 有效性後紀錄選票，確保隱私與不重複投票。

*(完整架構圖與詳細流程請參閱 [Doc.md](./Doc.md))*

---

## 必要環境變數 (`apps/api/.env`)

**OIDC 設定 (NCUE SSO):**
- `OIDC_ISSUER`: SSO 發行者 URL
- `OIDC_CLIENT_ID`: 應用程式 Client ID
- `OIDC_CLIENT_SECRET`: 應用程式 Client Secret
- `OIDC_CALLBACK_URL`: 回調網址 (e.g., `https://election.ncuesa.org.tw/api/auth/callback`)

**系統設定:**
- `DATABASE_URL`: Postgres 連線字串
- `CORS_ORIGIN`: 前端網域 (e.g., `https://election.ncuesa.org.tw`)
- `NODE_ENV`: `production`

---

## 專案結構 (Repository Structure)

```text
/
├── apps/
│   ├── api/             # NestJS Backend (Auth, Voting, ZK Verification)
│   └── web/             # React Frontend (UI, Client-side ZK Proof Gen)
├── packages/
│   ├── circuits/        # Circom ZK Circuits (.circom files)
│   ├── crypto-lib/      # Shared Cryptography Utilities
│   └── shared-types/    # TypeScript Interfaces (DTOs)
├── nginx/               # Nginx Configuration
├── scripts/             # Utility Scripts
└── deploy.sh            # Main Deployment Script
```

---

## 選舉規則 (Voting Rules)

系統支援多種選舉制度，包括：
1.  **正副會長選舉**: 單一選區，支持同額競選門檻 (10%) 與非同額相對多數決。
2.  **選區學生議員**: 各系/院選區，相對多數決。
3.  **不分區學生議員**: 單記不可讓渡投票制 (SNTV)，門檻 1%。

---

**License**: PolyForm Noncommercial License 1.0.0
**Maintainer**: Google Developer Groups on Campus NCUE