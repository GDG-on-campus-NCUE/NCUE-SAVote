FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy package.json for all apps/packages to install dependencies
# We need to copy the structure
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/circuits/package.json packages/circuits/
COPY packages/crypto-lib/package.json packages/crypto-lib/
COPY packages/shared-types/package.json packages/shared-types/

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Generate Prisma Client
WORKDIR /app/apps/api
RUN pnpm exec prisma generate

# Build the API and its dependencies
WORKDIR /app
RUN pnpm turbo run build --filter=api...

# Expose port
EXPOSE 3000

# Start the application
WORKDIR /app/apps/api
CMD ["node", "dist/src/main"]
