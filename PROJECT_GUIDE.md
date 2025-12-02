# SAVote 專案導覽

歡迎來到 SAVote 專案！這份文件將引導你了解整個專案的結構和技術，特別為新手開發者設計。

## 專案目標

SAVote 是一個電子投票應用程式。它的一個核心特色是使用「零知識證明」(Zero-Knowledge Proofs) 技術，來確保投票過程的匿名性和可驗證性。

## Monorepo 工作區

本專案採用 **Monorepo** 的架構。意思是，所有相關的子專案（例如前端網站、後端伺服器）都放在同一個大的程式碼倉庫（repository）中。我們使用 [**pnpm**](https://pnpm.io/) 來管理工作區（workspaces），並用 [**Turborepo**](https://turbo.build/repo) 來優化建置和任務執行流程。

- `pnpm-workspace.yaml`: 這個檔案定義了 monorepo 中包含了哪些專案路徑。
- `turbo.json`: 這個檔案設定了 Turborepo 的 pipeline，定義了各個專案任務（如 `build`, `dev`）之間的依賴關係，讓建置過程更快速。

## 目錄結構詳解

```
c:\GitHub\SAVote\
├── apps/         # 存放可獨立執行的應用程式
│   ├── api/      # 後端 API 伺服器
│   └── web/      # 前端 Web 應用程式
├── packages/     # 存放共享的程式碼庫 (libraries)
│   ├── circuits/ # 零知識證明的電路
│   ├── crypto-lib/ # 加密相關的共享函式庫
│   └── shared-types/ # 前後端共用的 TypeScript 型別
├── prisma/       # 資料庫相關設定 (位於 apps/api 內)
├── docs/         # 專案文件
└── ... (其他設定檔)
```

### `apps/` - 應用程式

這是我們主要應用程式的所在地。

#### `apps/api/` - 後端伺服器

這是專案的大腦，負責處理所有核心邏輯。

- **技術棧**: 使用 [**NestJS**](https://nestjs.com/) 框架，這是一個建立在 Node.js 之上的後端框架，使用 TypeScript 編寫。
- **主要職責**:
    - 提供 RESTful API 給前端使用（例如：使用者註冊、登入、獲取選舉資訊、投票）。
    - 處理商業邏輯。
    - 與資料庫進行互動。
- **重要檔案/目錄**:
    - `src/main.ts`: 程式的進入點。
    - `src/app.module.ts`: 根模組，將所有功能模組串連起來。
    - `src/elections`, `src/users`, `src/voters`, `src/votes`: 這些是不同的功能模組，各自處理相關的業務邏輯。
    - `prisma/`:
        - `schema.prisma`: **非常重要**。這裡定義了我們資料庫的所有資料表、欄位和關聯。它就像是資料庫的藍圖。
        - `seed.ts`: 你提到的這個檔案。它是一個腳本，用來在開發初期填充一些預設的假資料到資料庫中，方便我們測試。
        - `migrations/`: 存放資料庫結構變更的歷史紀錄。

#### `apps/web/` - 前端網站

這是使用者在瀏覽器中看到和互動的介面。

- **技術棧**: 使用 [**React**](https://react.dev/) 框架和 [**Vite**](https://vitejs.dev/) 作為建置工具，使用 TypeScript 編寫。
- **主要職責**:
    - 呈現使用者介面 (UI)。
    - 呼叫後端 API 來獲取或更新資料。
    - 處理使用者的互動操作。
- **重要檔案/目錄**:
    - `src/main.tsx`: React 應用程式的進入點。
    - `src/App.tsx`: 主要的應用程式組件。
    - `src/components/`: 存放可重複使用的 UI 組件（如按鈕、輸入框）。
    - `src/features/`: 可能用來存放與特定功能相關的組件和邏輯（例如選舉列表、投票頁面）。

### `packages/` - 共享程式碼

這些是可以在 `apps` 中被重複使用的模組。

#### `packages/circuits/` - 零知識證明電路

這是本專案最核心且最複雜的部分。

- **技術**: 使用 [**Circom**](https://docs.circom.io/) 語言來編寫「算術電路」(arithmetic circuits)。
- **目的**: 這些電路被用來產生「零知識證明」。在我們的投票情境中，它允許一個投票者證明他們是合法的、且只投了一票，但**完全不透漏**他們投給了誰。這確保了投票的匿名性。
- `src/vote.circom`: 這就是定義投票證明的核心電路檔案。

#### `packages/crypto-lib/` - 加密函式庫

這個套件可能包含了與 Circom 電路互動、產生證明、驗證證明等相關的加密輔助函式。

#### `packages/shared-types/` - 共享型別

為了確保前端和後端在資料交換時的格式一致，我們將共用的 TypeScript 型別（interfaces/types）放在這裡。例如，一個 `Election` 物件在前端和後端都應該有相同的結構。

## 如何開始？

1.  **安裝依賴**: 在專案根目錄執行 `pnpm install`。
2.  **設定環境變數**: 複製 `apps/api/.env.example` 和 `apps/web/.env.example`，並將它們重新命名為 `.env`，然後填入必要的設定。
3.  **啟動開發環境**: 在專案根目錄執行 `pnpm dev` (或參考 `start-dev.bat`)。這個指令會同時啟動後端伺服器和前端網站。

