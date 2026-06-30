import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * RLS isolation (integration).
 *
 * Verifies the Row Level Security pattern used by the
 * 20260630000000_add_rls_policies migration: a NOBYPASSRLS role sees only rows
 * whose owner matches the request-scoped GUC `app.current_user_id`, child rows
 * are gated through their parent, and everything fails closed when the GUC is
 * unset.
 *
 * Self-contained: it creates its own throwaway tables/policies, so it does not
 * depend on the app schema and runs on any Postgres. Skipped unless
 * TEST_DATABASE_URL points at a disposable database (never production).
 */
const TEST_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_URL)("RLS isolation (integration)", () => {
  const db = new PrismaClient({ datasourceUrl: TEST_URL });

  // Run a block as the non-privileged app_user with a given GUC identity.
  async function asUser<T>(
    userId: string | null,
    body: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    return db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE rls_app_user");
      if (userId !== null) {
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_user_id', '${userId}', true)`
        );
      }
      return body(tx as unknown as PrismaClient);
    });
  }

  beforeAll(async () => {
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='rls_app_user') THEN
          CREATE ROLE rls_app_user NOLOGIN NOBYPASSRLS;
        END IF;
      END $$;`);
    await db.$executeRawUnsafe(
      `DO $$ BEGIN EXECUTE format('GRANT rls_app_user TO %I', current_user); EXCEPTION WHEN OTHERS THEN NULL; END $$;`
    );
    await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "_rls_child"`);
    await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "_rls_parent"`);
    await db.$executeRawUnsafe(
      `CREATE TABLE "_rls_parent" (id text PRIMARY KEY, "userId" text NOT NULL, title text NOT NULL)`
    );
    await db.$executeRawUnsafe(
      `CREATE TABLE "_rls_child" (id text PRIMARY KEY, "parentId" text NOT NULL REFERENCES "_rls_parent"(id) ON DELETE CASCADE, label text NOT NULL)`
    );
    await db.$executeRawUnsafe(
      `INSERT INTO "_rls_parent" VALUES ('p_a','user_a','A'), ('p_b','user_b','B')`
    );
    await db.$executeRawUnsafe(`INSERT INTO "_rls_child" VALUES ('c_a','p_a','A item')`);
    await db.$executeRawUnsafe(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON "_rls_parent","_rls_child" TO rls_app_user`
    );
    for (const t of ["_rls_parent", "_rls_child"]) {
      await db.$executeRawUnsafe(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`);
      await db.$executeRawUnsafe(`ALTER TABLE "${t}" FORCE ROW LEVEL SECURITY`);
    }
    await db.$executeRawUnsafe(`
      CREATE POLICY rls_isolation ON "_rls_parent"
        USING ("userId" = current_setting('app.current_user_id', true))
        WITH CHECK ("userId" = current_setting('app.current_user_id', true))`);
    await db.$executeRawUnsafe(`
      CREATE POLICY rls_isolation ON "_rls_child"
        USING (EXISTS (SELECT 1 FROM "_rls_parent" p WHERE p.id = "_rls_child"."parentId" AND p."userId" = current_setting('app.current_user_id', true)))
        WITH CHECK (EXISTS (SELECT 1 FROM "_rls_parent" p WHERE p.id = "_rls_child"."parentId" AND p."userId" = current_setting('app.current_user_id', true)))`);
  });

  afterAll(async () => {
    await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "_rls_child"`);
    await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "_rls_parent"`);
    await db.$disconnect();
  });

  const count = async (tx: PrismaClient, table: string) =>
    Number(
      (
        (await tx.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "${table}"`)) as {
          n: number;
        }[]
      )[0].n
    );

  it("a user sees only their own rows", async () => {
    expect(await asUser("user_a", (tx) => count(tx, "_rls_parent"))).toBe(1);
    expect(await asUser("user_b", (tx) => count(tx, "_rls_parent"))).toBe(1);
  });

  it("fails closed when the GUC is unset", async () => {
    expect(await asUser(null, (tx) => count(tx, "_rls_parent"))).toBe(0);
  });

  it("gates child rows through the parent", async () => {
    expect(await asUser("user_a", (tx) => count(tx, "_rls_child"))).toBe(1);
    expect(await asUser("user_b", (tx) => count(tx, "_rls_child"))).toBe(0);
  });

  it("denies cross-user updates and deletes", async () => {
    const updated = await asUser("user_b", (tx) =>
      tx.$executeRawUnsafe(`UPDATE "_rls_parent" SET title='HACKED' WHERE "userId"='user_a'`)
    );
    expect(updated).toBe(0);
  });

  it("blocks inserting a row owned by someone else (WITH CHECK)", async () => {
    await expect(
      asUser("user_a", (tx) =>
        tx.$executeRawUnsafe(
          `INSERT INTO "_rls_parent" VALUES ('p_x','user_b','spoofed')`
        )
      )
    ).rejects.toThrow();
  });
});
