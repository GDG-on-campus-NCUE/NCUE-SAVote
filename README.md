# NCUESA 去中心化匿名投票系統 - 專業開發規劃書 (Master Plan)

**版本:** 1.0.0
**日期:** 2025-11-26
**狀態:** Approved
**文件級別:** Confidential / Internal

---

## 1. 執行摘要 (Executive Summary)

本專案旨在為 NCUESA 構建一套基於 **Groth16 零知識證明 (ZKP)** 的電子投票系統。不同於傳統中心化投票系統，本系統在數學層面上保證了「投票隱私」與「結果可驗證性」的共存。本規劃書定義了從開發環境建置、核心電路實作、前後端開發到最終部署的完整路徑，並採用企業級的開發標準與 DevOps 流程。

---

## 2. 專案組織結構 (Project Organization)

建議採用 **Monorepo (單一倉庫)** 架構，以便於統一管理前後端與 ZK 電路的依賴與型別共享。

### 2.1 目錄結構建議
```text
/
├── apps/
│   ├── web/                 # 前端應用 (React + Vite)
│   ├── api/                 # 後端應用 (NestJS)
│   └── admin/               # 管理員後台 (React - Optional)
├── packages/
│   ├── circuits/            # ZK 電路源碼 (.circom) 與編譯腳本
│   ├── contracts/           # (Optional) 若未來上鏈，存放 Solidity
│   ├── shared-types/        # 前後端共用的 TypeScript 型別定義
│   └── crypto-lib/          # 封裝好的 ZK 證明生成與驗證工具庫
├── tools/                   # CI/CD 腳本, Docker 配置
├── docker-compose.yml       # 本地開發環境編排
└── README.md
```

### 2.2 開發工具鏈
*   **套件管理:** pnpm (推薦) 或 yarn workspaces
*   **建置系統:** Turborepo 或 Nx (加速 Monorepo 建置)
*   **版本控制:** Git

---

## 3. 詳細技術規格 (Detailed Tech Stack)

### 3.1 Core (ZKP & Crypto)
*   **Language:** Circom 2.1.x
*   **Proving System:** Groth16 (因其 Proof size 極小，驗證速度快)
*   **Curve:** BN128 (以太坊相容) 或 BLS12-381
*   **Hash Function:** Poseidon Hash (對 ZK 電路最友好的雜湊函數)
*   **Library:** `snarkjs`, `circomlib`, `circomlibjs`

### 3.2 Backend (API)
*   **Framework:** NestJS (Node.js LTS)
*   **Language:** TypeScript 5.x
*   **Database:** PostgreSQL 16
*   **ORM:** Prisma (推薦，因其型別安全性優於 TypeORM)
*   **Caching:** Redis (用於 Session 管理與防重送攻擊 nonce 暫存)
*   **Documentation:** Swagger (OpenAPI 3.0)

### 3.3 Frontend (Web Client)
*   **Framework:** React 18
*   **Build Tool:** Vite
*   **State Management:** Zustand 或 TanStack Query (React Query)
*   **UI Library:** Shadcn/ui + TailwindCSS
*   **WASM Integration:** 需配置 Vite 支援 `.wasm` 檔案載入

---

## 4. 開發規範 (Development Standards)

### 4.1 Git Workflow
採用 **Gitflow** 或 **Trunk Based Development** (視團隊規模而定)。
*   `main`: 生產環境分支 (Production Ready)。
*   `develop`: 開發主分支。
*   `feature/xxx`: 功能分支。
*   `fix/xxx`: 修復分支。

### 4.2 Commit Convention
遵循 **Conventional Commits** 規範：
*   `feat: add zk proof generation logic`
*   `fix: resolve nullifier collision bug`
*   `docs: update api schema`
*   `chore: upgrade dependencies`

### 4.3 Code Quality
*   **Linter:** ESLint (Airbnb 或 Google config)
*   **Formatter:** Prettier
*   **Pre-commit Hook:** Husky + lint-staged (強制在 commit 前檢查代碼風格)

---

## 5. 詳細開發時程 (Roadmap & Sprints)

預計開發週期：8 週 (4 個 Sprints，每 Sprint 2 週)

### Phase 0: 基礎建設 (Week 1)
*   [ ] 初始化 Monorepo 結構。
*   [ ] 設定 Docker Compose (PostgreSQL, Redis)。
*   [ ] 建立 CI/CD 基礎流程 (GitHub Actions)。
*   [ ] 定義前後端共用的 API Interface (DTOs)。

### Phase 1: ZK 電路核心 (Week 2-3)
*   [ ] **Task 1.1:** 編寫 `vote.circom` 電路。
    *   實作 Merkle Tree 驗證 (若使用 Merkle Tree 做資格驗證)。
    *   實作 Nullifier 生成邏輯。
*   [ ] **Task 1.2:** 電路單元測試 (使用 `circom_tester`)。
*   [ ] **Task 1.3:** 執行 Trusted Setup (Powers of Tau)，生成 `.zkey` 與 `.wasm`。
*   [ ] **Task 1.4:** 封裝 `crypto-lib` 套件，提供 `generateProof` 與 `verifyProof` 函數供前後端呼叫。

### Phase 2: 後端 API 開發 (Week 4-5)
*   [ ] **Task 2.1:** 實作 User Auth (JWT) 與學生資格匯入/驗證。
*   [ ] **Task 2.2:** 實作 Election Management CRUD。
*   [ ] **Task 2.3:** **核心功能** - 實作 `/votes/submit` 接口。
    *   整合 `snarkjs` 進行後端驗證。
    *   處理高併發下的 Nullifier 防重鎖定 (Database Transaction / Redis Lock)。
*   [ ] **Task 2.4:** 實作驗證日誌與計票 API。

### Phase 3: 前端整合與 UI (Week 6-7)
*   [ ] **Task 3.1:** 登入頁面與選舉列表頁面。
*   [ ] **Task 3.2:** 投票流程 UI/UX 設計。
    *   **關鍵:** 在 Web Worker 中執行 ZK Proof 生成，避免阻塞 UI 主執行緒。
*   [ ] **Task 3.3:** 整合後端 API。
*   [ ] **Task 3.4:** 結果展示與驗證頁面。

### Phase 4: 測試、審計與部署 (Week 8)
*   [ ] **Task 4.1:** 系統整合測試 (E2E Testing with Playwright/Cypress)。
*   [ ] **Task 4.2:** 壓力測試 (Load Testing with k6)，模擬 1000 人同時投票。
*   [ ] **Task 4.3:** 安全性自我審計 (檢查 SQL Injection, XSS, ZK 電路邏輯漏洞)。
*   [ ] **Task 4.4:** 正式環境部署。

---

## 6. 測試策略 (Testing Strategy)

### 6.1 ZK 電路測試
這是最關鍵的部分，錯誤的電路會導致偽造選票。
*   **Constraint Check:** 確保約束數量正確，無多餘或缺失約束。
*   **Negative Testing:** 故意輸入錯誤的 Private Key 或 Path，確保 Proof 生成失敗或驗證失敗。
*   **Witness Generation Test:** 確保所有合法輸入都能生成有效的 Witness。

### 6.2 後端測試
*   **Unit Test:** 針對 Service 層邏輯 (Jest)。
*   **Integration Test:** 針對 API Endpoint 與資料庫互動 (Supertest)。

### 6.3 壓力測試 (Performance)
*   **目標:** 確保在投票截止前的高流量下，系統不會崩潰。
*   **指標:** 95% 請求回應時間 < 2秒，TPS (Transactions Per Second) > 50。
*   **瓶頸預測:** ZK 驗證 (CPU 密集) 與 資料庫寫入 (IO 密集)。

---

## 7. 部署架構 (Deployment Architecture)

### 7.1 容器化 (Docker)
*   **Frontend:** Nginx 容器，託管靜態檔案 (Build output)。
*   **Backend:** Node.js 容器。
*   **Database:** PostgreSQL 容器 (生產環境建議使用雲端託管資料庫如 AWS RDS)。

### 7.2 網路架構
```text
[Client Browser]
      |
    (HTTPS)
      |
[Load Balancer / Nginx Reverse Proxy]
      |
      +-----> [Frontend Container] (Static Assets)
      |
      +-----> [Backend Container Cluster] (API)
                     |
        +------------+------------+
        |            |            |
   [PostgreSQL]   [Redis]    [Log Service]
```

### 7.3 安全配置
*   **SSL/TLS:** 強制 HTTPS 連線。
*   **Rate Limiting:** 防止 DDoS 攻擊與暴力破解。
*   **Environment Variables:** 敏感資訊 (DB 密碼, JWT Secret) 僅透過環境變數注入。

---

## 8. 風險管理 (Risk Management)

| 風險項目 | 可能性 | 影響程度 | 緩解措施 |
| --- | --- | --- | --- |
| **私鑰遺失** | 中 | 高 | 用戶無法投票。設計「重置 Nullifier Secret」流程 (需嚴格身分驗證，且會作廢舊票)。 |
| **重複投票攻擊** | 低 | 極高 | 依賴 ZK Nullifier 機制與 DB Unique Index 雙重防護。 |
| **前端被竄改** | 低 | 高 | 透過 SRI (Subresource Integrity) 與 Content Security Policy (CSP) 防護。 |
| **伺服器流量過載** | 中 | 中 | 使用 Queue (如 BullMQ) 進行削峰填谷，非同步處理投票請求。 |

---

## 9. 專案結構與部署指南 (Project Structure & Deployment Guide)

### 9.1 專案結構說明 (File Structure)

本專案採用 Monorepo 架構，所有相關程式碼皆位於同一倉庫中。

```text
/
├── apps/                    # 應用程式層
│   ├── web/                 # 前端應用 (React + Vite)
│   │   ├── src/             # 原始碼
│   │   └── public/          # 靜態資源 (包含 ZK 電路編譯後的 .wasm)
│   ├── api/                 # 後端應用 (NestJS)
│   │   ├── src/             # 原始碼 (Controller, Service, Module)
│   │   └── test/            # E2E 測試
│   └── admin/               # (預留) 管理員後台
├── packages/                # 共用套件層
│   ├── circuits/            # ZK 電路開發
│   │   ├── src/             # .circom 電路原始碼
│   │   └── scripts/         # Trusted Setup 與編譯腳本
│   ├── shared-types/        # 前後端共用的 TypeScript 型別定義
│   └── crypto-lib/          # 封裝好的 ZK 證明生成與驗證工具庫
├── tools/                   # 開發與部署工具
├── .specify/                # Spec-Driven Development 規格文件
├── turbo.json               # Turborepo 建置設定
├── pnpm-workspace.yaml      # pnpm workspace 設定
└── README.md                # 專案說明文件
```

### 9.2 快速開始 (Getting Started)

#### 前置需求
*   Node.js (LTS v20+)
*   pnpm (v9+)
*   Docker & Docker Compose (用於資料庫)

#### 安裝依賴
```bash
# 安裝 pnpm (若尚未安裝)
npm install -g pnpm

# 安裝專案依賴
pnpm install
```

#### 啟動開發環境
```bash
# 啟動所有服務 (Web + API)
pnpm dev

# 僅啟動特定服務
pnpm --filter web dev
pnpm --filter api dev
```

### 9.3 部署指南 (Deployment)

#### 1. 建置 (Build)
```bash
# 建置所有專案
pnpm build
```

#### 2. 資料庫啟動
使用 Docker Compose 啟動 PostgreSQL 與 Redis：
```bash
docker-compose up -d
```

#### 3. 執行服務
**API Server:**
```bash
cd apps/api
pnpm start:prod
```

**Web Client:**
前端建置後為靜態檔案，可使用 Nginx 或任何靜態託管服務 (Vercel, Netlify) 部署 `apps/web/dist` 目錄。

### 9.4 覆現步驟 (Reproduction)
若需完整覆現本系統的 ZK 流程，請依序執行：
1.  **編譯電路:** 進入 `packages/circuits` 執行編譯腳本，生成 `.wasm` 與 `.zkey`。
2.  **部署靜態檔:** 將生成的 `.wasm` 與 `.zkey` 複製到 `apps/web/public`。
3.  **啟動服務:** 依上述步驟啟動 API 與 Web。
4.  **測試投票:** 開啟瀏覽器訪問 Web，進行模擬投票。
