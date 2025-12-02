# SAML 身份驗證規格書 (SAML Authentication Specification)

**功能分支**: `001-saml-sso-auth`
**狀態**: 草稿 (Draft)
**最後更新**: 2025-12-03

---

## 1. 概述 (Overview)

本規格書定義了 SAVote 系統的身份驗證實作細節。系統區分為兩種登入入口：
1.  **一般投票者**: 透過學校 SAML 2.0 IdP 進行單一登入 (SSO)。
2.  **管理員**: 透過帳號密碼直接登入後台。

此外，本文件涵蓋了使用者 Session 管理 (JWT) 以及客戶端「無效化金鑰 (Nullifier Secret)」的生成與註冊流程，這是實現匿名投票的關鍵。

## 2. 使用者故事 (User Stories)

### US1: 首次登入與金鑰設置 (P1)
**作為** 一名學生，
**我想要** 使用學校帳號登入並生成一個安全的投票金鑰，
**以便** 我可以在未來的選舉中進行匿名投票。

**驗收標準**:
1.  使用者被重導向至學校 IdP 進行驗證。
2.  返回後，若 LocalStorage 中無金鑰，則自動生成新的無效化金鑰 (Nullifier Secret)。
3.  **註冊檢查**: 系統檢查該學號是否已註冊過「鎖頭 (Commitment)」。
    -   若未註冊: 允許上傳新鎖頭。
    -   若已註冊: 拒絕上傳 (防止重複領票)，除非選舉尚未開始。
4.  向使用者顯示金鑰並強烈警告必須備份。
5.  金鑰僅儲存於 LocalStorage，絕不傳送至後端。

> 實作補充：實際上，後端不會接收或儲存金鑰 (Nullifier Secret) 本身，只會接收以該金鑰計算出的 `identityCommitment`。目前系統中使用 `POST /voters/register-commitment` 端點，將某 SAML 使用者在特定選舉下的 `identityCommitment` 綁定到 `EligibleVoter.identityCommitment` 欄位，並於後續由此 Commitment 建構 Merkle Tree 與資格驗證。

### US2: 回訪使用者登入 (P1)
**作為** 一名回訪學生，
**我想要** 登入後系統能自動識別我的投票金鑰，
**以便** 我能立即進入儀表板。

**驗收標準**:
1.  SAML 驗證後，若 LocalStorage 中存在金鑰，直接導向儀表板。
2.  若金鑰遺失，提示使用者手動輸入備份的金鑰。

### US3: 管理員登入 (P1)
**作為** 一名管理員，
**我想要** 透過專屬入口使用帳號密碼登入，
**以便** 進入後台管理選舉。

**驗收標準**:
1.  獨立的 `/admin/login` 頁面。
2.  驗證成功後核發具有 Admin 權限的 JWT。

### US4: 管理員匯入選民 (P2)
**作為** 一名管理員，
**我想要** 匯入合格選民名單 (學號)，
**以便** 系統能利用零知識證明驗證資格。

**驗收標準**:
1.  管理員上傳 CSV (學號, 班級)。
2.  後端根據名單生成 Merkle Tree。
3.  儲存 Merkle Root 用於該場選舉。

---

## 3. 功能需求 (Functional Requirements)

-   **FR-001**: 整合 SAML 2.0 IdP (針對學生)。
-   **FR-002**: 僅提取最小必要屬性 (學號雜湊, 班級)。
-   **FR-003**: 在客戶端生成 256-bit 無效化金鑰 (Nullifier Secret)。
-   **FR-004**: 金鑰僅存於 LocalStorage，鎖頭 (Commitment) 存於伺服器。
-   **FR-005**: 驗證成功後核發 JWT (Access + Refresh)。
-   **FR-006**: 支援從選民名單生成 Merkle Tree。
-   **FR-007**: 實作「註冊鎖定」機制，防止選舉期間更換金鑰。

---

## 4. 實作任務 (Implementation Tasks)

### 第一階段：基礎設置
- [x] T001 定義 Prisma Schema (`User`, `Session`, `Admin`).
- [x] T002 生成 JWT RSA 金鑰對.
- [x] T003 設定 `.env` SAML 參數.

### 第二階段：後端核心
- [x] T010 設定 Passport SAML 策略.
- [x] T014 實作 AuthService (JWT 核發).
- [x] T027 實作 `/auth/saml/login` 端點.
- [x] T028 實作 `/auth/saml/callback` 端點.
- [ ] T029 實作 `/auth/admin/login` 端點 (新增).

### 第五階段：選民註冊與資格驗證 (已實作部分)
- [x] T060 實作 `POST /voters/register-commitment` 端點，使用 JWT 中的 SAML 使用者資訊 (如 studentIdHash) 與輸入的 `commitment` 綁定 `EligibleVoter.identityCommitment`。
- [x] T061 實作 `/voters/verify-eligibility` 端點，根據 `EligibleVoter.identityCommitment` 所構成的 Merkle Tree，回傳 root、leafIndex 與 Merkle path，供前端投票時生成 ZK 證明。

### 第三階段：前端核心
- [x] T015 實作 `crypto.service.ts` (金鑰生成).
- [x] T037 建立登入頁面 (含 SAML 與 Admin 入口).
- [x] T038 建立 Callback 頁面處理 Token.
- [x] T039 建立 Setup 頁面 (金鑰生成與備份提示).

### 第四階段：選民管理
- [x] T059 實作 `/voters/import` 端點.
- [x] T058 實作 Merkle Tree 生成邏輯.

---

## 5. API 合約 (API Contract)

詳見 `specs/api/openapi.yaml`。

### 關鍵端點
-   `GET /auth/saml/login`: 啟動 SSO。
-   `POST /auth/saml/callback`: 處理 IdP 回應。
-   `POST /auth/admin/login`: 管理員登入。
-   `POST /auth/refresh`: 刷新 Access Token。
-   `POST /voters/import`: 匯入合格選民 (Admin)。
