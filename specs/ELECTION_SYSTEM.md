# 選舉系統與 ZK 電路規格書 (Election System & ZK Circuits Specification)

**功能分支**: `002-election-system`
**狀態**: 進行中 (In Progress)
**最後更新**: 2025-12-03

---

## 1. 概述 (Overview)

本規格書涵蓋核心選舉管理邏輯與零知識證明 (ZKP) 電路實作。定義了如何建立選舉、管理候選人 (含雙人組合)、以及如何匿名提交與驗證選票。

## 2. 使用者故事 (User Stories)

### US4: 候選人與選舉管理 (P1)
**作為** 一名管理員，
**我想要** 建立選舉並管理候選人，
**以便** 設定選舉規則並讓選民知道投給誰。

**驗收標準**:
1.  **建立選舉**: 設定標題、開始/截止時間。
2.  **設定規則**: 定義當選門檻 (前 N 高票)、有效投票率門檻。
3.  **候選人管理**: 支援單人或雙人組合 (President/VP)，上傳姓名、簡介、照片 (支援兩張)。
4.  **開票監控**: 僅在選舉結束後，才能查看投票率與結果。

### US5: ZK 電路實作 (P1)
**作為** 一名開發者，
**我想要** 實作 Groth16 電路，
**以便** 在不洩漏選民身分的情況下證明選票有效。

**驗收標準**:
1.  電路驗證 Merkle Proof (資格)。
2.  電路生成 Nullifier (唯一性)。
3.  電路輸出 Vote Hash (完整性)。

### US6: 選票提交 (P1)
**作為** 一名選民，
**我想要** 使用 ZK 證明提交選票，
**以便** 我的票被計入但身分保持秘密。

**驗收標準**:
1.  **列表檢視**: 看到所有進行中選舉及截止日期。
2.  **客戶端生成**: 在 Web Worker 中生成證明。
3.  **後端驗證**: 驗證證明有效性與 Nullifier 唯一性。
4.  **結果查看**: 選舉結束後可查看開票結果。

---

## 3. 實作任務 (Implementation Tasks)

### 第一階段：資料庫與候選人
- [x] T101 更新 Prisma Schema (`Candidate`, `Vote`, `ElectionRules`).
- [x] T104 實作 Candidate CRUD Service (支援多照片/雙人).
- [x] T105 實作 Candidate Management API.

### 第二階段：ZK 電路
- [x] T201 初始化 `packages/circuits`.
- [x] T202 實作 `vote.circom` (Merkle + Nullifier).
- [x] T203 撰寫電路單元測試.
- [x] T204 執行 Trusted Setup (Powers of Tau).
- [x] T205 實作 `crypto-lib` (證明生成).

### 第三階段：投票流程
- [x] T301 實作 `/votes/submit` API.
    -   雙重投票檢查 (Nullifier).
    -   證明驗證 (Proof Verification).
    -   Merkle Root 檢查.
- [x] T302 實作投票亭 UI (Voting Booth).
- [x] T303 整合 Web Worker 進行證明生成.

### 第四階段：計票與稽核
- [x] T401 實作計票 API (Tally).
- [x] T402 實作稽核日誌 API (Audit Logs).
- [x] T403 實作驗證中心 UI (Verification Center)，包含:
    - 結果總覽卡片 (各候選人得票數 / 百分比)。
    - 稽核日誌列表 (列出每筆投票的 `nullifier` 與 `publicSignals`、`proof` 摘要)。
    - Nullifier 自助驗證區塊 (使用者輸入自己的 Nullifier 並檢查是否存在)。
- [x] T405 進階驗證工具 (Developer/審計者用)：
    - 提供「匯出 Audit Logs JSON」功能，將所有匿名投票紀錄匯出為 `savote-audit-<electionId>.json` 供離線分析。
    - 在前端整合 `snarkjs.groth16.verify`，載入 `/zk/verification_key.json`，
      允許開發者在瀏覽器中選取單筆投票，對 `publicSignals` 與 `proof` 進行本地驗證，確認其與 verifier key/電路相容。
- [ ] T404 實作管理員開票監控平台 (僅限選後)。

---

## 4. 電路設計 (Circuit Design)

### 輸入 (Inputs)
-   **Public**: `root` (Merkle Root), `electionId`, `vote` (Candidate ID).
-   **Private**: `secret` (Nullifier Secret), `pathIndices`, `siblings` (Merkle Path).

### 輸出 (Outputs)
-   **Commitment (隱含於 Merkle 葉)**: `Poseidon(secret)`，作為 EligibleVoter Merkle Tree 的葉節點，對應到資料庫欄位 `EligibleVoter.identityCommitment`。
-   **Nullifier Hash**: `Poseidon(secret, electionId)` - 防止雙重投票。這個值出現在電路的 publicSignals 中，後端會據此檢查是否重複投票。
-   **Vote Hash**: `Poseidon(electionId, vote)` - 綁定選票與該場選舉，用於後端計票與檢查資料一致性。

> 實作現況: 
> - 前端 `KeySetupPage` 已使用 `Poseidon(secret)` 計算 commitment，並透過 `POST /voters/register-commitment` 寫入 `EligibleVoter.identityCommitment`，與電路的 Merkle 葉定義一致。
> - 前端 `VotingBooth` 會將 `root`、`electionId`、`vote`、`secret`、`pathIndices`、`siblings` 傳入 Web Worker，Web Worker 透過 `vote.wasm`/`vote_final.zkey` 生成 proof 與 publicSignals，其中的一個公開訊號即為 `Poseidon(secret, electionId)` (nullifier)。
> - 後端 `@savote/crypto-lib.verifyVoteProof` 使用相同的 `verification_key.json` 驗證 proof/publicSignals，並以 publicSignals 中的 nullifier 做雙重投票檢查，確保整條鏈使用同一套 Poseidon 定義。

### 公開訊號順序 (Public Signals Layout)

目前 `@savote/crypto-lib` 與 `VotesService` 對 publicSignals 的約定為一個長度為 5 的陣列，順序如下：

1.  `publicSignals[0]` = `nullifierHash` = `Poseidon(secret, electionId)`
2.  `publicSignals[1]` = `voteHash` = `Poseidon(electionId, vote)`
3.  `publicSignals[2]` = `root` (Merkle Root)
4.  `publicSignals[3]` = `electionId` (以 bigint string 表示的 UUID)
5.  `publicSignals[4]` = `vote` (以 bigint string 表示的候選人 UUID)

後端 `VotesService` 會依照此順序解析 publicSignals：

- 在 `submitVote()` 中：
    - 將 `publicSignals[0]` 視為唯一的 `nullifier`，用於資料庫中的 `vote.nullifier` 欄位以及雙重投票檢查。
    - 使用 `publicSignals[2]` 與資料庫中的 `election.merkleRootHash` 比較，以確認資格證明對應的 Merkle Root 無誤。
    - 可選地比對 `publicSignals[3]` 與 DTO 中的 `electionId` (需考慮 UUID ↔ bigint 的轉換)，確保電路輸入與 API 層一致。

- 在 `getTally()` 中：
    - 讀取 `publicSignals[4]` 作為 `voteBigInt`，再透過 `bigIntToUuid` 轉回候選人 `candidateId`，計算每位候選人票數。

此順序為前端、電路與後端共同遵守的「單一事實來源」，未來若需變更 publicSignals 結構，必須同時更新：

- Circom 電路輸出順序；
- `packages/crypto-lib` 的 `generateVoteProof` 測試與文件；
- 後端 `VotesService` 中對 publicSignals 的解析邏輯；
- 本規格文件中本段落的說明。

---

## 5. API 合約 (API Contract)

### 關鍵端點
-   `POST /elections`: 建立選舉 (Admin).
-   `POST /elections/:id/candidates`: 新增候選人 (Admin).
-   `POST /votes/submit`: 提交 ZK 選票.
-   `GET /verify/:id/logs`: 取得稽核日誌.
-   `GET /elections/:id/results`: 取得結果 (限選後).
-   `GET /votes/:electionId/check-nullifier/:nullifier`: 依 Nullifier 查詢投票是否存在 (僅回傳存在與時間戳，不含候選人資訊)。


