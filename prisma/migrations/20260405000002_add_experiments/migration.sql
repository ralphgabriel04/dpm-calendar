-- CreateEnum
CREATE TYPE "ExperimentResult" AS ENUM ('PENDING', 'SUCCESS', 'FAILURE', 'INCONCLUSIVE');

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "baselineValue" DOUBLE PRECISION,
    "interventionValue" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "result" "ExperimentResult" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Experiment_userId_idx" ON "Experiment"("userId");

-- CreateIndex
CREATE INDEX "Experiment_userId_result_idx" ON "Experiment"("userId", "result");

-- AddForeignKey
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
