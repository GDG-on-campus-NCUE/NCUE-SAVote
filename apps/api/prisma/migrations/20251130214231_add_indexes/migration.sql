-- DropIndex
DROP INDEX "users_studentIdHash_idx";

-- CreateIndex
CREATE INDEX "elections_status_idx" ON "elections"("status");

-- CreateIndex
CREATE INDEX "elections_startTime_endTime_idx" ON "elections"("startTime", "endTime");
