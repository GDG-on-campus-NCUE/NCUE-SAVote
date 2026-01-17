# SAVote 系統架構與實作規劃書

**版本:** 2.1.0 (OIDC & ZK Complete)
**最後更新:** 2026-01-18

---

## 1. 系統核心架構 (System Architecture)

本系統採用 **Hybrid Architecture**，結合中心化的身份驗證 (SSO) 與去中心化的隱私證明 (ZKP)。

### 1.1 身份與匿名流程 (The Privacy Flow)

為了確保「投票權」與「投票內容」的連結被切斷，我們採用以下流程：

1.  **身份驗證 (Auth):** 使用者透過 **NCUE OIDC** 登入，後端驗證學籍資格並取得 `StudentIdHash`。
2.  **匿名識別證 (Identity Commitment):**
    *   使用者瀏覽器端生成隨機秘密 `Nullifier Secret`。
    *   前端計算 `Identity Commitment = Poseidon(StudentIdHash, Nullifier Secret)`。
    *   **關鍵:** 僅將 `Identity Commitment` 傳送至後端儲存於 `EligibleVoter` 資料表。後端無法反推 `Nullifier Secret`。
3.  **投票 (Voting):**
    *   前端下載 Merkle Path。
    *   前端生成 ZK Proof：
        *   **Public Inputs:** Merkle Root, Election ID, Vote Option (Candidate ID), Nullifier Hash.
        *   **Private Inputs:** Merkle Path, StudentIdHash, Nullifier Secret.
    *   後端驗證 Proof 與 Nullifier Hash (確保未重複投票)，並記錄 Vote Option。

### 1.2 模組職責

| 模組 | 職責 | 技術棧 |
| --- | --- | --- |
| **Auth Service** | NCUE OIDC 登入、JWT 發放、學籍資料同步 | NestJS, openid-client |
| **Voter Service** | 管理 Merkle Tree、處理 Identity Commitment 註冊 | NestJS, Poseidon Hash |
| **ZK Service** | 驗證 Proof、防止 Nullifier 重複 (Double Voting) | snarkjs, Redis |
| **Frontend** | 金鑰管理 (LocalStorage)、ZK Proof 生成 (Web Worker) | React, Zustand, Web Worker |

---

## 2. 零知識證明電路規劃 (ZK Circuits Specification)

電路使用 `circom` 編寫，採用 `Groth16` 證明系統。

### 2.1 核心電路: `vote.circom`

#### Inputs (輸入)

| 變數名稱 | 類型 | 描述 |
| --- | --- | --- |
| `root` | **Public** | Merkle Tree 的根節點 (證明在名單內) |
| `electionId` | **Public** | 選舉 ID (防止跨選舉重放) |
| `vote` | **Public** | 投票內容 (候選人 ID) |
| `nullifierHash` | **Public** | 用於防止重複投票的標記 (`Poseidon(secret, electionId)`) |
| `secret` | Private | 使用者的秘密 (Nullifier Secret) |
| `studentIdHash` | Private | 使用者的學號 Hash (與 Secret 結合證明所有權) |
| `pathElements[n]` | Private | Merkle Path 節點 |
| `pathIndices[n]` | Private | Merkle Path 索引 (0 或 1) |

#### Constraints (約束邏輯)

1.  **Commitment Check:** 
    *   計算 `commitment = Poseidon(studentIdHash, secret)`。
2.  **Merkle Membership:** 
    *   驗證 `commitment` 是否存在於以 `root` 為根的 Merkle Tree 中。
3.  **Nullifier Generation:**
    *   計算 `generatedNullifier = Poseidon(secret, electionId)`。
    *   約束 `generatedNullifier === nullifierHash`。

---

## 3. 資料庫設計修正 (Refined Database Schema)

### 3.1 關鍵 Table 調整

*   **User Table:**
    *   `studentIdHash`: SHA-256 Hash，來自 OIDC。
*   **EligibleVoter Table:**
    *   新增 `identityCommitment`: String (存儲 `Poseidon(studentIdHash, secret)`)。
*   **Election Table:**
    *   新增 `merkleRoot`: String (該場選舉當下的 Tree Root，用於快照)。
*   **Vote Table:**
    *   `voterId`: **移除** (投票紀錄不能關聯到 User)。
    *   新增 `nullifierHash`: String (Unique Index, 針對每場選舉唯一)。
    *   新增 `proof`: Json (儲存 ZK Proof 以供稽核)。
    *   保留 `electionId`, `candidateId`.

---

## 4. 前端金鑰管理策略 (Frontend Key Management)

### 4.1 Nullifier Seed (Secret) 儲存

1.  **生成:**
    *   使用者點擊生成金鑰，產生 32-byte 隨機數 (Hex 表示)。
    *   儲存於 `localStorage` (Key: `savote_nullifier_secret`)。
2.  **註冊:**
    *   前端結合 `User.studentIdHash` 與 `Secret` 計算 Commitment。
    *   呼叫 `POST /voters/register-commitment`。
3.  **恢復:**
    *   若更換裝置，需手動貼上備份的 Secret Hex。