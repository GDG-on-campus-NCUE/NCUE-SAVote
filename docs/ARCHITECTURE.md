# SAVote 系統架構文檔

## 1. 系統概述 (System Overview)

SAVote 是一個專為 NCUESA 設計的去中心化投票系統，利用 **Groth16 零知識證明 (ZKP)** 技術來確保投票的隱私性與可驗證性。與傳統的中心化系統不同，SAVote 從數學上保證了選票的匿名性，同時保持可驗證性。

### 核心技術 (Core Technologies)

- **前端 (Frontend)**: React 18, Vite, TailwindCSS
- **後端 (Backend)**: NestJS (Node.js), Prisma ORM
- **資料庫 (Database)**: PostgreSQL 16, Redis (Session/Caching)
- **驗證 (Auth)**: SAML 2.0 (Passport.js), JWT
- **零知識證明 (ZKP)**: Circom 2.1, SnarkJS, Groth16 (BN128 curve)
- **基礎設施 (Infrastructure)**: Docker, Nginx

---

## 2. 高層架構 (High-Level Architecture)

```text
[客戶端瀏覽器 Client Browser]
      |
    (HTTPS)
      |
[負載平衡器 / Nginx 反向代理]
      |
      +-----> [前端容器] (靜態資源 / React App)
      |
      +-----> [後端容器叢集] (NestJS API)
                     |
        +------------+------------+
        |            |            |
   [PostgreSQL]   [Redis]    [日誌服務]
```

### 關鍵組件 (Key Components)

1.  **前端 (Web Client)**:
    -   透過 Nginx 託管。
    -   使用 Web Workers (WASM) 在客戶端生成 ZK 證明。
    -   透過 SAML/JWT 管理驗證狀態。

2.  **後端 (API)**:
    -   處理業務邏輯、選舉管理與選票提交。
    -   在記錄選票前驗證 ZK 證明。
    -   管理使用者 Session 與資格。

3.  **資料庫 (PostgreSQL)**:
    -   儲存選舉資料、候選人資訊與匿名選票記錄。
    -   **關鍵**: 絕不儲存使用者與其選票之間的關聯。

---

## 3. 零知識證明與金鑰管理機制 (ZK & Key Management)

本系統採用「承諾 (Commitment) 與註冊」機制來解決匿名性與唯一性的衝突。

### 3.1 金鑰角色定義
-   **無效化金鑰 (Nullifier Secret)**: 
    -   由使用者瀏覽器生成並保存在 LocalStorage 的私鑰。
    -   **用途 1 (資格證明)**: 證明「我在合格選民名單 (Merkle Tree) 上」，但不透露具體身分。
    -   **用途 2 (防止重覆)**: 每次投票時，系統透過此金鑰計算出唯一的「代號 (Nullifier)」。針對同一場選舉，同一金鑰算出的代號永遠相同。

### 3.2 運作流程
系統流程分為「註冊階段」與「投票階段」：

1.  **第一步：綁定身分（註冊階段）**
    -   使用者透過 SAML 登入 (學校知道你是誰)。
    -   瀏覽器生成金鑰 (Secret)，並算出公開的「鎖頭 (Commitment)」。
    -   將「鎖頭」傳送給伺服器。
    -   **關鍵**: 伺服器記錄「學號 A 已經註冊過鎖頭了」，但不儲存金鑰本身。

2.  **第二步：匿名投票（投票階段）**
    -   使用者使用金鑰 (Secret) 生成證明並投票。
    -   伺服器只檢查證明是否有效 (是否來自合法的鎖頭集合)，不知道具體是誰投的。

### 3.3 金鑰遺失處理政策
若使用者遺失金鑰 (Nullifier Secret)，處理方式取決於選舉狀態：

-   **情況 A：選舉尚未開始 (準備階段)**
    -   **允許重置**。使用者可重新登入，系統允許覆蓋舊的鎖頭 (更新 Commitment)。舊金鑰隨之作廢。

-   **情況 B：選舉已經開始 (進行中)**
    -   **禁止重置**。一旦選舉開始，合格選民名單 (Merkle Tree Root) 已被鎖定以確保公平性。
    -   若此時允許更換鎖頭，將改變 Merkle Tree Root，影響驗證一致性。
    -   **結論**: 在選舉期間遺失金鑰，視同放棄該次投票權 (如同遺失實體選票)。

-   **防止重複投票機制**:
    -   若使用者已投票後遺失金鑰並試圖生成新金鑰，系統會在註冊階段檢查發現「此學號已註冊過鎖頭」，拒絕新註冊。
    -   因新鎖頭未進入 Merkle Tree，其生成的證明將無效。

---

## 4. 驗證架構 (Authentication Architecture)

系統支援兩種登入入口：

1.  **一般投票者 (Voter)**: 透過學校 SAML SSO 登入。
2.  **管理員 (Admin)**: 透過帳號密碼直接登入後台。

### SAML 流程 (投票者)
1.  使用者點擊「登入」 -> 重導向至 IdP (Synology C2 Identity)。
2.  使用者在 IdP 完成驗證。
3.  IdP 發送 SAML Response 至 `SAVote API`。
4.  API 驗證簽章，提取屬性 (學號雜湊)，並發發 JWT。

### 環境變數配置 (`apps/api/.env`)
```env
SAML_ENTRY_POINT="https://..."
SAML_ISSUER="https://api.voting.ncuesa.edu.tw/saml/metadata"
SAML_CALLBACK_URL="https://api.voting.ncuesa.edu.tw/auth/saml/callback"
SAML_IDP_CERT="-----BEGIN CERTIFICATE-----..."
```

---

## 5. 資料庫設計 (Database Design)

### Schema 概覽

-   **User**: 儲存使用者資格資訊 (學號雜湊、班級)。*此處不連結投票紀錄。*
-   **Election**: 儲存選舉元數據 (標題、日期、規則配置)。
-   **Candidate**: 連結至選舉的候選人 (支援單人或雙人組合)。
-   **Vote**: 儲存匿名選票。
    -   `nullifier`: 來自使用者金鑰 + 選舉 ID 的唯一雜湊。
    -   `proof`: ZK 證明字串。
    -   `publicSignals`: 用於驗證的公開輸入。

---

## 6. 頁面流程與模組規劃 (UI/UX Flow)

### 6.1 管理員後台 (Admin Dashboard)
*權限: 僅限管理員帳號登入*

1.  **選舉管理模組**:
    -   **建立選舉**: 設定標題、開始/截止時間。
    -   **規則設定**: 設定當選門檻 (前 N 高票)、有效投票率門檻。
    -   **候選人管理**: 
        -   建立候選人/候選組合 (支援雙人)。
        -   上傳姓名、簡介、照片 (支援兩張)。

2.  **開票監控平台**:
    -   **狀態**: 僅在「選舉結束」後開放數據。
    -   **指標**: 顯示總投票數、投票率、各候選人得票數、當選狀態。

### 6.2 一般使用者前台 (Voter Interface)
*權限: 透過 SAML 登入之學生*

1.  **登入頁面** (`/auth/login`):
    -   提供 SAML SSO 登入按鈕。
    -   管理員登入入口連結 (`/auth/admin/login`)。

2.  **金鑰生成/管理頁面** (`/elections/:electionId/setup-key`):
    -   **觸發條件**: 使用者已透過 SAML 登入，且在進入某場選舉投票前，後端回報尚未註冊 Commitment。
    -   **生成金鑰**: 由前端在瀏覽器中生成 256-bit 無效化金鑰 (Nullifier Secret)。
    -   **LocalStorage 儲存**: 將 Secret 以十六進位形式暫存於 LocalStorage，之後投票流程會直接讀取。
    -   **備份策略**: 明確要求使用者離線備份 (複製到密碼管理器或下載文字檔)。
    -   **換裝置場景**: 若 LocalStorage 中沒有金鑰，頁面會要求使用者「貼上先前備份的金鑰」，避免在新裝置上生成不同 Secret 導致身分不一致。
    -   **註冊 Commitment**: 生成或恢復 Secret 後，計算 `Commitment = Poseidon(Secret)` (目前實作中暫以 SecretHex 作為 placeholder，後續會改為真正 Poseidon)，呼叫 `POST /voters/register-commitment` 將 Commitment 綁定到特定選舉與身分。

3.  **選舉列表頁面** (Dashboard `/`):
    -   顯示所有進行中與即將開始的選舉。
    -   明確標示「投票截止日期」。
    -   顯示使用者在各場選舉中的註冊狀態 (已註冊 Commitment / 未註冊)。

4.  **單一選舉投票頁面 (Voting Booth)** (`/vote/:electionId`):
    -   顯示候選人列表 (照片、簡介)。
    -   **Eligibility & Guard**:
        -   進入頁面時前端會向後端呼叫 `/voters/verify-eligibility`，取得該使用者的 Merkle Proof 與 leafIndex。
        -   若後端回傳錯誤碼 `COMMITMENT_NOT_REGISTERED`，則前端自動導向 `/elections/:electionId/setup-key` 要求先完成金鑰註冊。
    -   **投票確認與 ZK 證明生成**:
        -   使用者選擇候選人後，前端組成電路輸入 (Merkle Root、Merkle Path、Nullifier Secret、ElectionId、候選人編號)。
        -   透過 Web Worker 載入 `/zk/vote.wasm` 與 `/zk/vote_final.zkey` 生成 Groth16 證明與 publicSignals。
        -   完成後呼叫 `POST /votes/submit` 提交選票。

5.  **開票結果頁面** (`/verify/:electionId`):
    -   僅在選舉結束後顯示公開結果。
    -   顯示各候選人得票數與投票率。
    -   使用玻璃質感卡片與圖表呈現結果。

6.  **驗證中心與 Nullifier 自助驗證頁面** (`/verify/:electionId` 同頁):
    -   **Audit Logs 區塊**:
        -   顯示所有匿名選票的 `nullifier`、`proof`、`publicSignals` (以 JSON 或精簡格式呈現)，供技術人員或審計者下載與檢查。
        -   提供「匯出 Audit Logs JSON」按鈕，將目前選舉的所有投票紀錄匯出為 `savote-audit-<electionId>.json`，方便離線分析與第三方審計。
        -   供開發者選取單筆投票，搭配本地 proof 驗證工具使用。
    -   **Nullifier 查詢區塊**:
        -   提供輸入框讓一般使用者輸入自己的 Nullifier。
        -   前端呼叫 `GET /votes/:electionId/check-nullifier/:nullifier`。
        -   伺服器回傳 `{ exists: boolean, vote?: { id, nullifier, createdAt } }`，不洩漏任何候選人資訊。
        -   若 `exists === true`，畫面顯示「票已入匭」及投票時間；若否，顯示「未找到紀錄」。
    -   **本地 ZK 驗證工具 (進階功能)**:
        -   前端載入 `/zk/verification_key.json` (與後端/電路使用的 verifier key 一致)。
        -   利用 `snarkjs.groth16.verify(verificationKey, publicSignals, proof)` 在瀏覽器端直接驗證任一筆 audit log 的 proof。
        -   驗證結果 (成功/失敗與錯誤訊息) 以開發者區塊顯示，協助確認「鏈上/資料庫中的 proof 與 verifier key 數學上相容」。

---

## 7. API 設計 (API Design)

### 核心端點

-   **Auth**:
    -   `POST /auth/saml/login`: 啟動 SSO。
    -   `POST /auth/admin/login`: 管理員登入。
    -   `GET /auth/me`: 取得當前使用者狀態。

-   **Elections**:
    -   `GET /elections`: 列出選舉。
    -   `POST /elections`: 建立選舉 (Admin)。
    -   `POST /elections/:id/candidates`: 新增候選人 (Admin)。

-   **Votes**:
    -   `POST /votes/submit`: 提交 ZK 選票。
        -   Payload: `{ proof, publicSignals, electionId }`
    -   `GET /votes/:id/result`: 取得計票結果 (限選後)。

---

## 8. 安全考量 (Security Considerations)

1.  **雙重投票 (Double Voting)**: 透過 ZK 電路中的 `Nullifier` 機制防止。
2.  **投票隱私 (Vote Privacy)**: 後端僅能看到證明與 Nullifier，無法連結至使用者身分。
3.  **前端完整性 (Frontend Integrity)**: 使用 SRI 與 CSP。
4.  **速率限制 (Rate Limiting)**: 防止 API 濫用。

