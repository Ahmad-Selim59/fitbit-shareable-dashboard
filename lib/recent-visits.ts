export type RecentVisit = {
  slug: string;
  displayName: string;
  hasViewerPassword: boolean;
  visitedAt: number;
};

const STORAGE_KEY = "health_dashboard_recent_visits";
const MAX_VISITS = 12;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getRecentVisits(): RecentVisit[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentVisit[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (v) =>
          typeof v.slug === "string" &&
          typeof v.displayName === "string" &&
          typeof v.visitedAt === "number",
      )
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, MAX_VISITS);
  } catch {
    return [];
  }
}

export function addRecentVisit(visit: {
  slug: string;
  displayName: string;
  hasViewerPassword: boolean;
}): void {
  if (!isBrowser()) return;
  const normalized = visit.slug.trim().toLowerCase();
  if (!normalized) return;

  const next: RecentVisit = {
    slug: normalized,
    displayName: visit.displayName,
    hasViewerPassword: visit.hasViewerPassword,
    visitedAt: Date.now(),
  };

  const existing = getRecentVisits().filter((v) => v.slug !== normalized);
  const merged = [next, ...existing].slice(0, MAX_VISITS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}
