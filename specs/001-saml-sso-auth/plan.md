# 實作計畫：SAML SSO 驗證與 Nullifier Secret 管理

**分支**: `001-saml-sso-auth` | **日期**: 2025-11-30 | **規格**: [spec.md](./spec.md)
**輸入**: 來自 `/specs/001-saml-sso-auth/spec.md` 的功能規格

## 摘要

本功能實作整合學校身分提供者 (IdP) 的 SAML 2.0 單一登入 (SSO) 驗證，並結合客戶端加密的 Nullifier Secret 產生機制，以實現匿名投票。系統從 SAML 斷言中提取最少量的使用者屬性（學號、班級、在學狀態），利用 Web Crypto API 在瀏覽器端產生 256 位元的隨機 Nullifier Secret，並僅儲存於 LocalStorage。後端發放 JWT token 進行工作階段管理，同時對使用者的投票秘密保持零知識。

**技術方法**: 使用 NestJS 後端搭配 Passport.js SAML strategy 進行 IdP 整合，React 前端搭配 Web Crypto API 進行 Nullifier 產生，PostgreSQL 儲存使用者記錄（不儲存秘密），以及 Prisma 用於從合格選民名單產生 Merkle Tree。

## 技術背景

**語言/版本**: TypeScript 5.x (Node.js LTS v20+), React 18
**主要依賴**: NestJS, Passport.js (@node-saml/passport-saml), React 18, Web Crypto API (瀏覽器原生), Prisma, JWT (jsonwebtoken)
**儲存**: PostgreSQL 16 (使用者記錄、工作階段、合格選民名單), 瀏覽器 LocalStorage (Nullifier Secret - 僅限客戶端)
**測試**: Jest (單元測試), Supertest (整合測試), Playwright (E2E 測試)
**目標平台**: Web 應用程式 (Chrome/Edge/Firefox/Safari 最新 2 個版本)
**專案類型**: Web (前端 + 後端)
**效能目標**: 首次登入 <60秒 (FR-001 至 FR-004 完成), 回訪使用者登入 <2秒 (FR-006), 99.9% SAML 成功率 (SC-003), 1000+ 選民 Merkle Tree 產生 <2分鐘 (SC-005)
**限制**: 後端零儲存 Nullifier Secret (SC-004), 僅限客戶端加密, 符合 GDPR 的最小化資料收集, 行動裝置響應式 UI
**規模/範圍**: 投票期間 1000+ 同時在線使用者, 支援每場選舉 10,000+ 合格選民, 95% 回訪使用者成功率無需手動重新輸入 (SC-002)

## 憲章檢查 (Constitution Check)

*閘門: 必須在 Phase 0 研究前通過。在 Phase 1 設計後重新檢查。*

### 隱私設計 (ZKP 優先) ✅
- **通過**: Nullifier Secret 僅在客戶端 (瀏覽器 LocalStorage) 產生與儲存
- **通過**: 後端從未接收明文 Nullifier Secret
- **通過**: SAML 屬性最小化 (僅學號雜湊、班級、在學狀態)
- **設計註記**: 未來的 ZK 證明產生將使用此 Nullifier Secret 而不洩露身分

### 公開可驗證性 ✅
- **通過**: 系統記錄驗證事件以供稽核 (不暴露秘密)
- **通過**: 公佈 Merkle Tree root 以供選民資格驗證
- **未來**: ZK 證明將可公開驗證且無需後端參與

### 一人一票 (完整性) ✅
- **通過**: 強制每個學號僅能產生一個 Nullifier (FR-003)
- **通過**: 系統警告使用者單一 Secret 對應學號的有效性
- **未來**: Nullifier 唯一性將在投票階段透過 ZK 電路強制執行

### 易用性與簡潔性 ✅
- **通過**: SAML SSO 簡化登入 (無需手動建立帳號)
- **通過**: 清晰的 UI 警告關於 Secret 管理 (FR-004)
- **通過**: 選用的 Email 復原機制 (FR-007)
- **目標**: <60秒 首次使用者引導 (SC-001)

### 程式碼品質與安全性 ✅
- **通過**: 前後端全面採用 TypeScript strict mode
- **通過**: 使用 JWT 進行無狀態工作階段管理
- **通過**: Secret 從未傳輸至後端 (Web Crypto API 僅限客戶端)
- **測試覆蓋率**: Jest 單元測試 + Supertest 整合測試 + Playwright E2E 測試
- **安全性**: Auth 端點速率限制, 強制 HTTPS, CSP 標頭

**閘門狀態**: ✅ 通過 - 無違規。進入 Phase 0。

## 專案結構

### 文件 (本功能)

```text
specs/[###-feature]/
├── plan.md              # 本檔案 (/speckit.plan 指令輸出)
├── research.md          # Phase 0 產出 (/speckit.plan 指令)
├── data-model.md        # Phase 1 產出 (/speckit.plan 指令)
├── quickstart.md        # Phase 1 產出 (/speckit.plan 指令)
├── contracts/           # Phase 1 產出 (/speckit.plan 指令)
└── tasks.md             # Phase 2 產出 (/speckit.tasks 指令 - 非由 /speckit.plan 建立)
```

### 原始碼 (儲存庫根目錄)

```text
apps/
├── web/                                      # 前端 React 應用程式
│   ├── src/
│   │   ├── features/
│   │   │   └── auth/                        # 驗證功能模組
│   │   │       ├── components/
│   │   │       │   ├── LoginButton.tsx      # SAML SSO 登入觸發器
│   │   │       │   ├── NullifierSetup.tsx   # 首次 Secret 產生 UI
│   │   │       │   ├── NullifierRecovery.tsx # 手動 Secret 重新輸入 UI
│   │   │       │   └── SAMLCallback.tsx     # 處理 SAML 回調
│   │   │       ├── hooks/
│   │   │       │   ├── useAuth.ts           # Auth 狀態管理
│   │   │       │   └── useNullifierSecret.ts # LocalStorage 加密操作
│   │   │       ├── services/
│   │   │       │   ├── crypto.service.ts    # Web Crypto API 封裝
│   │   │       │   └── auth.api.ts          # 後端 Auth API 呼叫
│   │   │       └── pages/
│   │   │           ├── LoginPage.tsx
│   │   │           ├── CallbackPage.tsx
│   │   │           └── SetupPage.tsx
│   │   ├── lib/
│   │   │   ├── localStorage.ts              # 型別安全的 LocalStorage 工具
│   │   │   └── constants.ts
│   │   └── App.tsx
│   └── tests/
│       ├── unit/                            # 元件單元測試
│       ├── integration/                     # Auth 流程整合測試
│       └── e2e/                             # Playwright E2E 測試
│
└── api/                                      # 後端 NestJS 應用程式
    ├── src/
    │   ├── auth/                            # 驗證模組
    │   │   ├── auth.controller.ts           # SAML 登入/回調端點
    │   │   ├── auth.service.ts              # JWT 發放、工作階段管理
    │   │   ├── saml.strategy.ts             # Passport SAML strategy 設定
    │   │   ├── jwt.strategy.ts              # JWT 驗證 strategy
    │   │   ├── guards/
    │   │   │   ├── jwt-auth.guard.ts
    │   │   │   └── saml-auth.guard.ts
    │   │   └── dto/
    │   │       ├── saml-callback.dto.ts
    │   │       └── jwt-payload.dto.ts
    │   ├── users/                           # 使用者管理模組
    │   │   ├── users.service.ts             # 使用者 CRUD 操作
    │   │   ├── entities/
    │   │   │   └── user.entity.ts           # Prisma User 模型
    │   │   └── dto/
    │   │       └── create-user.dto.ts
    │   ├── voters/                          # 合格選民管理模組
    │   │   ├── voters.controller.ts         # CSV 匯入端點
    │   │   ├── voters.service.ts            # Merkle Tree 產生邏輯
    │   │   ├── entities/
    │   │   │   └── eligible-voter.entity.ts
    │   │   └── dto/
    │   │       └── import-voters.dto.ts
    │   └── prisma/
    │       ├── schema.prisma                # 資料庫 Schema
    │       └── migrations/
    └── test/
        ├── unit/                            # 服務單元測試
        ├── integration/                     # API 整合測試
        └── e2e/                             # 完整 Auth 流程 E2E 測試

packages/
└── shared-types/                            # 共用 TypeScript 型別
    └── src/
        ├── auth.types.ts                    # JWT payload, SAML 使用者型別
        └── voter.types.ts                   # 合格選民型別
```

**結構決策**: 選擇 Web 應用程式架構。前端 (`apps/web`) 處理所有客戶端加密與 SAML 回調處理。後端 (`apps/api`) 管理 SAML 驗證、JWT 發放，以及用於 Merkle Tree 產生的合格選民名單處理。`packages/shared-types` 中的共用型別確保前後端邊界的型別安全。

## 複雜度追蹤

> **僅在憲章檢查有違規且必須合理化時填寫**

**未偵測到違規。** 所有設計決策皆符合憲章原則。
