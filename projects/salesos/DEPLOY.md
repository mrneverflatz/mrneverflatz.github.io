# Deploying SalesOS (Vercel + Supabase Postgres)

Architecture: **Browser → Vercel (Next.js + API routes) → Supabase Postgres**.
The database does **not** live on Vercel; Vercel functions are stateless and connect to Supabase over TCP via `DATABASE_URL`.

## 1. Get the Supabase connection string

In your Supabase project: **Connect** (top bar) → **Connection string** → **URI**.

You'll see three flavors. For this app use the **Session pooler** — it's IPv4-friendly,
works for both schema setup (DDL) and the serverless runtime, and needs no extra flags:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Append **`?sslmode=no-verify`** to the string. The app connects through the Node
`pg` driver adapter, which strictly validates TLS certs and rejects Supabase's
pooler CA with `sslmode=require` (error: *self-signed certificate in certificate
chain*). `no-verify` keeps the connection encrypted but skips chain verification.

> Scale note: for high traffic on serverless, switch the *runtime* URL to the
> **Transaction pooler** (port `6543`) and add `?pgbouncer=true`. For a demo, the
> session pooler above is simpler and fine.

## 2. Local: push schema + seed against Supabase

Put the string in `.env` (gitignored), then:

```bash
npm run db:generate   # generate the Prisma client into app/generated/prisma
npm run db:push       # create tables in Supabase (no migrations exist yet)
npm run db:seed       # load demo data
npm run dev           # verify it connects locally
```

## 3. Deploy to Vercel

This app lives in a **monorepo subfolder** (`projects/salesos`) inside the
`mrneverflatz.github.io` repo, so Vercel must be pointed at it.

1. In Vercel, **Import** the `mrneverflatz.github.io` repo, then set
   **Root Directory = `projects/salesos`** (Project → Settings → Build & Deployment,
   or during import). Everything else (build command, output) is auto-detected.
2. **Environment Variables** (Project → Settings → Environment Variables) — add for
   Production (and Preview if you want):
   - `DATABASE_URL` = the Supabase session-pooler string from step 1
   - `JWT_SECRET`   = a 32+ char secret
   - `SEED_SECRET`  = secret for `POST /api/seed/monthly`
3. Deploy. The build runs `prisma generate && next build` (already wired in
   `package.json`), so the gitignored Prisma client is regenerated on Vercel.

## Notes
- `.env*` and `app/generated/prisma` are gitignored — that's why `prisma generate`
  runs in the build step and why secrets must be set in the Vercel dashboard.
- The schema is pushed with `db:push` (no migration history). If you later want
  production-grade migrations, run `npm run db:migrate -- --name init` once and
  switch the deploy to `prisma migrate deploy`.
