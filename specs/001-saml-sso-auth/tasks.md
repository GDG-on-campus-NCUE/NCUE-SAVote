# 任務列表：SAML SSO 驗證與 Nullifier Secret 管理

**輸入**: `/specs/001-saml-sso-auth/` 下的設計文件  
**先決條件**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**測試**: 根據 research.md 定義的測試策略（Jest 單元測試、Supertest 整合測試、Playwright E2E 測試）

**組織方式**: 任務按使用者故事分組，以實現每個故事的獨立實作與測試（規格驅動開發方法論）。

---

## 格式: `[ID] [P?] [Story] 描述`

- **[P]**: 可平行執行（不同檔案，無相依性）
- **[Story]**: 此任務所屬的使用者故事（例如 US1, US2, US3）
- 描述中包含確切的檔案路徑

## 路徑慣例 (來自 plan.md)

- **後端**: `apps/api/src/`
- **前端**: `apps/web/src/`
- **共用型別**: `packages/shared-types/src/`
- **測試**: `apps/api/test/`, `apps/web/tests/`

---

## 第一階段：設定 (共用基礎設施)

**目的**: 專案初始化與基本結構

- [x] T001 建立 Prisma schema (`User`, `Session`, `EligibleVoter`, `Election`) 於 `apps/api/prisma/schema.prisma`
- [x] T002 [P] 產生 JWT 簽章用的 RSA 金鑰對（私鑰/公鑰）並存於 `apps/api/secrets/`
- [x] T003 [P] 建立環境變數設定檔 `.env`：後端 (`apps/api/.env`) 與前端 (`apps/web/.env`)
- [x] T004 [P] 安裝後端依賴 (@node-saml/passport-saml, @nestjs/passport, @nestjs/jwt, jsonwebtoken, merkletreejs) 於 `apps/api/package.json`
- [x] T005 [P] 安裝前端依賴 (zustand, @tanstack/react-query, axios) 於 `apps/web/package.json`
- [x] T006 執行 Prisma migration 建立資料庫資料表：`cd apps/api && pnpm prisma migrate dev --name init`

---

## 第二階段：基礎建設 (阻擋性先決條件)

**目的**: 核心基礎設施，必須在任何使用者故事開始前完成

**⚠️ 關鍵**: 此階段完成前，無法開始任何使用者故事的工作

- [x] T007 建立共用 TypeScript 型別於 `packages/shared-types/src/auth.types.ts` (JWTPayload, User, AuthResponse, SAMLAttributes)
- [x] T008 [P] 建立共用 TypeScript 型別於 `packages/shared-types/src/voter.types.ts` (EligibleVoter, VerifyEligibilityRequest/Response)
- [x] T009 [P] 建立共用 TypeScript 型別於 `packages/shared-types/src/error.types.ts` (APIError, ValidationError)
- [x] T010 [P] 設定 NestJS Passport SAML strategy 於 `apps/api/src/auth/saml.strategy.ts`
- [x] T011 [P] 設定 NestJS Passport JWT strategy 於 `apps/api/src/auth/jwt.strategy.ts`
- [x] T012 [P] 建立 JWT auth guard 於 `apps/api/src/auth/guards/jwt-auth.guard.ts`
- [x] T013 [P] 建立 SAML auth guard 於 `apps/api/src/auth/guards/saml-auth.guard.ts`
- [x] T014 實作 AuthService 核心方法於 `apps/api/src/auth/auth.service.ts` (issueJWT, validateJWT, refreshToken)
- [x] T015 [P] 建立前端加密服務於 `apps/web/src/features/auth/services/crypto.service.ts` (generateNullifierSecret, nullifierToHex)
- [x] T016 [P] 建立前端 LocalStorage 工具於 `apps/web/src/lib/localStorage.ts`
- [x] T017 [P] 建立前端常數檔於 `apps/web/src/lib/constants.ts` (STORAGE_KEYS, TOKEN_EXPIRY, API_ENDPOINTS)
- [x] T018 設定 Zustand auth store 於 `apps/web/src/features/auth/stores/authStore.ts`
- [x] T019 [P] 設定 Axios interceptors 處理 token refresh 於 `apps/web/src/features/auth/services/auth.api.ts`
- [x] T020 [P] 設定 React Query provider 於 `apps/web/src/App.tsx`

**檢查點**: 基礎建設已就緒 - 使用者故事實作可平行展開

---

## 第三階段：使用者故事 1 - 首次使用者登入與 Nullifier Secret 設定 (優先級: P1) 🎯 MVP

**目標**: 學生完成 SAML SSO 驗證，後端發放 JWT token，前端產生加密 nullifier secret 並存於 LocalStorage

### 使用者故事 1 的測試

- [x] T021 [P] [US1] 建立 crypto.service.ts 單元測試於 `apps/web/tests/unit/crypto.service.test.ts`
- [x] T022 [P] [US1] 建立 auth.service.ts JWT 方法單元測試於 `apps/api/test/unit/auth.service.test.ts`
- [x] T023 [P] [US1] 建立 SAML callback 端點整合測試於 `apps/api/test/integration/auth.controller.test.ts`
- [x] T024 [US1] 建立首次登入流程 E2E 測試於 `apps/web/tests/e2e/first-time-login.spec.ts`

### 使用者故事 1 的後端實作

- [x] T025 [P] [US1] 建立 User Prisma entity 方法於 `apps/api/src/users/users.service.ts`
- [x] T026 [P] [US1] 建立 Session Prisma entity 方法於 `apps/api/src/users/users.service.ts`
- [x] T027 [US1] 實作 SAML 登入端點 (GET /auth/saml/login) 於 `apps/api/src/auth/auth.controller.ts`
- [x] T028 [US1] 實作 SAML callback 端點 (POST /auth/saml/callback) 於 `apps/api/src/auth/auth.controller.ts`
- [x] T029 [US1] 實作使用者個人資料端點 (GET /users/me) 於 `apps/api/src/users/users.controller.ts`
- [x] T030 [US1] 加入 SAML 屬性驗證於 `apps/api/src/auth/dto/saml-callback.dto.ts`
- [x] T031 [US1] 實作學號 SHA-256 雜湊於 `apps/api/src/auth/auth.service.ts`

### 使用者故事 1 的前端實作

- [x] T032 [P] [US1] 建立 LoginButton 元件於 `apps/web/src/features/auth/components/LoginButton.tsx`
- [x] T033 [P] [US1] 建立 SAMLCallback 元件於 `apps/web/src/features/auth/components/SAMLCallback.tsx`
- [x] T034 [P] [US1] 建立 NullifierSetup 元件於 `apps/web/src/features/auth/components/NullifierSetup.tsx`
- [x] T035 [US1] 實作 useNullifierSecret hook 於 `apps/web/src/features/auth/hooks/useNullifierSecret.ts`
- [x] T036 [US1] 實作 useAuth hook 於 `apps/web/src/features/auth/hooks/useAuth.ts`
- [x] T037 [US1] 建立 LoginPage 於 `apps/web/src/features/auth/pages/LoginPage.tsx`
- [x] T038 [US1] 建立 CallbackPage 於 `apps/web/src/features/auth/pages/CallbackPage.tsx`
- [x] T039 [US1] 建立 SetupPage 於 `apps/web/src/features/auth/pages/SetupPage.tsx`
- [x] T040 [US1] 加入路由設定於 `apps/web/src/App.tsx`

**檢查點**: 使用者故事 1 功能完整 - 首次使用者可登入、取得 JWT、產生 nullifier secret 並進入儀表板

---

## 第四階段：使用者故事 2 - 回訪使用者登入與 Secret 驗證 (優先級: P1)

**目標**: 回訪學生透過 SAML 登入，系統檢查 LocalStorage 是否有 nullifier secret，若有則導向儀表板，若無則提示手動輸入

### 使用者故事 2 的測試

- [x] T042 [P] [US2] 建立 useNullifierSecret hook 驗證單元測試於 `apps/web/tests/unit/useNullifierSecret.test.ts`
- [x] T043 [US2] 建立回訪使用者流程 E2E 測試於 `apps/web/tests/e2e/returning-user-login.spec.ts`
- [x] T044 [US2] 建立 Secret 復原流程 E2E 測試於 `apps/web/tests/e2e/nullifier-recovery.spec.ts`

### 使用者故事 2 的後端實作

- [x] T045 [US2] 實作 token refresh 端點 (POST /auth/refresh) 於 `apps/api/src/auth/auth.controller.ts`
- [x] T046 [US2] 加入 session 過期檢查邏輯於 `apps/api/src/auth/auth.service.ts`

### 使用者故事 2 的前端實作

- [x] T047 [P] [US2] 建立 NullifierRecovery 元件於 `apps/web/src/features/auth/components/NullifierRecovery.tsx`
- [x] T048 [US2] 實作 nullifier secret 驗證邏輯於 `apps/web/src/features/auth/hooks/useNullifierSecret.ts`
- [x] T049 [US2] 更新 CallbackPage 以檢查既有 nullifier secret 於 `apps/web/src/features/auth/pages/CallbackPage.tsx`
- [x] T050 [US2] 加入 token 自動 refresh 邏輯於 Axios interceptor `apps/web/src/features/auth/services/auth.api.ts`
- [x] T051 [US2] 實作登出功能於 `apps/web/src/features/auth/hooks/useAuth.ts`
- [x] T052 [US2] 加入登出按鈕至儀表板/標頭元件

**檢查點**: 使用者故事 1 與 2 皆獨立運作 - 回訪使用者可無縫登入或復原 secret

---

## 第五階段：使用者故事 3 - 管理員發起的使用者驗證 (優先級: P2)

**目標**: 管理員匯入合格選民 CSV，系統產生 Merkle Tree root hash 用於零知識資格驗證

### 使用者故事 3 的測試

- [x] T053 [P] [US3] 建立 Merkle Tree 產生單元測試於 `apps/api/test/unit/voters.service.test.ts`
- [x] T054 [P] [US3] 建立選民匯入端點整合測試於 `apps/api/test/integration/voters.controller.test.ts`
- [x] T055 [US3] 建立資格驗證端點整合測試於 `apps/api/test/integration/voters.controller.test.ts`

### 使用者故事 3 的後端實作

- [x] T056 [P] [US3] 建立 EligibleVoter Prisma entity 方法於 `apps/api/src/voters/voters.service.ts`
- [x] T057 [US3] 實作選民匯入 CSV 解析器於 `apps/api/src/voters/voters.service.ts`
- [x] T058 [US3] 實作 Merkle Tree 產生邏輯於 `apps/api/src/voters/voters.service.ts`
- [x] T059 [US3] 實作選民匯入端點 (POST /voters/import) 於 `apps/api/src/voters/voters.controller.ts`
- [x] T060 [US3] 實作資格驗證端點 (POST /voters/verify-eligibility) 於 `apps/api/src/voters/voters.controller.ts`
- [x] T061 [US3] 加入管理員權限檢查 guard 於 `apps/api/src/voters/voters.controller.ts`
- [x] T062 [US3] 實作匯入時的重複選民偵測於 `apps/api/src/voters/voters.service.ts`

### 使用者故事 3 的前端實作 (管理後台)

- [x] T063 [P] [US3] 建立 VoterImport 元件於 `apps/web/src/features/admin/components/VoterImport.tsx`
- [x] T064 [US3] 建立 voter API client 於 `apps/web/src/features/auth/services/voter.api.ts`
- [x] T065 [US3] 加入選民匯入頁面至管理後台 `apps/web/src/features/admin/pages/VoterManagementPage.tsx`

**檢查點**: 所有使用者故事皆獨立功能正常 - 管理員可匯入選民，使用者可驗證資格

---

## 第六階段：修飾與跨切面關注點

**目的**: 影響多個使用者故事的改進

### 後端安全性與效能

- [x] T066 [P] 加入 auth 端點速率限制 (Rate Limiting) 於 `apps/api/src/auth/auth.controller.ts`
- [x] T067 [P] 加入安全性標頭 (HSTS, CSP) 於 `apps/api/src/main.ts`
- [x] T068 [P] 實作 CORS 設定於 `apps/api/src/main.ts`
- [x] T069 [P] 加入 DTO 輸入驗證 (class-validator) 於 `apps/api/src/`
- [x] T070 [P] 建立 Swagger/OpenAPI 文件產生於 `apps/api/src/main.ts`
- [x] T071 [P] 加入錯誤日誌記錄 (Logger) 於 AuthService 與 VotersService
- [x] T072 [P] 實作 Session 清理 cron job 於 `apps/api/src/auth/auth.service.ts`
- [x] T073 [P] 加入資料庫索引以提升效能

### UI/UX 設計系統與一致性

- [x] T074 [P] 建立設計系統基礎於 `apps/web/src/styles/design-system.css`
- [x] T075 [P] 定義可重用 UI 元件於 `apps/web/src/components/ui/`
- [ ] T076 [P] 實作響應式佈局系統於 `apps/web/src/components/Layout.tsx`
- [ ] T077 [P] 建立一致的導覽標頭於 `apps/web/src/components/Header.tsx`
- [ ] T078 [P] 建立一致的頁尾於 `apps/web/src/components/Footer.tsx`
- [ ] T079 [P] 應用一致的間距與佈局至所有驗證頁面
- [ ] T080 [P] 確保所有表單遵循一致的驗證 UI 模式
- [ ] T081 [P] 加入專業的載入狀態與 Skeleton 畫面
- [ ] T082 [P] 實作一致的錯誤邊界 (Error Boundary)
- [ ] T083 [P] 測試跨斷點的響應式設計
- [ ] T084 [P] 實作深色模式支援 (選用)
- [ ] T085 [P] 加入無障礙功能 (ARIA labels, 鍵盤導覽)

### GDPR 與文件

- [ ] T086 [P] 實作 GDPR 合規 Cookie 同意橫幅
- [ ] T087 執行完整 quickstart.md 驗證流程
- [ ] T088 建立生產環境部署檢核表與環境變數文件於 `docs/deployment.md`

---

## 依賴關係與執行順序

### 階段依賴

- **設定 (Phase 1)**: 無依賴 - 可立即開始
- **基礎建設 (Phase 2)**: 依賴設定完成 - 阻擋所有使用者故事
- **使用者故事 1 (Phase 3)**: 依賴基礎建設完成
- **使用者故事 2 (Phase 4)**: 依賴基礎建設完成 - 可與 US1 平行
- **使用者故事 3 (Phase 5)**: 依賴基礎建設完成 - 可與 US1/US2 平行
- **修飾 (Phase 6)**: 依賴所有預期的使用者故事完成

### 成功標準驗證

所有任務完成後，根據 spec.md 成功標準進行驗證：

- [ ] **SC-001**: 使用者在 60 秒內完成首次登入 + nullifier 設定
- [ ] **SC-002**: 95% 回訪使用者無需手動輸入 nullifier 即可登入
- [ ] **SC-003**: 99.9% SAML 驗證成功率
- [ ] **SC-004**: 後端資料庫中無任何 nullifier secret
- [ ] **SC-005**: 管理員在 2 分鐘內匯入 1000+ 選民
- [ ] **SC-006**: 90%+ nullifier secret 復原成功率
