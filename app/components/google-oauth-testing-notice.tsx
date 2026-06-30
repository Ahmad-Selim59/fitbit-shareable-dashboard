import { isGoogleOAuthTestingMode } from "@/lib/google-health/oauth-config";

export function GoogleOAuthTestingNotice() {
  if (!isGoogleOAuthTestingMode()) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-medium">Google OAuth is in testing mode</p>
      <p className="mt-1">
        Authorization lasts about <strong>7 days</strong>, then the dashboard
        stops loading data until you reconnect Google in manage settings. To
        remove this limit, publish your Google Cloud OAuth app to production
        and complete verification.
      </p>
    </div>
  );
}
