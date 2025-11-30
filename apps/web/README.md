# SAVote 前端 (Web)

這是 SAVote 系統的前端應用程式，使用 React 和 Vite 建置。它提供了使用者介面，用於身份驗證、查看選舉資訊以及進行投票。

## 技術堆疊

- **框架**: [React](https://react.dev/) (v18)
- **建置工具**: [Vite](https://vitejs.dev/)
- **語言**: [TypeScript](https://www.typescriptlang.org/)
- **樣式**: [Tailwind CSS](https://tailwindcss.com/)
- **狀態管理**: [Zustand](https://github.com/pmndrs/zustand)
- **資料獲取**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **路由**: [React Router](https://reactrouter.com/)
- **測試**: [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/)

## 先決條件

- Node.js (v20 或更高版本)
- pnpm (v10 或更高版本)

## 安裝

在專案根目錄執行：

```bash
pnpm install
```

## 環境變數

複製 `.env.example` 到 `.env` 並設定必要的變數：

```bash
cp .env.example .env
```

`.env` 範例：

```env
VITE_API_BASE_URL="http://localhost:3000"
```

## 執行開發伺服器

```bash
# 從專案根目錄
pnpm --filter web dev

# 或從 apps/web 目錄
cd apps/web
pnpm dev
```

應用程式將在 `http://localhost:5173` 啟動。

## 建置

建置生產環境版本：

```bash
pnpm --filter web build
```

建置產物將位於 `dist` 目錄中。

## 測試

### 單元測試

執行單元測試：

```bash
pnpm --filter web test
```

### E2E 測試

執行端對端測試（使用 Playwright）：

```bash
# 安裝瀏覽器（僅首次需要）
pnpm exec playwright install

# 執行測試
pnpm --filter web test:e2e
```

## 專案結構

```
src/
├── components/     # 共用元件
├── features/       # 功能模組 (Auth, Elections, Voting 等)
├── lib/            # 工具函式庫 (API client, Crypto 等)
├── stores/         # 全域狀態 (Zustand stores)
├── App.tsx         # 根元件
└── main.tsx        # 進入點
```

## 關鍵功能

- **SAML SSO 登入**: 與學校 IdP 整合。
- **Nullifier Secret 管理**: 在客戶端產生並儲存秘密，用於 ZK 證明。
- **投票介面**: 瀏覽候選人並提交選票。
- **結果顯示**: 查看即時或最終投票結果。
