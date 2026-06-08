import { NextRequest, NextResponse } from "next/server";
import { isGoogleHealthConnected } from "@/lib/google-health/client";
import {
  fetchHeartRateDayChartCached,
  fetchHeartRateHourChartCached,
  fetchHeartRateWindowChartCached,
  HEART_RATE_WINDOW_OPTIONS,
} from "@/lib/google-health/heart-rate-live";

export const dynamic = "force-dynamic";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(iso: string): Date | null {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: NextRequest) {
  if (!(await isGoogleHealthConnected())) {
    return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const mode = params.get("mode") ?? "window";

  try {
    if (mode === "day" || mode === "hour") {
      const dateKey = params.get("date") ?? "";
      const startParam = params.get("start");
      const endParam = params.get("end");

      if (!DATE_KEY_RE.test(dateKey) || !startParam || !endParam) {
        return NextResponse.json(
          { error: "day/hour mode requires date, start, and end" },
          { status: 400 },
        );
      }

      const start = parseDate(startParam);
      const end = parseDate(endParam);
      if (!start || !end) {
        return NextResponse.json({ error: "Invalid start or end time" }, { status: 400 });
      }

      if (mode === "day") {
        const data = await fetchHeartRateDayChartCached({ dateKey, start, end });
        return NextResponse.json(data);
      }

      const hourParam = params.get("hour");
      const hour = hourParam !== null ? parseInt(hourParam, 10) : NaN;
      if (Number.isNaN(hour) || hour < 0 || hour > 23) {
        return NextResponse.json({ error: "Invalid hour (0–23)" }, { status: 400 });
      }

      const dayStartParam = params.get("dayStart");
      const dayEndParam = params.get("dayEnd");
      if (!dayStartParam || !dayEndParam) {
        return NextResponse.json(
          { error: "hour mode requires dayStart and dayEnd" },
          { status: 400 },
        );
      }
      const dayStart = parseDate(dayStartParam);
      const dayEnd = parseDate(dayEndParam);
      if (!dayStart || !dayEnd) {
        return NextResponse.json({ error: "Invalid dayStart or dayEnd" }, { status: 400 });
      }

      const data = await fetchHeartRateHourChartCached({
        dateKey,
        hour,
        start,
        end,
        dayStart,
        dayEnd,
      });
      return NextResponse.json(data);
    }

    const hoursParam = parseInt(params.get("hours") ?? "2", 10);
    const hours = (HEART_RATE_WINDOW_OPTIONS as readonly number[]).includes(
      hoursParam,
    )
      ? hoursParam
      : 2;

    let end: Date | undefined;
    const endParam = params.get("end");
    if (endParam) {
      const parsed = parseDate(endParam);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid end time" }, { status: 400 });
      }
      end = parsed;
    }

    const data = await fetchHeartRateWindowChartCached({ windowHours: hours, end });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
