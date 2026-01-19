/*
  Warnings:

  - You are about to drop the column `merkleRootHash` on the `elections` table. All the data in the column will be lost.
  - You are about to drop the column `nullifier` on the `votes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[electionId,nullifierHash]` on the table `votes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `candidateId` to the `votes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nullifierHash` to the `votes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ElectionType" AS ENUM ('PRESIDENTIAL', 'DISTRICT_COUNCILOR', 'AT_LARGE_COUNCILOR');

-- DropIndex
DROP INDEX "votes_nullifier_key";

-- AlterTable
ALTER TABLE "elections" DROP COLUMN "merkleRootHash",
ADD COLUMN     "config" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "merkleRoot" VARCHAR(100),
ADD COLUMN     "merkleTreeDepth" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "type" "ElectionType" NOT NULL DEFAULT 'PRESIDENTIAL';

-- AlterTable
ALTER TABLE "eligible_voters" ADD COLUMN     "identityCommitment" VARCHAR(100);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastLoginIp" VARCHAR(45),
ADD COLUMN     "name" VARCHAR(100);

-- AlterTable
ALTER TABLE "votes" DROP COLUMN "nullifier",
ADD COLUMN     "candidateId" TEXT NOT NULL,
ADD COLUMN     "nullifierHash" VARCHAR(100) NOT NULL;

-- CreateTable
CREATE TABLE "admin_login_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_login_logs_userId_idx" ON "admin_login_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_electionId_nullifierHash_key" ON "votes"("electionId", "nullifierHash");

-- AddForeignKey
ALTER TABLE "admin_login_logs" ADD CONSTRAINT "admin_login_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
