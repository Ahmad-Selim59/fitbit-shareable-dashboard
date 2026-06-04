import type { SpO2DayView } from "@/lib/google-health/data";
import { MetricCard } from "./metric-card";

function formatDateLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function SpO2Section({ days }: { days: SpO2DayView[] }) {
  const latest = days[0];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Blood oxygen (SpO₂)
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Daily SpO₂ summary (typically measured during sleep)
        </p>
      </div>

      {latest && (
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Latest avg"
            value={`${Math.round(latest.avg)}%`}
            hint={formatDateLabel(latest.date)}
          />
          <MetricCard label="Min" value={`${Math.round(latest.min)}%`} />
          <MetricCard label="Max" value={`${Math.round(latest.max)}%`} />
        </div>
      )}

      {days.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700">
          No SpO₂ data returned. Enable blood oxygen on your device and ensure
          the health metrics scope was granted during owner setup.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Avg</th>
                <th className="px-4 py-3 font-medium">Min</th>
                <th className="px-4 py-3 font-medium">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {days.map((day) => (
                <tr key={day.date} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    {formatDateLabel(day.date)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {Math.round(day.avg)}%
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {Math.round(day.min)}%
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {Math.round(day.max)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
