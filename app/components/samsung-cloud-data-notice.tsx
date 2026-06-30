export function SamsungCloudDataNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-medium">Samsung: only steps in Google Health cloud?</p>
      <p className="mt-1">
        If heart rate and sleep show in the Google Health app on your phone but
        not here, Google&apos;s cloud API likely only has your steps — not
        Samsung Health Connect metrics. This site reads{" "}
        <code className="text-xs">health.googleapis.com</code>, not Samsung
        Health directly. Fitbit/Pixel watches work fully; Samsung is limited by
        Google&apos;s platform today.
      </p>
      <p className="mt-2 text-xs">
        Use <strong>Diagnose Google Health data</strong> in manage settings to
        see what Google&apos;s API returns for this account.
      </p>
    </div>
  );
}
