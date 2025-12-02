-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "bio" TEXT,
    "photoUrl" VARCHAR(500),
    "electionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "nullifier" VARCHAR(64) NOT NULL,
    "proof" JSONB NOT NULL,
    "publicSignals" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidates_electionId_idx" ON "candidates"("electionId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_nullifier_key" ON "votes"("nullifier");

-- CreateIndex
CREATE INDEX "votes_electionId_idx" ON "votes"("electionId");

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
