import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  isEncrypted,
  encryptToken,
  decryptToken,
  encryptOptionalToken,
  decryptOptionalToken,
} from "@/lib/crypto";

describe("crypto", () => {
  it("encrypt/decrypt roundtrip returns the original plaintext", () => {
    const plaintext = "super-secret-oauth-token-abc123";
    const ciphertext = encrypt(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it('encrypted payload starts with the "enc:v1:" prefix', () => {
    const ciphertext = encrypt("hello world");
    expect(ciphertext.startsWith("enc:v1:")).toBe(true);
    expect(isEncrypted(ciphertext)).toBe(true);
    expect(isEncrypted("plain-legacy-value")).toBe(false);
    expect(isEncrypted(null)).toBe(false);
    expect(isEncrypted(undefined)).toBe(false);
  });

  it("decrypts legacy plaintext tokens transparently (backward compat)", () => {
    // legacy stored tokens were just plain base64 (or any plain string),
    // decrypt should pass them through unchanged.
    const legacyPlain = "ya29.legacyPlainOAuthTokenValue";
    expect(decrypt(legacyPlain)).toBe(legacyPlain);
    expect(decryptToken(legacyPlain)).toBe(legacyPlain);
    expect(decryptOptionalToken(legacyPlain)).toBe(legacyPlain);
  });

  it("encryptToken is idempotent on already-encrypted values", () => {
    const once = encryptToken("my-token");
    const twice = encryptToken(once);
    expect(twice).toBe(once);
    expect(decryptToken(twice)).toBe("my-token");
  });

  it("encryptOptionalToken / decryptOptionalToken handle null and undefined", () => {
    expect(encryptOptionalToken(null)).toBeNull();
    expect(encryptOptionalToken(undefined)).toBeNull();
    expect(encryptOptionalToken("")).toBeNull();
    expect(decryptOptionalToken(null)).toBeNull();
    expect(decryptOptionalToken(undefined)).toBeNull();

    const enc = encryptOptionalToken("real-token")!;
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(decryptOptionalToken(enc)).toBe("real-token");
  });
});
