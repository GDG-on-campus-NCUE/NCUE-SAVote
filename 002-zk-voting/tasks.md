# 任務列表：零知識證明投票系統 (ZK Voting)

**輸入**: `/specs/002-zk-voting/` 下的設計文件
**先決條件**: Phase 1 (Infrastructure) 完成

---

## 第一階段：ZK 電路與工具 (Phase 4.1 - 4.2)

- [x] T101 實作 `vote.circom` 電路 (Merkle Tree + Nullifier)
- [x] T102 實作電路單元測試 `vote.test.ts`
- [ ] T103 建立構建腳本 `packages/circuits/scripts/build.ts` (Trusted Setup)
- [ ] T104 執行 Trusted Setup 生成 `.zkey`, `.wasm`, `verification_key.json`
- [ ] T105 實作 `packages/crypto-lib` 封裝證明生成與驗證邏輯

## 第二階段：後端投票 API (Phase 2.3)

- [ ] T201 定義投票 DTO (`SubmitVoteDto`)
- [ ] T202 實作 `VotesService.verifyProof()` (使用 `crypto-lib`)
- [ ] T203 實作 `VotesService.submitVote()` (Transaction: Check Nullifier -> Verify -> Save)
- [ ] T204 實作 `VotesController` 端點
- [ ] T205 實作投票 API 整合測試

## 第三階段：前端投票功能 (Phase 3.2)

- [ ] T301 設定靜態資源 (複製 `.wasm`, `.zkey` 到 `apps/web/public`)
- [ ] T302 實作 Web Worker 處理證明生成
- [ ] T303 實作投票頁面 UI (`VotingPage`)
- [ ] T304 整合投票 API
- [ ] T305 實作投票成功/憑證頁面

## 第四階段：驗證與計票 (Phase 2.4 & 3.4)

- [ ] T401 實作計票 API (`/elections/:id/tally`)
- [ ] T402 實作驗證 API (`/verify/proof`)
- [ ] T403 實作前端驗證中心頁面
