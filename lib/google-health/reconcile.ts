import { healthFetchForProfile } from "./client";

/** Merged stream across Fitbit, Pixel, Health Connect, and other sources. */
export const RECONCILE_ALL_SOURCES =
  "users/me/dataSourceFamilies/all-sources";

type ReconcileResponse<T> = {
  dataPoints?: T[];
  nextPageToken?: string;
};

export async function listAllReconciledDataPoints<T>(
  slug: string,
  dataType: string,
  filter: string,
  pageSize = 100,
): Promise<T[]> {
  const all: T[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      filter,
      pageSize: String(pageSize),
      dataSourceFamily: RECONCILE_ALL_SOURCES,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const path = `/v4/users/me/dataTypes/${dataType}/dataPoints:reconcile?${params}`;
    const res = await healthFetchForProfile<ReconcileResponse<T>>(slug, path);
    all.push(...(res.dataPoints ?? []));
    pageToken = res.nextPageToken;
  } while (pageToken);

  return all;
}
