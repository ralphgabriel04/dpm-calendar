import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

/**
 * AES-256-GCM symmetric encryption for OAuth tokens at rest.
 *
 * Ciphertext format (all parts base64-encoded, colon-separated):
 *   enc:v1:<iv>:<authTag>:<ciphertext>
 *
 * The "enc:v1:" prefix lets us detect already-encrypted values and migrate
 * existing plaintext tokens incrementally without a big-bang migration.
 *
 * Key: 32 raw bytes derived from ENCRYPTION_KEY env var via SHA-256 so the
 * user can provide any sufficiently long random string (generated via
 * `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits, recommended for GCM
const PREFIX = "enc:v1:";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 16) {
    throw new Error(
      "ENCRYPTION_KEY env var missing or too short (min 16 chars). Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }
  // SHA-256 gives us a deterministic 32-byte key from any input string.
  cachedKey = createHash("sha256").update(raw, "utf8").digest();
  return cachedKey;
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decrypt(payload: string): string {
  if (!isEncrypted(payload)) {
    // Backward-compat: payload was stored plaintext before encryption was rolled out.
    return payload;
  }
  const body = payload.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = body.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted payload");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

/** Encrypt a token if not already encrypted. Safe to call on already-encrypted values. */
export function encryptToken(token: string): string {
  return isEncrypted(token) ? token : encrypt(token);
}

/** Encrypt an optional token (passes null/undefined through). */
export function encryptOptionalToken(token: string | null | undefined): string | null {
  if (!token) return null;
  return encryptToken(token);
}

/** Decrypt a token stored in DB, transparently handling legacy plaintext values. */
export function decryptToken(stored: string): string {
  return decrypt(stored);
}

export function decryptOptionalToken(stored: string | null | undefined): string | null {
  if (!stored) return null;
  return decrypt(stored);
}
