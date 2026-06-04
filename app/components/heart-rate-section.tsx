import type { RestingHeartRateDay } from "@/lib/google-health/data";
import { MetricCard } from "./metric-card";

function formatDateLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function HeartRateSection({
  days,
}: {
  days: RestingHeartRateDay[];
}) {
  const latest = days[0];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Heart rate
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Daily resting heart rate (last 7 days)
        </p>
      </div>

      {latest && (
        <MetricCard
          label="Latest resting HR"
          value={`${latest.restingBpm} bpm`}
          hint={formatDateLabel(latest.date)}
        />
      )}

      {days.length === 0 ? (
        <p className="text-sm text-zinc-500">No heart rate data for this range.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Resting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {days.map((day) => (
                <tr key={day.date} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    {formatDateLabel(day.date)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{day.restingBpm} bpm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
