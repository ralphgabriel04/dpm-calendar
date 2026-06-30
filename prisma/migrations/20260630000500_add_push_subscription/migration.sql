-- Fixes a pre-existing drift: the PushSubscription model existed in schema.prisma
-- but no migration created its table. Runs after 20260630000000_add_rls_policies,
-- so the app_user role already exists.

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_userId_endpoint_key" ON "PushSubscription"("userId", "endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (defense-in-depth) — same pattern as 20260630000000_add_rls_policies.
GRANT SELECT, INSERT, UPDATE, DELETE ON "PushSubscription" TO app_user;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_isolation ON "PushSubscription";
CREATE POLICY rls_isolation ON "PushSubscription"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
