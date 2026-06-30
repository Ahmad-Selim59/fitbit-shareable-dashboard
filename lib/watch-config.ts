export type WatchType = "fitbit" | "samsung";

export type DashboardCapabilities = {
  restingHeartRate: boolean;
  liveHeartRate: boolean;
  steps: boolean;
  sleep: boolean;
  spo2: boolean;
  deviceBattery: boolean;
};

export type EffectiveCapabilities = DashboardCapabilities;

const WATCH_TYPES: WatchType[] = ["fitbit", "samsung"];

export function parseWatchType(value: string | undefined | null): WatchType {
  if (value && WATCH_TYPES.includes(value as WatchType)) {
    return value as WatchType;
  }
  return "fitbit";
}

export function defaultCapabilitiesForWatch(
  watchType: WatchType,
): DashboardCapabilities {
  return {
    restingHeartRate: true,
    liveHeartRate: true,
    steps: true,
    sleep: true,
    spo2: true,
    deviceBattery: watchType === "fitbit",
  };
}

export function resolveEffectiveCapabilities(options: {
  watchType: WatchType;
  probed: DashboardCapabilities | null;
}): EffectiveCapabilities {
  const { watchType, probed } = options;
  if (!probed) return defaultCapabilitiesForWatch(watchType);

  if (watchType === "samsung") {
    return {
      // Samsung does not share daily resting HR via Google Health cloud.
      restingHeartRate: false,
      liveHeartRate: true,
      steps: probed.steps,
      sleep: true,
      spo2: true,
      deviceBattery: false,
    };
  }

  return { ...probed };
}

export function watchTypeLabel(watchType: WatchType): string {
  return watchType === "samsung"
    ? "Samsung (Google Health)"
    : "Fitbit / Pixel (Google Health)";
}

export function syncAppHint(watchType: WatchType): string {
  return watchType === "samsung"
    ? "Open Samsung Health or Google Health to sync your watch"
    : "Open the Google Health app to sync your watch";
}

export function deviceCardLabel(watchType: WatchType): string {
  return watchType === "samsung" ? "Watch" : "Fitbit watch";
}

export const CAPABILITY_LABELS: Record<keyof DashboardCapabilities, string> = {
  restingHeartRate: "Daily resting heart rate",
  liveHeartRate: "Live heart rate",
  steps: "Steps",
  sleep: "Sleep",
  spo2: "SpO₂",
  deviceBattery: "Watch battery",
};
