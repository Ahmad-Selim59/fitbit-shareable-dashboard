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
          Optional: in Samsung Health → Settings → Health Connect, allow data
          sharing (helps if you use other Android health apps).
        </li>
        <li>
          Connect your Google account below — same OAuth as Fitbit/Pixel users.
          Only metrics in your Google Health cloud account will appear here.
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
