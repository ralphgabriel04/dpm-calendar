-- AlterEnum
ALTER TYPE "Provider" ADD VALUE IF NOT EXISTS 'ICS';
ALTER TYPE "Provider" ADD VALUE IF NOT EXISTS 'CALDAV';
ALTER TYPE "Provider" ADD VALUE IF NOT EXISTS 'NOTION';
ALTER TYPE "Provider" ADD VALUE IF NOT EXISTS 'TODOIST';
ALTER TYPE "Provider" ADD VALUE IF NOT EXISTS 'TICKTICK';

-- CreateTable
CREATE TABLE "ExternalIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "label" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "username" TEXT,
    "password" TEXT,
    "config" JSONB,
    "syncDirection" "SyncDirection" NOT NULL DEFAULT 'PULL',
    "refreshInterval" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExternalIntegration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExternalIntegration_userId_provider_sourceUrl_key" ON "ExternalIntegration"("userId", "provider", "sourceUrl");
CREATE INDEX "ExternalIntegration_userId_idx" ON "ExternalIntegration"("userId");

CREATE TABLE "ExternalItem" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalEtag" TEXT,
    "kind" TEXT NOT NULL,
    "localEventId" TEXT,
    "localTaskId" TEXT,
    "hash" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExternalItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExternalItem_integrationId_externalId_key" ON "ExternalItem"("integrationId", "externalId");
CREATE INDEX "ExternalItem_integrationId_idx" ON "ExternalItem"("integrationId");

CREATE TABLE "IntegrationSyncRun" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "direction" "SyncDirection" NOT NULL,
    "status" "SyncLogStatus" NOT NULL,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "IntegrationSyncRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IntegrationSyncRun_integrationId_idx" ON "IntegrationSyncRun"("integrationId");

-- AddForeignKey
ALTER TABLE "ExternalIntegration" ADD CONSTRAINT "ExternalIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalItem" ADD CONSTRAINT "ExternalItem_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationSyncRun" ADD CONSTRAINT "IntegrationSyncRun_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (defense-in-depth) — same pattern as 20260630000000_add_rls_policies.
GRANT SELECT, INSERT, UPDATE, DELETE ON "ExternalIntegration", "ExternalItem", "IntegrationSyncRun" TO app_user;

ALTER TABLE "ExternalIntegration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExternalIntegration" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_isolation ON "ExternalIntegration";
CREATE POLICY rls_isolation ON "ExternalIntegration"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

ALTER TABLE "ExternalItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExternalItem" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_isolation ON "ExternalItem";
CREATE POLICY rls_isolation ON "ExternalItem"
  USING (EXISTS (SELECT 1 FROM "ExternalIntegration" i WHERE i.id = "ExternalItem"."integrationId" AND i."userId" = current_setting('app.current_user_id', true)))
  WITH CHECK (EXISTS (SELECT 1 FROM "ExternalIntegration" i WHERE i.id = "ExternalItem"."integrationId" AND i."userId" = current_setting('app.current_user_id', true)));

ALTER TABLE "IntegrationSyncRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationSyncRun" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_isolation ON "IntegrationSyncRun";
CREATE POLICY rls_isolation ON "IntegrationSyncRun"
  USING (EXISTS (SELECT 1 FROM "ExternalIntegration" i WHERE i.id = "IntegrationSyncRun"."integrationId" AND i."userId" = current_setting('app.current_user_id', true)))
  WITH CHECK (EXISTS (SELECT 1 FROM "ExternalIntegration" i WHERE i.id = "IntegrationSyncRun"."integrationId" AND i."userId" = current_setting('app.current_user_id', true)));
