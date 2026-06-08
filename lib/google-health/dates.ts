export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Local calendar today as YYYY-MM-DD (matches Fitbit civil day). */
export function localTodayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type HealthDate = { year?: number; month?: number; day?: number };

export type CivilDateTime = {
  date?: string | HealthDate;
  time?: unknown;
};

export function healthDateToString(d?: HealthDate): string | null {
  if (!d?.year || !d?.month || !d?.day) return null;
  const month = String(d.month).padStart(2, "0");
  const day = String(d.day).padStart(2, "0");
  return `${d.year}-${month}-${day}`;
}

/** Parse Google CivilDateTime (string or { year, month, day }) → YYYY-MM-DD. */
export function civilDateTimeToString(c?: CivilDateTime): string | null {
  if (!c?.date) return null;
  if (typeof c.date === "string") return c.date.slice(0, 10);
  return healthDateToString(c.date);
}

/** YYYY-MM-DD → dailyRollUp request `{ date: { year, month, day } }`. */
export function toCivilDateRequest(dateStr: string): { date: HealthDate } {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { date: { year: y, month: m, day: d } };
}

export function queryDateRange(days: number): {
  start: string;
  end: string;
  endExclusive: string;
} {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const endExclusive = new Date(end);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return {
    start: formatDate(start),
    end: formatDate(end),
    endExclusive: formatDate(endExclusive),
  };
}

/** Milliseconds from now until local midnight (when yesterday’s totals are final). */
export function msUntilLocalMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return midnight.getTime() - now.getTime();
}

/** YYYY-MM-DD → next calendar day (local). */
export function nextDayAfter(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${month}-${day}`;
}
