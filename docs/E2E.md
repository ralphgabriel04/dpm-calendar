# End-to-End Testing (Playwright)

This project uses [Playwright](https://playwright.dev/) for browser-level
end-to-end (E2E) tests. The specs live in [`tests/e2e/`](../tests/e2e) and are
separate from the Vitest unit/integration tests (which live in `tests/` and
`src/`). Vitest is configured to ignore `tests/e2e/**`.

> **Honesty note:** These specs are written to be correct and list-able, but
> **they cannot run green without a running app instance _and_ a seeded
> database**. Browsers are not installed by default either. Several specs are
> intentionally marked `test.fixme()` until a seeded, OAuth-free test
> environment exists (details below).

## Prerequisites to actually run them

1. **Install Playwright browsers** (one-time, downloads Chromium etc.):

   ```bash
   npx playwright install
   # or, on CI / Linux, also install OS deps:
   npx playwright install --with-deps
   ```

2. **A running app with a database.** Two options:

   - **Local dev server (default).** Provide a working `.env.local` with a
     reachable `DATABASE_URL` (and `AUTH_SECRET`), run migrations, and let
     Playwright boot the dev server for you:

     ```bash
     cp .env.example .env.local   # then fill in DATABASE_URL, AUTH_SECRET, ...
     npm run db:push              # or: npm run db:migrate
     npm run test:e2e
     ```

     When `E2E_BASE_URL` is **not** set, `playwright.config.ts` starts
     `npm run dev` and waits for `http://localhost:3000`.

   - **Against an already-running / deployed URL.** Skip the managed dev server
     entirely by setting `E2E_BASE_URL`:

     ```bash
     E2E_BASE_URL=https://your-preview.vercel.app npm run test:e2e
     ```

     When `E2E_BASE_URL` is set, Playwright does **not** spawn a dev server
     (this also prevents CI from hanging when no local DB is available).

3. **Demo auth provider for the auth-dependent specs.** The login helper uses
   NextAuth's `Credentials("Demo Account")` provider in
   [`src/infrastructure/auth/config.ts`](../src/infrastructure/auth/config.ts).
   That provider is only registered when **`NODE_ENV !== "production"` AND no
   OAuth provider is configured** (no `GOOGLE_CLIENT_ID`, `MICROSOFT_CLIENT_ID`,
   `GITHUB_CLIENT_ID`, `APPLE_ID`, or `SSO_*`). It find-or-creates a user from
   the submitted email with no password — ideal for tests, but it means the
   auth specs need an OAuth-free dev environment with a database.

## Running

```bash
npm run test:e2e        # headless run, both projects (chromium + mobile)
npm run test:e2e:ui     # interactive Playwright UI mode
npx playwright test --list   # list all tests without launching browsers
npx playwright test smoke.spec.ts            # a single file
npx playwright test --project=chromium       # one project only
```

## Projects (viewports)

`playwright.config.ts` defines two projects:

| Project    | Device              | Purpose                          |
| ---------- | ------------------- | -------------------------------- |
| `chromium` | Desktop Chrome      | Default desktop coverage         |
| `mobile`   | Pixel 7 (~390px)    | Real mobile viewport / responsive |

## Spec status: active vs. fixme

"Active" specs need only a **running app** (no auth, no DB writes). "Fixme"
specs additionally need **seeded auth + a database** and are marked
`test.fixme()` with an inline reason so they neither run nor report false
greens.

| Spec | Test | Status | Why |
| ---- | ---- | ------ | --- |
| `smoke.spec.ts` | `/` returns 200 + renders landing | **Active** | Public page |
| `smoke.spec.ts` | `/login` shows login page | **Active** | Public page |
| `auth.spec.ts` | protected route redirects to `/login` | **Active** | Edge middleware, no DB |
| `auth.spec.ts` | demo credentials login | `fixme` | Needs `NODE_ENV!=production` + no OAuth + DB |
| `tasks.spec.ts` | create task appears | `fixme` | Needs auth session + DB (tRPC `task.create`) |
| `tasks.spec.ts` | edit task title | `fixme` | Needs auth session + DB (tRPC `task.update`) |
| `habits.spec.ts` | check/uncheck updates streak | `fixme` | Needs auth + a seeded habit |
| `i18n.spec.ts` | FR↔EN hero text changes | **Active** | Public landing + `NEXT_LOCALE` cookie |
| `mobile.spec.ts` | landing renders at mobile width | **Active** | Public page, Pixel 7 viewport |
| `mobile.spec.ts` | authenticated bottom nav | `fixme` | Needs auth + DB; nav only on mobile viewport |
| `isolation.spec.ts` | user B can't see user A's task | `fixme` | Needs two seeded demo accounts + DB |

To "activate" the fixme specs once a seeded test DB + demo auth exist, change
`test.fixme(...)` to `test(...)` in the relevant file.

## Selectors

Specs prefer resilient role/text selectors (`getByRole`, `getByText`,
`getByLabel`, placeholders) over brittle CSS. Shared selectors and the `login()`
helper live in [`tests/e2e/helpers.ts`](../tests/e2e/helpers.ts).

## CI integration (next step)

E2E is not yet wired into CI. The recommended next step is a GitHub Actions job
that provisions Postgres, installs browsers, seeds the DB, and runs the suite —
for example:

```yaml
e2e:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: dpm_test
      ports: ["5432:5432"]
      options: >-
        --health-cmd "pg_isready -U postgres"
        --health-interval 10s --health-timeout 5s --health-retries 5
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dpm_test
    AUTH_SECRET: test-secret-not-for-prod
    # Leave OAuth vars UNSET so the demo credentials provider is active.
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 20, cache: npm }
    - run: npm ci
    - run: npm run db:push
    - run: npx playwright install --with-deps
    # Flip the relevant test.fixme() -> test() once seeding is in place.
    - run: npm run test:e2e
```

Because the managed `webServer` runs `npm run dev`, CI can either rely on it (no
`E2E_BASE_URL`) or build + `npm run start` separately and point `E2E_BASE_URL`
at it for a more production-like target.
