import type { SleepLogView } from "@/lib/google-health/data";
import { MetricCard } from "./metric-card";

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatDateLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatStages(stages: SleepLogView["stages"]): string {
  const entries = (
    [
      { label: "Deep", mins: stages.deep },
      { label: "Light", mins: stages.light },
      { label: "REM", mins: stages.rem },
      { label: "Wake", mins: stages.wake },
    ] as const
  ).filter((e) => e.mins != null && e.mins > 0);

  const total = entries.reduce((sum, e) => sum + (e.mins ?? 0), 0);
  if (total === 0) return "";

  return entries
    .map((e) => {
      const pct = Math.round(((e.mins ?? 0) / total) * 100);
      return `${e.label} ${e.mins}m (${pct}%)`;
    })
    .join(" · ");
}

export function SleepSection({ logs }: { logs: SleepLogView[] }) {
  const latest = logs[0];
  const withEfficiency = logs.filter((l) => l.efficiency != null);
  const avgEfficiency =
    withEfficiency.length > 0
      ? Math.round(
          withEfficiency.reduce((sum, log) => sum + (log.efficiency ?? 0), 0) /
            withEfficiency.length,
        )
      : null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Sleep
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sleep sessions from the last 7 days · stage % is share of that night
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {latest && (
          <MetricCard
            label="Last night asleep"
            value={minutesToHours(latest.minutesAsleep)}
            hint={formatDateLabel(latest.dateOfSleep)}
          />
        )}
        {avgEfficiency != null && (
          <MetricCard
            label="Avg efficiency (7d)"
            value={`${avgEfficiency}%`}
          />
        )}
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-zinc-500">No sleep logs for this range.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Night</th>
                <th className="px-4 py-3 font-medium">Asleep</th>
                <th className="px-4 py-3 font-medium">Efficiency</th>
                <th className="px-4 py-3 font-medium">Stages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {logs.map((log) => {
                const stages = formatStages(log.stages);

                return (
                  <tr
                    key={`${log.dateOfSleep}-${log.startTime}`}
                    className="bg-white dark:bg-zinc-950"
                  >
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {formatDateLabel(log.dateOfSleep)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {minutesToHours(log.minutesAsleep)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {log.efficiency != null ? `${log.efficiency}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {stages || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
