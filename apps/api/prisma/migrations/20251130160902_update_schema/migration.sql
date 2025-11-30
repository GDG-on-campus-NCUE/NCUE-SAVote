/*
  Warnings:

  - You are about to drop the column `issuedAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `sessions` table. All the data in the column will be lost.
  - The `enrollmentStatus` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `accessToken` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Made the column `refreshToken` on table `sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'GRADUATED');

-- DropIndex
DROP INDEX "sessions_refreshToken_key";

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "issuedAt",
DROP COLUMN "userAgent",
ADD COLUMN     "accessToken" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deviceInfo" VARCHAR(500),
ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "refreshToken" SET NOT NULL,
ALTER COLUMN "refreshToken" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "enrollmentStatus",
ADD COLUMN     "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE';
