-- CreateEnum
CREATE TYPE "Chronotype" AS ENUM ('LARK', 'OWL', 'THIRD_BIRD', 'UNKNOWN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "chronotype" "Chronotype" NOT NULL DEFAULT 'UNKNOWN';
