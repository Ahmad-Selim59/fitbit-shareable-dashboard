Personal health dashboard for heart rate, sleep, and SpO₂. Uses the **Google Health API** (successor to the legacy Fitbit Web API). OAuth and tokens live on the server only.

## Google Cloud setup

1. Follow [Set up Google Cloud and OAuth](https://developers.google.com/health/setup) — enable **Google Health API** and create an OAuth **Web application** client.
2. **Authorized redirect URI** (Credentials → your OAuth client):
   ```
   http://localhost:3000/api/auth/google/callback
   ```
3. **Data Access** → add scopes:
   - `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`
   - `https://www.googleapis.com/auth/googlehealth.sleep.readonly`
4. **OAuth consent screen** → keep **Testing**, add your Google account under **Test users** (required for personal use).
5. Copy **Client ID** and **Client secret** into `.env.local` (see `env.example`).

## Local env

```bash
cp env.example .env.local
# fill GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
pnpm dev
```

6. **One-time owner setup:** open [http://localhost:3000/setup](http://localhost:3000/setup) and authorize **your** Google account (you may see Fitbit mentioned on Google’s consent screen — that is expected).

7. Open [http://localhost:3000](http://localhost:3000) — your data loads with **no sign-in** for you or visitors.

Tokens are stored locally in `.data/google-health-tokens.json` (gitignored). On **Vercel**, tokens are stored in an httpOnly cookie (the filesystem is read-only).

**Vercel environment variables** (Settings → Environment Variables → redeploy):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` = `https://YOUR-DOMAIN.vercel.app/api/auth/google/callback`
- `NEXT_PUBLIC_APP_URL` = `https://YOUR-DOMAIN.vercel.app`

Client ID/secret alone are not enough; complete owner `/setup` once to obtain a refresh token.

**Note:** In Testing mode, refresh tokens may expire after 7 days — reconnect if data stops loading.

## Optional site password

Set `DASHBOARD_PASSWORD` in `.env.local` to require a password before viewing the dashboard.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
```
