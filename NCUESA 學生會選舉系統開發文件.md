---
title: NCUESA 學生會選舉系統開發文件

---

# NCUESA 學生會選舉系統開發文件

## Outlines

## References
[Groth16數學理論](https://www.zeroknowledgeblog.com/index.php/groth16?utm_source=chatgpt.com)
[Quadratic Arithmetic Programs: from Zero to Hero](https://medium.com/%40VitalikButerin/quadratic-arithmetic-programs-from-zero-to-hero-f6d558cea649)
[橢圓曲線 ECC加密原理](https://ithelp.ithome.com.tw/articles/10251031)
[Powers of Tau Groth16 Trusted Setup](https://aping-dev.com/index.php/archives/781/)

## Thesis Core - Variation of Groth16
Prventing the votes leak is important that we use Groth16 hiding the voter's secrets.

Groth16 基於 零知識證明(Zero Knowledge Proof)來進行加密保護機制。

常見線上投票會有以下幾點問題
1. 匿名性
2. 可重複性 (要可以去識別化的情況被驗票)

### 整體投票加密流程
1. User 登入投票系統
2. 投票系統核對身分
3. User 向 選舉X 發起投票請求
4. 投票系統核對 User 是否可以進行 選舉X 的投票
5. 投票系統 頒發空白票根T 給 User
6. User 利用自己的 pub_key、資格承諾Q、重複值N，為自己投下的 票T 進行簽名。
7. pub_key 會提供給 User 後續驗證自己投的票的金鑰。
8. 投票系統利用 Groth 16 把 User 提供的資訊 (資格承諾Q、重複值N、票T) 開始進行 證明ABC 的計算。
    a. 資格承諾Q 用於保證投票者合法，但無法往前防推
    b. 重複值N 用來判斷 User 是否重複投票
    c. 證明ABC (proof) 用來證明這個 加密過的值合法性。
12. 投完票後，待 投票時間 t_e 結束，系統會開始針對 選舉X 的每一張票進行 驗證，並記錄在選票上面。
13. 驗證同時會開始計數，將 候選人C 的總投票計算出來。



1.登入 / 取得投票資格
* 使用者用 SSO / 學校帳號登入。
* 確認他在這場 election 的 voter list 裡（資格 OK）。
* 若是第一次，可以在這一步為他建立：
    * nullifier_secret（存在 user 端或 server 端，之後你會決定）
    * 對應的 nullifier / credential_commitment 存到 DB 的 User 或其他表。

2.載入選舉資訊
* 前端呼叫 API：GET /elections/:id。
* 拿到：
    * 候選人列表（最大 50 位）
    * 對應的 mask（例如 [1,1,1,0,0,...]）
    * election 的其他資訊（時間、標題等）

3.使用者在 UI 選擇候選人
* 前端只存「你點了第幾位候選人」，變成：
* choice[50]（只有一個位置是 1）
* mask[50]（由 election 來決定哪些可選）

4. 生成 ZK proof
* 瀏覽器載入 vote.wasm + vote_final.zkey
* 在 Web Worker 裡用 choice + mask (+ 之後的 nullifier、commitment) 產生：
* witness → proof (a,b,c) + publicSignals

5.送票到後端
* 前端呼叫 POST /votes/submit，body 包含：
    * electionId
    * proof（a,b,c）
    * publicSignals（裡面會含：
        * candidate index / encoded vote
        * nullifier
        * 其他你設計的 public 值）
* ❗ 不需要傳明文的 choice[] 或 candidate 給後端，只要放在 publicSignals 裡即可。

6. 後端驗證 + 寫入 DB

* 後端用 verification_key.json：
    * snarkjs.groth16.verify(vk, publicSignals, proof)
    * 驗證 OK 才繼續。
* 檢查 DB：
    * 該 nullifier 是否已經存在（防止重複投票）
* 寫入 Vote：
    * eid
    * candidateId（從 publicSignals 解出）
    * nullifier
    * proof_a / proof_b / proof_c
    * verified = true

7. 回傳投票成功 + 給使用者一個「憑證」

* 後端回傳：
    * electionId
    * nullifier 或 nullifier_hash
    * （可選）該票的 proof 或 proofHash
* 前端顯示「投票成功」，並讓 user 可以：
    * 把這串 nullifier_hash 存下來／截圖
    * 這就是他之後「驗票」用的 key。
8. 驗票階段
* 在「驗證中心」頁面：
    * user 輸入 nullifier 或 nullifier_hash
    * 系統查 DB 看這個 nullifier 是否有被計入
    * 也可以顯示「這張票的 proof 驗證結果」（再次 verify）

## QA
1.「我不應該在前端計算 WASM 對吧？」

這個問題分兩種答案（誠實版）：

✅ 如果你想要最強的匿名性（連後端也不知道你投給誰）

👉 應該在前端（瀏覽器）跑 WASM + 產生 proof。

優點：

後端只看到 proof + publicSignals，不會看到你的 raw vote / secret。

就算 DB 被偷 / 管理員不老實，也只能看到 nullifier 和 proof，不知道你投給誰。

缺點：

前端要載 wasm，比較大檔。

手機舊裝置產生 proof 會比較慢（但你的電路現在不大，還 OK）。

✅ 如果你選擇「先做簡單版，之後再強化隱私」

👉 可以先照你 spec 裡寫的：由後端跑 WASM 

README

這樣系統比較好 debug，前後端錯誤都在後端 log 裡。

但缺點是：後端會知道「你投給誰」，匿名只對「其他人」，不對後端。

以你一開始說「希望真的做到像傳統投票一樣完全匿名」，長期來看比較建議：
➜ 最終版本放到前端 Web Worker 裡算 proof。

你可以現在先用「後端算 proof」當 prototype，
等電路、流程穩定了，再搬到前端。

2.「給 user 驗證自己的票會是給 nullifier 嗎，還是其他的東西？」

最典型做法：

✅ 給 user「nullifier 或 nullifier_hash」當作他的「票據序號」。

DB 裡你存的是 nullifier（或 hash(nullifier)）

使用者端你可以給：

nullifier 本身，或

H(nullifier) 當作收據上顯示的東西

驗證流程：

使用者到「驗證中心」頁面貼上這個值

系統去查：

這個 nullifier 有在 DB 嗎？

如果有 → 顯示「你的票已計入」

如果沒有 → 顯示「查無此票」

這樣：

後端可以透過 ZK 確保這張票有「合法候選人、合法格式」

user 又可以確認「我的 nullifier 有出現在 tally 裡」

但不會洩漏他投給誰（票內容隱藏在 ZK 裡）

3.「proof ABC 可以提供給 user 嗎？」

可以，proof a/b/c 完全可以給 user，甚至可以公開。

proof 本身不包含秘密，它只是「你有一個 witness，滿足那個電路」的證明。

你可以讓使用者下載：

proof.json

public.json

verification_key.json（或提供連結）

讓使用者自由用 snarkjs groth16 verify 在自己電腦驗證：

snarkjs groth16 verify verification_key.json public.json proof.json


但是：

對一般學生來說太硬 → 只會浪費他們腦力

比較實際做法是：

系統提供 UI，背後幫他跑 verify

你只要給他「收據 ID（nullifier_hash）」就夠了

所以我會建議的設計是：

proof a/b/c 存在 DB

user 想玩超專業驗證：提供一個「進階驗證」下載 proof 的入口

一般人只用憑證頁面 / 驗證中心就好

4.「如果 user 要校驗，是不是要給他一個專門校驗的頁面？」

對，最好要有一個專門的「驗證中心」頁面，其實你 spec 裡也有寫到這個概念 

README

：

驗證中心 (Verification Center)：

個人驗票：輸入 Nullifier Hash 查詢選票是否被計入

全域驗證：下載完整計票日誌與 ZK Proofs，在系統內進行完整校驗

這個頁面可以有兩個區塊：

「我的票有沒有被算進去？」（簡單模式）

輸入：nullifier 或 nullifier_hash

顯示：

這張票是否存在

是否通過 ZK 驗證（verified = true）

是否計入最終 tally

「我要做完整公開驗證」（進階模式 / 給 nerd 用）

顯示：

可下載的 all_proofs.json / tally_log.json

或系統直接在頁面上跑 verify（用 wasm + snarkjs）

## Database Design
![image](https://hackmd.io/_uploads/BJHQ6dK--l.png)

* 在本系統中，votes.nullifier 與 users.nullifier_secret 之間具有邏輯關聯，但不建立資料庫外鍵關係，以維持匿名性。
* 選民端利用其私有參數 nullifier_secret 與選舉識別值 eid 生成唯一的 nullifier，
系統僅以 (eid, nullifier) 為基礎檢查重複投票，而無法將票據回溯至個別使用者。
### ER Model
![image](https://hackmd.io/_uploads/SkAeJYZWZe.png)
### Table Relations
![image](https://hackmd.io/_uploads/SJXFTutZbg.png)


### Table Description
![image](https://hackmd.io/_uploads/rkraTuKWZl.png)
![image](https://hackmd.io/_uploads/ryZVkYWW-x.png)
![image](https://hackmd.io/_uploads/SJN4yK-W-e.png)
![image](https://hackmd.io/_uploads/Skp4ytWb-g.png)
![image](https://hackmd.io/_uploads/H1O4kF-bWg.png)

## API Design

### User

1. POST  users/verify
    * 驗證簽章合法性
2. POST  users/:sid 
    * 查詢使用者SID

### Election

1. POST  elections
    * 建立選舉
        * 包含：名稱、種類、時間、範圍、
        * 自建立選舉的 Hash ID
2. GET  elections/show
    * 顯示所有選舉清單
3. GET  elections/show/:eid
    * 顯示特定eid選舉
4. POST elections/candidates/:eid
    * 新增候選人
5. GET  elections/stats
    * 回傳統計結果
6. DELETE elections/:eid
    * 刪除選舉

### Votes
1. POST  votes/generate
    * 產生選票
    * 用 nullifier_secret, vote_choice, eid 生成 zk proof
2. POST  votes/submit
    * 提交選票
    * 上傳 proof
        * generateNullifier()
        * checkDuplicateNullifier()
        * verifyProof()
        * INSERT INTO Votes
3. GET   votes/:eid/result
    * 查詢選舉結果



### Logs
1. POST  verify
    * 驗證單一 proof
2. POST  verify/:eid/tally
    * 非對外API
    * 統計選舉結果
    * 重新驗證整場選舉 proof
3. GET   verify/:eid/logs
    * 回傳 logs 資料


## 使用學校API

* 需要 YAML 來源的資料，{學號、班級、在學與否}
* 系統開發組 須同意 學生會使用 API獲得資料
* 教務處 需授權 系統開發組提供學生在學與否
* 漪庭姐真的很懶
* 要做系統的話，需要一個三方會議，由選委會(?)向系統開發組索取 API 接口
* YAML 提供身分認證的 Token


