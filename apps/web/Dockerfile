# --- 構建階段 ---
FROM node:20-alpine AS builder

# 安裝 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 1. 複製工作區配置文件
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./

# 2. 複製【所有】子項目的 package.json (這很重要，否則 pnpm 會安裝失敗)
# 使用 glob 模式複製所有 package.json 以保持目錄結構
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/crypto-lib/package.json ./packages/crypto-lib/
COPY packages/circuits/package.json ./packages/circuits/

# 安裝依賴 (包含所有必要的開發工具如 typescript)
RUN pnpm install --frozen-lockfile

# 3. 複製其餘源代碼
COPY . .

# 設置環境變量並構建
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm turbo run build --filter=web...

# --- 服務階段 (Nginx) ---
FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
