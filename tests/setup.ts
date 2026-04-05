// Vitest setup file.
// Provide a deterministic encryption key for crypto tests and any other
// env vars expected by modules under test. Individual tests may override.
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  "test-encryption-key-at-least-32-chars-long-xxxxxx";
