Multi-user health dashboard for heart rate, steps, sleep, and SpO₂. Uses the **Google Health API** with **Supabase** for per-profile token storage.

Anyone can browse public dashboards. Users add their own at `/join` via Google OAuth — refresh tokens are encrypted in Supabase.

## Prerequisites

1. [Google Cloud + OAuth](https://developers.google.com/health/setup) — enable **Google Health API**, create a **Web application** OAuth client.
2. **Supabase** project — run the migration in [`supabase/migrations/001_profiles.sql`](supabase/migrations/001_profiles.sql).

### Google OAuth redirect URI

```
http://localhost:3000/api/auth/google/callback
```

Add Data Access scopes (see Google Health setup docs): health metrics, sleep, activity/fitness, and settings (for watch battery).

### Supabase

In the SQL editor, run `supabase/migrations/001_profiles.sql`. All app access uses the **service role key** on the server only (RLS enabled, no public policies).

## Local env

```bash
cp env.example .env.local
# fill GOOGLE_*, SUPABASE_*, TOKEN_ENCRYPTION_KEY, ADMIN_PASSWORD_ENC
pnpm dev
```

Generate encryption key:

```bash
openssl rand -hex 32
```

Encrypt super-admin password (same key as Google tokens):

```bash
TOKEN_ENCRYPTION_KEY=your-64-hex-key node scripts/encrypt-admin-password.mjs "your-admin-password"
```

Paste the printed `ADMIN_PASSWORD_ENC=...` into `.env.local` or Vercel.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Public directory + slug search |
| `/join` | Create a profile (Google OAuth) |
| `/p/[slug]` | Profile dashboard |
| `/p/[slug]/unlock` | Viewer password |
| `/p/[slug]/manage` | Admin password — delete, re-check features |
| `/admin` | Super-admin (`ADMIN_PASSWORD_ENC`) — delete any profile |

## Vercel

Set all env vars from `env.example`, including:

- `GOOGLE_REDIRECT_URI` = `https://YOUR-DOMAIN.vercel.app/api/auth/google/callback`
- `NEXT_PUBLIC_APP_URL` = `https://YOUR-DOMAIN.vercel.app`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `TOKEN_ENCRYPTION_KEY`, `ADMIN_PASSWORD_ENC` (see `scripts/encrypt-admin-password.mjs`)

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
```
