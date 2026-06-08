# Samsung watch support

## What is implemented (Phase 1)

Samsung Galaxy Watch users who have health data in their **Google Health cloud account** can use the same Google OAuth flow as Fitbit/Pixel users.

On `/setup`, after connecting:

1. Select **Samsung (Google Health)** as the watch type.
2. Follow the Samsung checklist (sync watch → Samsung Health → connect Google).
3. Run **Re-check features** to probe which metrics your account exposes.
4. The dashboard hides sections with no data (battery is usually hidden for Samsung).

Settings persist in `.data/watch-settings.json` locally or an httpOnly cookie on Vercel. For production, set `WATCH_TYPE=samsung` in environment variables alongside `GOOGLE_REFRESH_TOKEN`.

## What is not implemented

**Samsung Health app-only users** (data that never reaches Google Health API) are not supported. Samsung does not provide a web OAuth API with refresh tokens like Google Health.

A future Phase 2 would require a separate Android companion app using the Samsung Health Data SDK to read on-device data and push it to this dashboard’s backend. That work is deferred.

## Data path reference

```
Galaxy Watch → Samsung Health app → (optional) Health Connect on phone
```

Health Connect is on-device only. This dashboard reads from `health.googleapis.com`, which officially documents Fitbit and Pixel Watch as supported cloud sources. Samsung data appears here only if it is present in the authorized Google account.
