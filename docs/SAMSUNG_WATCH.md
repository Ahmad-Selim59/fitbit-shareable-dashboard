# Samsung watch support

## Per-profile setup

When creating a dashboard at [`/join`](../app/join/page.tsx), choose **Samsung (Google Health)** as the watch type.

After OAuth:

1. Ensure your Galaxy Watch syncs to Samsung Health on your phone.
2. Data must reach your **Google Health cloud account** (same OAuth as Fitbit/Pixel).
3. Use **Manage profile** (`/p/[slug]/manage`) with your admin password to re-check which features are available.

Sections without data are hidden automatically on the dashboard.

## Samsung Health app-only users

Not supported. Samsung has no web OAuth API. Data in Samsung Health alone does not appear in this app unless it is also in the Google Health API for the connected Google account.

## Data path

```
Galaxy Watch → Samsung Health app → (optional) Health Connect on phone
```

This dashboard reads from `health.googleapis.com` only.
