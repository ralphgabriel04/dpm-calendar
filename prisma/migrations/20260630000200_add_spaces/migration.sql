-- CreateEnum
CREATE TYPE "SpaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isPersonal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Space_slug_key" ON "Space"("slug");
CREATE INDEX "Space_ownerId_idx" ON "Space"("ownerId");

CREATE TABLE "SpaceMember" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SpaceRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpaceMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SpaceMember_spaceId_userId_key" ON "SpaceMember"("spaceId", "userId");
CREATE INDEX "SpaceMember_userId_idx" ON "SpaceMember"("userId");

CREATE TABLE "SpaceInvite" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "SpaceRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    CONSTRAINT "SpaceInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SpaceInvite_token_key" ON "SpaceInvite"("token");
CREATE INDEX "SpaceInvite_spaceId_idx" ON "SpaceInvite"("spaceId");
CREATE INDEX "SpaceInvite_email_idx" ON "SpaceInvite"("email");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpaceMember" ADD CONSTRAINT "SpaceMember_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpaceMember" ADD CONSTRAINT "SpaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpaceInvite" ADD CONSTRAINT "SpaceInvite_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Membership helper. SECURITY DEFINER so the lookup bypasses RLS, preventing
-- infinite recursion when SpaceMember's own policy references SpaceMember.
CREATE OR REPLACE FUNCTION app_is_space_member(space_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "SpaceMember"
    WHERE "spaceId" = space_id
      AND "userId" = current_setting('app.current_user_id', true)
  );
$$;
REVOKE ALL ON FUNCTION app_is_space_member(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_is_space_member(text) TO app_user;

-- Row Level Security (defense-in-depth). Reads are member-scoped; precise role
-- enforcement (owner/admin) happens in the tRPC layer.
GRANT SELECT, INSERT, UPDATE, DELETE ON "Space", "SpaceMember", "SpaceInvite" TO app_user;

ALTER TABLE "Space" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Space" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_isolation ON "Space";
CREATE POLICY rls_isolation ON "Space"
  USING ("ownerId" = current_setting('app.current_user_id', true) OR app_is_space_member("id"))
  WITH CHECK ("ownerId" = current_setting('app.current_user_id', true) OR app_is_space_member("id"));

ALTER TABLE "SpaceMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpaceMember" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_isolation ON "SpaceMember";
CREATE POLICY rls_isolation ON "SpaceMember"
  USING ("userId" = current_setting('app.current_user_id', true) OR app_is_space_member("spaceId"))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true) OR app_is_space_member("spaceId"));

ALTER TABLE "SpaceInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpaceInvite" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_isolation ON "SpaceInvite";
CREATE POLICY rls_isolation ON "SpaceInvite"
  USING (app_is_space_member("spaceId"))
  WITH CHECK (app_is_space_member("spaceId"));
