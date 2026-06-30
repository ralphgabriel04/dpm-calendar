# DPM Elevate

A privacy-first calendar, tasks, habits, goals and focus app. Single-user today,
with real Google/Microsoft calendar sync and Quebec **Loi 25** compliance built in.

## Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 14** (App Router) + TypeScript (strict) |
| API | **tRPC v11** (feature-sliced routers) with **Zod** validation |
| Data | **Prisma** + **PostgreSQL** (hosted on Supabase) |
| Auth | **NextAuth v5** (Google, Microsoft, Apple, GitHub, OIDC SSO) |
| UI | Tailwind + Radix/shadcn-style components, `next-intl` (fr/en) |
| State | TanStack Query (server) + Zustand (UI only) |
| Hosting | Vercel (cron at `/api/cron/sync`) |
| Tests | Vitest (unit + gated integration) |

Everything free-tier: Supabase Postgres + Vercel + Resend.

## Getting started

```bash
npm install                 # also runs prisma generate (postinstall)
cp .env.example .env.local   # then fill in the values (see below)
npm run db:migrate           # apply Prisma migrations to your dev DB
npm run dev                  # http://localhost:3000
```

Minimum env to boot locally: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`
(`openssl rand -base64 32`), `AUTH_URL`, `ENCRYPTION_KEY`
(`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
Without any OAuth provider configured, a dev-only passwordless "Demo Account"
login is available (disabled in production). See `.env.example` for the rest.

## Scripts

| Command | What |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm test` | Vitest (unit; RLS integration skipped unless `TEST_DATABASE_URL`) |
| `npx tsc --noEmit` | Typecheck |
| `npm run lint` | ESLint |
| `npm run db:migrate` / `db:studio` | Prisma migrate (dev) / Prisma Studio |

## Security model

- **Authorization** is enforced in every tRPC procedure via `ctx.session.user.id`
  (`protectedProcedure` / `protectedMutationProcedure` / `protectedSyncProcedure`).
- **Defense-in-depth RLS** at the database layer — see below.
- OAuth tokens are encrypted at rest (AES-256-GCM, `src/lib/crypto.ts`).
- Per-user/IP rate limiting (`src/lib/rateLimit.ts`).
- Security headers + CSP in `next.config.mjs` (currently Report-Only).
- Loi 25: self-serve account deletion + data export + audit log
  (`src/features/auth/server/user.router.ts`, `docs/compliance/`).

## RLS rollout (defense-in-depth)

Migration `prisma/migrations/20260630000000_add_rls_policies` enables Postgres
Row Level Security on every user-owned table. Policies key off a request-scoped
GUC `app.current_user_id` and **fail closed** (no GUC ⇒ zero rows). Verified on a
real database: cross-user reads, writes, child rows, and ownership spoofing are
all denied (see `tests/integration/rls.test.ts`).

**Phase A — apply the migration (safe, no behavior change).**
On Supabase the `postgres` and `service_role` roles have `BYPASSRLS`, and the app
connects as `postgres`. So enabling RLS immediately protects the `anon` /
`authenticated` API roles and any direct/non-bypass access, while the Prisma path
keeps working unchanged. Just run the migration.

**Phase B — enforce RLS on the Prisma path (opt-in).**
1. Give the `app_user` role (created by the migration) a login + password.
2. Point the runtime `DATABASE_URL` at `app_user` (NOBYPASSRLS).
3. Set `ADMIN_DATABASE_URL` to the owner/`postgres` connection — the NextAuth
   adapter and `/api/cron/sync` use this via `dbAdmin` (`src/infrastructure/db/client.ts`).
4. Wrap user-scoped Prisma work in `withRls(userId, tx => …)`
   (`src/infrastructure/db/rls.ts`), or swap `ctx.db` for it in `authMiddleware`.
5. Validate against a dev DB: `TEST_DATABASE_URL=… npm test` runs the RLS
   integration suite.

## Project layout

```
src/
  app/                 # Next.js routes (dashboard, auth, api)
  features/<domain>/    # components + server/*.router.ts + types  (feature-sliced)
  infrastructure/       # api (tRPC root), trpc, db, auth
  lib/, shared/, i18n/, stores/, middleware.ts
prisma/                 # schema.prisma + migrations
tests/                  # unit + integration (Vitest)
messages/               # fr/en i18n
docs/, wiki/            # ADRs, compliance, architecture
```

See `docs/decisions/` (ADRs) and `wiki/` for deeper architecture and setup docs.
