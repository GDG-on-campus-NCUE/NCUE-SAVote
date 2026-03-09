# --- 構建階段 ---
FROM node:20-alpine AS builder

# 安裝 pnpm 並安裝 libc6-compat (Prisma 在 Alpine 需要)
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

WORKDIR /app

# 1. 複製全局配置文件
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./

# 2. 複製所有 package.json
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/crypto-lib/package.json ./packages/crypto-lib/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/circuits/package.json ./packages/circuits/

# 3. 安裝依賴
RUN pnpm install --frozen-lockfile

# 4. 複製源代碼
COPY . .

# 5. 生成 Prisma 客戶端
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# 6. 編譯項目
RUN pnpm turbo run build --filter=api...

# --- 運行階段 ---
FROM node:20-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# A. 複製必要的運行文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# 確保 prisma 客戶端可以在 node_modules 中被找到 (因為 generate 階段產生的 client 位於 node_modules)
# 這裡我們已經複製了整個 node_modules，所以應該沒問題

EXPOSE 3000

# 設置啟動指令
# 注意：docker-compose 會覆蓋此 CMD，但我們保持這裡的正確性作為備援
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/src/main"]
