# 任務列表：選舉核心系統 (候選人、ZK 電路、投票流程)

**輸入**: `README.md` (Master Plan)
**狀態**: 規劃中

---

## 格式: `[ID] [P?] [Story] 描述`

- **[P]**: 可平行執行
- **[Story]**: US4 (候選人管理), US5 (ZK 電路), US6 (投票流程)

---

## 第一階段：資料庫與候選人管理 (補完 Phase 3)

**目的**: 完善選舉管理功能，支援候選人資料維護

- [x] T101 更新 Prisma Schema：新增 `Candidate` 資料表 (name, bio, photoUrl, electionId)
- [x] T102 更新 Prisma Schema：新增 `Vote` 資料表 (nullifier, proof, publicSignals) - *注意：不儲存選民 ID*
- [x] T103 執行 Prisma Migrate (`2025xxxx_add_candidates_votes`)
- [x] T104 [US4] 實作候選人 CRUD Service (`apps/api/src/elections/candidates.service.ts`)
- [x] T105 [US4] 實作候選人管理 API (`POST /elections/:id/candidates`, `PATCH`, `DELETE`)
- [x] T106 [US4] 前端：實作候選人管理介面 (`apps/web/src/features/admin/components/CandidateManager.tsx`)

---

## 第二階段：零知識證明電路 (Phase 4)

**目的**: 實作 Groth16 電路與證明生成/驗證工具

- [x] T201 [US5] 初始化 `packages/circuits` 專案結構 (circom, snarkjs)
- [x] T202 [US5] 實作 `vote.circom`：包含 Merkle Tree 驗證與 Nullifier 生成
- [x] T203 [US5] 撰寫電路單元測試 (`packages/circuits/tests/vote.test.ts`)
- [x] T204 [US5] 執行 Trusted Setup (Powers of Tau) 並生成 `.zkey` 與 `.wasm`
- [x] T205 [US5] 實作 `packages/crypto-lib`：封裝 `generateProof` (前端用)
- [x] T206 [US5] 實作 `packages/crypto-lib`：封裝 `verifyProof` (後端用)
- [x] T207 [US5] 部署 `.wasm` 與 `.zkey` 至前端靜態目錄 (`apps/web/public/zk/`)

---

## 第三階段：投票流程 (Phase 5)

**目的**: 整合前後端與 ZK，完成投票功能

- [x] T301 [US6] 後端：實作投票提交 API (`POST /votes/submit`)
    - 驗證 Nullifier 是否已存在 (Double Voting Check)
    - 驗證 ZK Proof (使用 `crypto-lib`)
    - 驗證 Merkle Root 是否有效
    - 寫入 Vote 資料表
- [x] T302 [US6] 前端：實作投票間 UI (`apps/web/src/features/voting/pages/VotingBooth.tsx`)
- [x] T303 [US6] 前端：整合 Web Worker 執行 ZK Proof 生成 (避免卡頓)
- [x] T304 [US6] 前端：實作投票成功頁與數位存根下載 (`apps/web/src/features/voting/pages/VoteSuccess.tsx`)
- [ ] T305 [US6] 整合測試：完整投票流程 (E2E)

---

## 第四階段：計票與驗證 (Phase 6)

- [x] T401 後端：實作計票 API (`GET /elections/:id/tally`)
- [x] T402 後端：實作稽核日誌 API (`GET /verify/:id/logs`)
- [x] T403 前端：實作驗證中心頁面 (`apps/web/src/features/verify/pages/VerificationCenter.tsx`)
