# NCUESA 學生會選舉系統開發文件

## 1. 系統概述 (System Overview)

SAVote 是一個專為 NCUESA (國立彰化師範大學學生會) 設計的去中心化投票系統，採用 **Hybrid Architecture**，結合中心化的身份驗證 (SSO) 與去中心化的 **Groth16 零知識證明 (ZKP)** 技術，確保投票的「隱私性」與「可驗證性」。

### 核心技術 (Core Technologies)

-   **Frontend**: React 18, Vite, TailwindCSS (Material Design 3)
-   **Backend**: NestJS (Node.js), Prisma ORM, **NCUE OIDC**
-   **Database**: PostgreSQL 16
-   **Zero Knowledge Proof**: Circom 2.1, SnarkJS, Groth16 (BN128 curve)
-   **Infrastructure**: Docker, Nginx

---

## 2. 系統架構 (System Architecture)

### 2.1 身份與匿名流程 (The Privacy Flow)

為了確保「投票權」與「投票內容」的連結被切斷，我們採用以下流程：

1.  **身份驗證 (Auth):**
    *   使用者透過 **NCUE OIDC (SSO)** 登入。
    *   後端驗證學籍資格並取得 `StudentIdHash`。
2.  **匿名識別證 (Identity Commitment):**
    *   使用者瀏覽器端生成隨機秘密 `Nullifier Secret` (32-byte Hex)。
    *   前端計算 `Identity Commitment = Poseidon(StudentIdHash, Nullifier Secret)`。
    *   **關鍵:** 僅將 `Identity Commitment` 傳送至後端儲存於 `EligibleVoter` 資料表。後端無法反推 `Nullifier Secret`。
3.  **投票 (Voting):**
    *   前端下載 Merkle Path。
    *   前端生成 ZK Proof (Groth16)：
        *   **Public Inputs:** Merkle Root, Election ID, Vote Option (Candidate ID), Nullifier Hash.
        *   **Private Inputs:** Merkle Path, StudentIdHash, Nullifier Secret.
    *   後端驗證 Proof 與 Nullifier Hash (確保未重複投票)，並記錄 Vote Option。

### 2.2 模組職責

| 模組 | 職責 | 技術棧 |
| --- | --- | --- |
| **Auth Service** | NCUE OIDC 登入、JWT 發放、學籍資料同步 | NestJS, openid-client |
| **Voter Service** | 管理 Merkle Tree、處理 Identity Commitment 註冊 | NestJS, Poseidon Hash |
| **ZK Service** | 驗證 Proof、防止 Nullifier 重複 (Double Voting) | snarkjs |
| **Frontend** | 金鑰管理 (LocalStorage)、ZK Proof 生成 (Web Worker) | React, Zustand, Web Worker |

---

## 3. 零知識證明電路規劃 (ZK Circuits)

電路使用 `circom` 編寫，採用 `Groth16` 證明系統。

### 核心電路: `vote.circom`

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

1.  **Commitment Check:** 計算 `commitment = Poseidon(studentIdHash, secret)`。
2.  **Merkle Membership:** 驗證 `commitment` 是否存在於以 `root` 為根的 Merkle Tree 中。
3.  **Nullifier Generation:** 計算 `generatedNullifier = Poseidon(secret, electionId)`，並約束其等於公開的 `nullifierHash`。

---

## 4. 資料庫設計 (Database Design)

![ER Model](https://hackmd.io/_uploads/SkAeJYZWZe.png)

### 關鍵關聯邏輯
*   `votes.nullifier` 與 `users` (真實身分) 之間**無外鍵關聯**。
*   選民端利用私有參數 `nullifier_secret` 與 `eid` 生成唯一的 `nullifier`。
*   系統僅以 `(eid, nullifier)` 為基礎檢查重複投票。

### 主要 Table 定義

*   **User**: `id`, `email`, `studentIdHash`, `role` (ADMIN/VOTER)
*   **Election**: `id`, `title`, `description`, `startTime`, `endTime`, `status`, `merkleRoot`, `type` (PRESIDENT/COUNCILOR/...)
*   **EligibleVoter**: `id`, `electionId`, `userId`, `identityCommitment` (連結 User 與 Election，但不連結 Vote)
*   **Vote**: `id`, `electionId`, `candidateId`, `nullifierHash`, `proof` (JSON), `createdAt`
*   **Candidate**: `id`, `electionId`, `name`, `description`, `imageUrl`

---

## 5. API 設計 (API Design)

### User / Auth
*   `POST /auth/login`: 啟動 SSO 登入流程
*   `GET /auth/callback`: OIDC 回調
*   `GET /users/me`: 取得當前使用者資訊

### Election
*   `GET /elections`: 獲取選舉列表
*   `GET /elections/:id`: 獲取選舉詳情
*   `POST /elections`: 建立選舉 (Admin)
*   `POST /elections/:id/candidates`: 新增候選人 (Admin - 支援檔案上傳)
*   `POST /elections/:id/register`: 註冊 ZK Identity (Commitment)
*   `GET /elections/:id/proof`: 獲取 Merkle Proof

### Votes
*   `POST /votes/submit`: 提交選票 (ZK Proof)
*   `GET /votes/:eid/check-nullifier/:nullifier`: 驗票 (檢查 Nullifier 是否存在)
*   `GET /votes/:eid/tally`: 開票結果 (僅在選舉結束後可用)

---

## 6. 選舉制度與門檻 (Voting Rules)

### 種類一: 正、副會長 (President / VP)
*   **選制**: 單一選區 (Single-member district)
*   **同額競選 (僅一組候選人)**: 同意票需達 **總選舉人 10%** 以上始當選。
*   **非同額競選**: 相對多數決 (Simple Majority)，票數最多者當選。若同票則直接重選。
*   **限制**: 一人一票。

### 種類二: 選區學生議員 (District Councilor)
*   **範圍**: 大學部每系一位、研究生每院一位。
*   **選制**: 相對多數決 (Simple Majority)。
*   **規則**: 票數最多者當選。若同票則抽籤決定。
*   **限制**: 一人一票。

### 種類三: 不分區學生議員 (At-large Councilor)
*   **選制**: 單記不可讓渡投票制 (SNTV)。
*   **門檻**: 得票數需達 **總選舉人 1%** 以上。
*   **席次**: 取符合門檻且票數最高的前 **16** 人。
*   **限制**: 一人一票。

---

## 7. References
*   [Groth16 數學理論](https://www.zeroknowledgeblog.com/index.php/groth16)
*   [Quadratic Arithmetic Programs: from Zero to Hero](https://medium.com/@VitalikButerin/quadratic-arithmetic-programs-from-zero-to-hero-f6d558cea649)
*   [Powers of Tau Groth16 Trusted Setup](https://aping-dev.com/index.php/archives/781/)

---

## 8. For Developer
* [開發完整文檔](https://hackmd.io/@NCUESA/H1wtzaYKex)
* [測試用 SSO Server](https://dsm.ncuesa.org.tw/#/signin)