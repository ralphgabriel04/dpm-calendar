# Deployment guide (Vercel + Supabase, free tier)

DPM Elevate runs on **Vercel** (Next.js) + **Supabase Postgres**. This guide takes
you from zero to a live deployment.

## 1. Database (Supabase)

A project is already provisioned and **fully migrated** (49 tables, RLS enabled):
`dpm-calendar` (ref `mlfweqxcvptfwltvtwpl`, region ca-central-1).

If you start a fresh project instead, apply the schema with:

```bash
npx prisma migrate deploy   # applies all migrations from prisma/migrations
```

> The already-provisioned DB was migrated directly, so its Prisma migration
> history (`_prisma_migrations`) is empty. **Do not run `prisma migrate deploy`
> against it** — the app works as-is (Prisma Client only queries). To baseline the
> history for future migrations, run once:
> `npx prisma migrate resolve --applied <migration_name>` for each folder in
> `prisma/migrations/`.

### Connection strings

Open Supabase → your project → **Connect** → *ORMs / Prisma*. Copy:

- **Transaction pooler** (port 6543) → `DATABASE_URL` (serverless-safe; append `?pgbouncer=true`)
- **Session pooler** or **Direct** (port 5432) → `DIRECT_URL` (used by migrations)

```bash
DATABASE_URL="postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

For **local dev** the simple direct connection is fine for both:
`postgresql://postgres:<PASSWORD>@db.<ref>.supabase.co:5432/postgres`.

## 2. Vercel project

1. Import the GitHub repo into Vercel (Framework preset: **Next.js**, auto-detected).
2. Build command is already `prisma generate && next build` (from `package.json`);
   no override needed. Output: `.next` (default).
3. Add the **Environment Variables** below (Production + Preview).
4. Deploy. The cron in `vercel.json` (`/api/cron/sync` every 5 min) is registered
   automatically.

### Required environment variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase **transaction pooler** URI (see above) |
| `DIRECT_URL` | Supabase **direct/session** URI |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | your production URL, e.g. `https://your-app.vercel.app` |
| `ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` — **never change once set** (encrypted OAuth tokens become unreadable) |
| `CRON_SECRET` | random string; the `/api/cron/sync` route requires it |

### Optional (features stay "configuration required" until set)

| Feature | Variables |
|---|---|
| Google login + Calendar | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Microsoft login + Outlook | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` |
| Email (invites) | `RESEND_API_KEY`, `EMAIL_FROM` |
| Billing (Stripe) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM` — see `docs/BILLING.md` |
| Notion / TickTick | `NOTION_CLIENT_ID/SECRET`, `TICKTICK_CLIENT_ID/SECRET` — callbacks `https://YOUR_DOMAIN/api/integrations/oauth/<provider>/callback` (see `docs/INTEGRATIONS.md`) |

Todoist needs no env — users paste their own API token.

## 3. OAuth redirect URIs

For each provider you enable, register the production callback:
- Google/Microsoft (login): `https://YOUR_DOMAIN/api/auth/callback/<provider>`
- Google/Microsoft (calendar sync): existing `/api/auth/<provider>-calendar/callback`
- Notion/TickTick: `https://YOUR_DOMAIN/api/integrations/oauth/<provider>/callback`
- Stripe webhook: `https://YOUR_DOMAIN/api/stripe/webhook`

## 4. Security note — enforce RLS on the Prisma path (optional, Phase B)

By default the app connects as `postgres` (BYPASSRLS on Supabase): RLS protects
the `anon`/`authenticated`/direct paths but not the Prisma path. To enforce RLS on
Prisma too, follow the **"RLS rollout"** section in `README.md` (give `app_user` a
login, point `DATABASE_URL` at it, set `ADMIN_DATABASE_URL`, and use `withRls()`).

## 5. Post-deploy checklist

- [ ] App loads; sign-in works (Demo Account in dev, or a configured OAuth provider).
- [ ] Create a task / note / space → persists.
- [ ] `/api/cron/sync` returns 401 without the `CRON_SECRET` header (guard works).
- [ ] CSP report sink `/api/csp-report` reachable; watch logs, then flip CSP to
      enforced (see `next.config.mjs`).
- [ ] Run e2e against the deployment: `E2E_BASE_URL=https://YOUR_DOMAIN npm run test:e2e`.

## Cost at a glance (free tier)

- **0–100 users**: Supabase Free (500 MB DB, 2 projects) + Vercel Hobby + Resend
  Free (3k emails/mo) = **$0**.
- **~1,000 users**: likely still free; watch Supabase DB size / Vercel function
  usage. Upgrade Supabase Pro ($25/mo) when you exceed 500 MB or need daily backups.
- Stripe: no monthly fee (per-transaction %). Only the merchant pays on real charges.
