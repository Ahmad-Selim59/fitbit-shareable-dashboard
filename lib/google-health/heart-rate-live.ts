import { healthFetch } from "./client";
import {
  bucketSecondsForSpan,
  downsampleHeartRate,
  samplesInWindow,
} from "./downsample";

type HeartRatePoint = {
  heartRate?: {
    sampleTime?: { physicalTime?: string };
    beatsPerMinute?: string;
  };
};

type ListResponse = {
  dataPoints?: HeartRatePoint[];
  nextPageToken?: string;
};

export type LiveHeartRateSample = {
  bpm: number;
  at: string;
};

export type LiveHeartRateData = {
  latest: LiveHeartRateSample | null;
  /** Downsampled series for the trend chart */
  chartSamples: LiveHeartRateSample[];
  chartBucketSeconds: number;
  fetchedAt: string;
};

const WINDOW_HOURS = 6;
const CHART_WINDOW_MS = 2 * 60 * 60 * 1000; // last 2 hours on the chart
const CHART_TARGET_BARS = 80;
const PAGE_SIZE = 500;
const MAX_PAGES = 3;

export async function fetchLiveHeartRate(): Promise<LiveHeartRateData> {
  const end = new Date();
  const start = new Date(end.getTime() - WINDOW_HOURS * 60 * 60 * 1000);
  const filter = `heart_rate.sample_time.physical_time >= "${start.toISOString()}" AND heart_rate.sample_time.physical_time < "${end.toISOString()}"`;

  const samples: LiveHeartRateSample[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const params = new URLSearchParams({
      filter,
      pageSize: String(PAGE_SIZE),
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await healthFetch<ListResponse>(
      `/v4/users/me/dataTypes/heart-rate/dataPoints?${params}`,
    );

    for (const p of res.dataPoints ?? []) {
      const hr = p.heartRate;
      if (!hr?.beatsPerMinute || !hr.sampleTime?.physicalTime) continue;
      const bpm = parseInt(hr.beatsPerMinute, 10);
      if (bpm > 0) {
        samples.push({ bpm, at: hr.sampleTime.physicalTime });
      }
    }

    pageToken = res.nextPageToken;
    pages++;
  } while (pageToken && pages < MAX_PAGES);

  samples.sort((a, b) => b.at.localeCompare(a.at));
  const chronological = [...samples].reverse();
  const windowed = samplesInWindow(chronological, CHART_WINDOW_MS);
  const bucketSec = bucketSecondsForSpan(CHART_WINDOW_MS, CHART_TARGET_BARS);
  const chartSamples = downsampleHeartRate(windowed, bucketSec);

  return {
    latest: samples[0] ?? null,
    chartSamples,
    chartBucketSeconds: bucketSec,
    fetchedAt: new Date().toISOString(),
  };
}
