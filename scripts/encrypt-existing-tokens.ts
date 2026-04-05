/**
 * One-shot migration script: encrypts all existing OAuth tokens in CalendarAccount.
 *
 * Usage (from repo root):
 *   npx tsx scripts/encrypt-existing-tokens.ts
 *
 * Prerequisites:
 *   - ENCRYPTION_KEY is set in .env / .env.local
 *   - DATABASE_URL + DIRECT_URL are valid
 *
 * Safe to re-run: already-encrypted tokens (prefixed with "enc:v1:") are skipped.
 */

import { PrismaClient } from "@prisma/client";
import { encryptToken, isEncrypted } from "../src/lib/crypto";

const db = new PrismaClient();

async function main() {
  const accounts = await db.calendarAccount.findMany({
    select: { id: true, accessToken: true, refreshToken: true, provider: true, email: true },
  });

  let encrypted = 0;
  let skipped = 0;

  for (const account of accounts) {
    const updates: { accessToken?: string; refreshToken?: string } = {};

    if (account.accessToken && !isEncrypted(account.accessToken)) {
      updates.accessToken = encryptToken(account.accessToken);
    }
    if (account.refreshToken && !isEncrypted(account.refreshToken)) {
      updates.refreshToken = encryptToken(account.refreshToken);
    }

    if (Object.keys(updates).length > 0) {
      await db.calendarAccount.update({ where: { id: account.id }, data: updates });
      encrypted++;
      console.log(`  encrypted: ${account.provider} / ${account.email}`);
    } else {
      skipped++;
    }
  }

  console.log(`\nDone. ${encrypted} account(s) encrypted, ${skipped} already encrypted (skipped).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
