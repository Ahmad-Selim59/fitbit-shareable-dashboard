# Samsung watch support

## Per-profile setup

When creating a dashboard at [`/join`](../app/join/page.tsx), choose **Samsung (Google Health)** as the watch type.

After OAuth:

1. Ensure your Galaxy Watch syncs to Samsung Health on your phone.
2. Enable **Health Connect** in Samsung Health → Settings, plus **Consent to processing of health and wellness data**.
3. In **Google Health** → Connections → Health Connect, allow read access for heart rate, sleep, and SpO₂.
4. Data must reach **Google Health cloud** (`health.googleapis.com`) — not just the Google Health app UI.
5. Use **Manage profile** → **Run cloud probe** to see what Google's API actually returns.
6. Use **Re-check features** after syncing.

## Phone app vs this dashboard

| Layer | What it shows |
|-------|----------------|
| Google Health **app** on phone | Merged view including Health Connect (Samsung) data **on device** |
| This **website** | Only what Google's **cloud API** returns via OAuth |

It is common for Samsung users to see heart rate and sleep in the Google Health **app** but **only steps** in the cloud API. That is a Google/Samsung platform limitation — not a bug in this dashboard.

## What works for Samsung today

| Metric | Typical cloud API support |
|--------|---------------------------|
| Steps | Usually yes |
| Live heart rate | Sometimes (if Google cloud has samples) |
| Sleep | Sometimes |
| SpO₂ | Sometimes |
| Daily resting HR | Usually no (Samsung does not share this to Google Health) |
| Watch battery | No |

Fitbit and Pixel watches have full cloud API support.

## Samsung Health app-only users

Not supported. Samsung has no web OAuth API. Data in Samsung Health alone does not appear in this app unless it is also in the Google Health cloud API for the connected Google account.

## Data path

```
Galaxy Watch → Samsung Health app → Health Connect (on phone) → Google Health app (local)
                                                      ↘
                                            Google Health cloud API → this dashboard
```

The last hop (Health Connect → Google cloud) is incomplete for many Samsung metrics today.

This dashboard reads from `health.googleapis.com` only.
