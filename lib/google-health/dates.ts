export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
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
