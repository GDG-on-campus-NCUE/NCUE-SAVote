-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "synologySub" VARCHAR(100);
ALTER TABLE "users" ALTER COLUMN "studentIdHash" DROP NOT EXISTS;
ALTER TABLE "users" ALTER COLUMN "class" DROP NOT EXISTS;
-- Ensure role column uses the enum
DO $$ BEGIN
    ALTER TABLE "users" DROP COLUMN "role";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE IF NOT EXISTS "admin_permissions" (
    "id" TEXT NOT NULL,
    "synologySub" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "name" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "admin_permissions_synologySub_key" ON "admin_permissions"("synologySub");
CREATE UNIQUE INDEX IF NOT EXISTS "users_synologySub_key" ON "users"("synologySub");
