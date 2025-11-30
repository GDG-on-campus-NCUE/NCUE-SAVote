-- CreateEnum
CREATE TYPE "ElectionStatus" AS ENUM ('DRAFT', 'REGISTRATION_OPEN', 'VOTING_OPEN', 'VOTING_CLOSED', 'TALLIED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "studentIdHash" VARCHAR(64) NOT NULL,
    "class" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "enrollmentStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jti" VARCHAR(36) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "refreshToken" VARCHAR(255),
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "userAgent" VARCHAR(500),
    "ipAddress" VARCHAR(45),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elections" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "merkleRootHash" VARCHAR(64),
    "status" "ElectionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligible_voters" (
    "id" TEXT NOT NULL,
    "studentId" VARCHAR(20) NOT NULL,
    "class" VARCHAR(50) NOT NULL,
    "electionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eligible_voters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_studentIdHash_key" ON "users"("studentIdHash");

-- CreateIndex
CREATE INDEX "users_studentIdHash_idx" ON "users"("studentIdHash");

-- CreateIndex
CREATE INDEX "users_class_idx" ON "users"("class");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_jti_key" ON "sessions"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_revoked_idx" ON "sessions"("userId", "revoked");

-- CreateIndex
CREATE INDEX "sessions_jti_idx" ON "sessions"("jti");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "eligible_voters_electionId_idx" ON "eligible_voters"("electionId");

-- CreateIndex
CREATE INDEX "eligible_voters_studentId_idx" ON "eligible_voters"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "eligible_voters_studentId_electionId_key" ON "eligible_voters"("studentId", "electionId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligible_voters" ADD CONSTRAINT "eligible_voters_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
