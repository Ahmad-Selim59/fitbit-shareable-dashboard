export function SamsungSetupChecklist() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="font-medium text-zinc-800 dark:text-zinc-200">
        Samsung watch checklist
      </p>
      <ol className="mt-3 list-inside list-decimal space-y-2 text-zinc-600 dark:text-zinc-400">
        <li>
          Pair your Galaxy Watch and confirm data appears in Samsung Health on
          your phone.
        </li>
        <li>
          In Samsung Health → Settings → Health Connect, turn sync on and allow
          heart rate, sleep, and SpO₂. Also enable{" "}
          <strong>Consent to processing of health and wellness data</strong>.
        </li>
        <li>
          Connect your Google account below — same OAuth as Fitbit/Pixel users.
          Only metrics in Google Health <strong>cloud</strong> will appear here
          (use manage → Run cloud probe to verify).
        </li>
        <li>
          Run <strong>Re-check features</strong> after syncing. Sections without
          data are hidden on the dashboard.
        </li>
        <li>
          Watch battery is usually unavailable for Samsung via Google Health —
          that card may stay hidden even when other metrics work.
        </li>
      </ol>
    </div>
  );
}
