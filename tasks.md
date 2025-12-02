# 開發任務清單 (Development Tasks)

本清單基於 2025-12-03 的實際代碼庫審查結果與架構分析。

## 關鍵架構修正 (Critical Architecture Fixes)

目前資料庫與規格中原始的「以 StudentId 為 Merkle 葉」設計已被更安全的 Commitment 機制取代。
現況是：Prisma 已加入 `EligibleVoter.identityCommitment`，後端與前端部分流程已改為使用 Commitment，但前端尚未導入真正的 Poseidon 雜湊。

- [x] **A01: 修正 ZK 註冊流程資料模型**
    -   Prisma `EligibleVoter` 已新增欄位 `identityCommitment String? @unique`。
    -   Merkle Tree 現在以 `identityCommitment` 作為葉節點，而非 `studentId` 本身。
    -   資料庫層級已能保證每位合格選民在每場選舉最多綁定一個 Commitment。

- [x] **A02: 實作註冊 API**
    -   已實作 `POST /voters/register-commitment`：
        -   由 JWT payload 取得 SAML 使用者識別 (如 `studentIdHash`) 與請求中的 `electionId`、`commitment`。
        -   檢查該 `EligibleVoter` 是否存在、是否已綁定過 `identityCommitment`，以及選舉狀態是否允許註冊 (如 `REGISTRATION_OPEN`)。
        -   成功時將 `identityCommitment` 寫入 `EligibleVoter`，供之後建立/驗證 Merkle Tree 使用。
    -   **後續工作** (移交到 ZK 整合任務): 確保前端真的以 `Commitment = Poseidon(Secret)` 方式計算後再呼叫此 API，而非暫時使用 Secret 本身。

## UI/UX 設計系統 (Liquid Glass Design System)

- [x] **D01: 定義全域設計變數 (`index.css`)**
    -   在 `apps/web/src/index.css` 定義 Liquid Glass 設計系統：主色系、玻璃層背景、光暈邊框、格線背景與 Ripple 動畫等。
    -   提供 `.glass`、`.glass-strong`、`.glass-subtle`、`.glow-blue-border` 等通用樣式，供頁面與元件共用。

- [x] **D02: 實作核心 UI 元件**
    -   `GlassCard`: 核心容器，帶有模糊背景與細微邊框 (已於 `apps/web/src/components/ui/GlassCard.tsx` 實作)。
    -   `GlassButton`: 帶有互動光效的按鈕 (已於 `apps/web/src/components/ui/GlassButton.tsx` 實作)。
    -   `GlassInput`: 半透明輸入框 (已於 `apps/web/src/components/ui/GlassInput.tsx` 實作)。
    -   `AnimatedBackground`: 重寫為實際帶有光球與網格動畫效果的背景元件 (已於 `apps/web/src/components/AnimatedBackground.tsx` 實作)。

- [x] **D03: 頁面佈局 (Layout) 重構**
    -   主要頁面已統一使用 `PageShell` + `AnimatedBackground` + `GlowOrbs` 作為全螢幕動態背景容器。
    -   登入、Admin Login、Dashboard/Home、VotingBooth、VerificationCenter 等頁的頂部區塊皆採用 `.glass` 樣式呈現懸浮玻璃質感 Header。

## 前端頁面開發 (Frontend Implementation)

- [x] **F01: 登入頁面 (Login Page)**
    -   設計: 使用居中玻璃卡片、動畫背景與 Google 風格四色點與 SA Logo (`LoginPage` 已採用 Liquid Glass + AnimatedBackground + GlowOrbs)。
    -   功能: SAML 登入按鈕、管理員登入入口、開發環境 Dev Login 入口。
    -   狀態: 處理登入載入動畫與 Ripple 點擊效果，並鎖定 body 滾動。

- [x] **F02: 金鑰生成與註冊頁面 (Setup/Registration)**
    -   **關鍵頁面**: 這是 ZK 系統的入口。
    -   邏輯 (現況): 
        1. 檢查 LocalStorage 是否有 Nullifier Secret。
        2. 若無，於瀏覽器中生成新的 Secret 並保存於 LocalStorage。
        3. 目前暫以 SecretHex 作為 Commitment 的 placeholder，呼叫 `POST /voters/register-commitment` 註冊至該場選舉。
        4. 若是新裝置或 LocalStorage 遺失，允許使用者貼上先前備份的 Secret 恢復。
    -   UI: 顯示 Secret (具遮罩/顯示切換)，提供 "複製" 或「請妥善備份」提示，強調遺失風險。

- [x] **F03: 儀表板 (Dashboard)**
    -   使用 `HomePage` (App 根路由 `/`) 作為儀表板：
        -   透過 `useAuth` 顯示目前登入使用者資訊 (班級、部分學號雜湊)。
        -   透過 React Query 向 `/elections` 取得選舉列表，以 GlassCard 卡片方式顯示狀態與建立時間。
        -   對每場選舉提供「進入投票」(僅在 `VOTING_OPEN` 時顯示) 與「查看結果 / 驗證」按鈕，RWD 於手機/桌機均可良好顯示。
        -   若使用者角色為 ADMIN，附帶管理員專區卡片，連結到選民管理與選舉管理頁面。

- [x] **F04: 投票亭 (Voting Booth)**
    -   步驟 1: 候選人選擇 (Grid Layout)。
    -   步驟 2: 呼叫 `/voters/verify-eligibility` 取得 Merkle Proof 與 leafIndex，若後端回傳 `COMMITMENT_NOT_REGISTERED`，則自動導向 `/elections/:electionId/setup-key`。
    -   步驟 3: 使用 Web Worker 與 `/zk/vote.wasm`、`/zk/vote_final.zkey` 生成 ZK 證明與 publicSignals (顯示進度/Loading)。
    -   步驟 4: 呼叫 `/votes/submit` 提交選票，成功後導向感謝/成功頁。

- [x] **F05: 開票與驗證頁 (Results & Verify)**
    -   圖表: 顯示各候選人票數與百分比 (目前為基本卡片與列表，未必使用圖表庫，後續可優化)。
    -   驗證器: 在 Verification Center 中提供輸入框與查詢按鈕，透過 `GET /votes/:electionId/check-nullifier/:nullifier` 查詢是否已計票，並顯示「票已入匭 / 未找到」結果。

## 後端邏輯補完 (Backend Logic)

- [ ] **B01: 補完 `AuthService`**
    -   目前已有 Login，需確認 JWT Payload 包含必要資訊。

- [x] **B02: 實作 `ElectionService`**
    -   CRUD 邏輯: 已有建立/查詢/更新/刪除與名冊匯入/檢視，並補上「投票開始後不可再修改或刪除」的保護：在 `VOTING_OPEN` / `VOTING_CLOSED` / `TALLIED` 狀態下，`update` 與 `remove` 會直接拒絕，避免投票期間調整設定。
    -   新增 `finalizeVoterList(electionId)`：
        -   檢查選舉存在與狀態（尚未進入投票階段），並確認該場選舉已匯入至少一筆 `EligibleVoter`。
        -   要求 `Election.merkleRootHash` 必須已事先設定（由管理工具或腳本依 `EligibleVoter.identityCommitment` 列表計算 Merkle Root），否則拒絕 finalize。
        -   成功後將 `Election.status` 切換為 `VOTING_OPEN`，並回傳 `totalVoters` 供前端顯示，對應流程「匯入名冊 → 設定 root → finalize → 開放投票」。
    -   `ElectionsController` 新增 `POST /elections/:id/finalize` 管理員端點，負責觸發上述 finalize 流程。

- [x] **B03: 實作 `VoteService`**
    -   `submitVote()`: 透過 `@savote/crypto-lib.verifyVoteProof` 驗證 ZK Proof，檢查 Merkle Root 是否與選舉設定一致，並確保 Nullifier 唯一後將選票寫入 `Vote` 表。
    -   `getTally()`: 根據 `publicSignals` 還原候選人編號，計算各候選人得票數。
    -   `getAuditLogs()`: 回傳所有選票的匿名資訊 (nullifier、publicSignals、proof 摘要) 供驗證中心使用。
    -   `checkNullifier(electionId, nullifier)`: 依據 `electionId` 與 `nullifier` 查詢是否存在對應投票，僅回傳基本資訊與時間戳，避免洩漏投票內容。

## ZK 電路整合 (ZK Integration)

- [x] **Z01: 編譯與部署電路**
    -   `.wasm` 與 `_final.zkey` 由 `packages/circuits` 產出後，已放置於 `apps/web/public/zk/` 中 (如 `vote.wasm`, `vote_final.zkey`)，供前端載入。

- [x] **Z02: 前端證明生成器 (Web Worker)**
    -   已實作 `proof.worker.ts` 與 hook `useVoteProof`，在瀏覽器中透過 Web Worker 執行 ZK 證明生成，避免阻塞 UI Thread。
    -   前端 VotingBooth 透過此 hook 生成 proof 與 publicSignals，然後提交到後端。

- [ ] **Z03: 前端 Poseidon Commitment 與 Nullifier 實作**
    -   將目前以 SecretHex 充當 Commitment/Nullifier 的暫時作法，改為真正呼叫 Poseidon 雜湊函數：
        -   `commitment = Poseidon(secret)` 作為 Merkle 葉 (KeySetupPage 已改為此實作)。
        -   `nullifier = Poseidon(secret, electionId)` 作為防雙重投票用的公開輸出 (待 VotingBooth/電路完全對齊後標記完成)。
    -   確保電路、前端輸入與後端驗證對此定義完全一致，並更新相關文檔與測試。

- [x] **Z04: 進階驗證工具 (可選)**
    -   在 Verification Center 中提供「匯出 Audit Logs JSON」功能，將所有匿名投票紀錄匯出供第三方審計。
    -   整合 `snarkjs.groth16.verify` 與 `/zk/verification_key.json`，提供本地 proof 驗證工具，讓開發者/審計者可在瀏覽器自行驗證任意 proof 與 publicSignals。

---

**執行順序建議**:
1.  **A01 & A02** (修正資料模型，否則後續都是錯的)
2.  **D01 & D02** (建立 UI 基底)
3.  **F01 & F02** (完成登入與註冊流程)
4.  **B02** (選舉管理與 Merkle Tree 生成)
5.  **Z01 & Z02 & F04** (投票核心流程)

---

## 管理端與開票監控 (Admin & Monitoring)

- [x] **T404: 管理員開票監控平台**
    -   後端：
        -   於 `ElectionsController` 新增 `GET /elections/:id/admin-summary`，僅允許 Admin 使用，內部呼叫 `ElectionsService.findOne` 與 `VotesService.getTally`。
        -   回傳內容包含：`election` 物件本身、目前 `status`、`totalVotes`（總投票數）與每位候選人 (UUID) 對應的 `tally` 計票結果。
        -   `VotesService.getTally` 本身已限定只在 `VOTING_CLOSED` / `TALLIED` 狀態下可成功取得結果，確保開票只在投票結束後進行。
    -   前端：
        -   新增 `AdminMonitoringPage` (`/admin/monitoring`)，僅在使用者角色為 Admin 且透過 `ProtectedRoute` 時可進入。
        -   透過 `/elections` 列出所有選舉，UI 僅允許從狀態為 `VOTING_CLOSED` / `TALLIED` 的選舉中選擇，呼叫 `GET /elections/:id/admin-summary` 後顯示：
            -   選舉名稱與狀態
            -   總投票數 (totalVotes)
            -   按候選人 UUID 分組的得票統計列表
        -   頁面只呈現 aggregate 統計資訊，不顯示任何 voter 身份或單筆 proof，與隱私/匿名性要求一致，且明確符合「投票結束後才開放開票監控」的 speckit 要求。
