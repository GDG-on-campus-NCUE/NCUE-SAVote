# 實作計畫：零知識證明投票系統 (ZK Voting)

**狀態**: 草稿
**優先級**: P1
**負責人**: Copilot

---

## 1. 概述

本階段目標是實作基於 Groth16 的零知識證明投票核心。包含電路設計、可信設置 (Trusted Setup)、證明生成與驗證庫的封裝，以及前後端的整合。

## 2. 架構設計

### 2.1 ZK 電路 (`packages/circuits`)
- **輸入**:
  - Public: `root` (Merkle Root), `electionId` (External Nullifier), `vote` (Candidate ID)
  - Private: `secret` (Nullifier Secret), `pathIndices`, `siblings` (Merkle Path)
- **輸出**:
  - `nullifierHash`: 防止重複投票
  - `voteHash`: 綁定選票與證明

### 2.2 Crypto Lib (`packages/crypto-lib`)
- 封裝 `snarkjs` 與 `circomlibjs`
- 提供 `generateProof(input)`: 前端使用 (.wasm + .zkey)
- 提供 `verifyProof(proof, publicSignals)`: 後端使用 (verification_key.json)

### 2.3 後端整合 (`apps/api`)
- `/votes/submit` 端點
- 驗證流程:
  1. 檢查 `nullifierHash` 是否已存在 (Double Voting Check)
  2. 驗證 ZK Proof (Validity Check)
  3. 檢查 `root` 是否為合法/最新的 Merkle Root (Eligibility Check)
  4. 寫入選票與 Nullifier

### 2.4 前端整合 (`apps/web`)
- 下載 `.wasm` 與 `.zkey` (靜態資源)
- Web Worker 執行證明生成 (避免卡頓)
- 投票介面與流程控制

## 3. 執行步驟

1. **電路開發與測試** (已完成)
   - 實作 `vote.circom`
   - 單元測試 `vote.test.ts`

2. **可信設置 (Trusted Setup)**
   - 下載 Powers of Tau (PTAU)
   - 產生 `.zkey` (Phase 2)
   - 匯出 `verification_key.json`

3. **工具庫封裝**
   - 實作 `packages/crypto-lib`

4. **後端 API 實作**
   - 實作 `VotesService` 與 `VotesController`

5. **前端 UI 實作**
   - 投票頁面
   - 證明生成整合

---

## 4. 依賴關係

- `packages/circuits` -> `packages/crypto-lib`
- `packages/crypto-lib` -> `apps/api` & `apps/web`
