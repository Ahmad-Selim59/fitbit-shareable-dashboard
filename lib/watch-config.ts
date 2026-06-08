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

export function getEnvWatchType(): WatchType | undefined {
  const raw = process.env.WATCH_TYPE?.trim().toLowerCase();
  if (!raw) return undefined;
  return parseWatchType(raw);
}

export function getEnvFeatureOverrides(): Partial<DashboardCapabilities> {
  const overrides: Partial<DashboardCapabilities> = {};
  const battery = process.env.FEATURES_DEVICE_BATTERY?.trim().toLowerCase();
  if (battery === "false" || battery === "0") {
    overrides.deviceBattery = false;
  }
  return overrides;
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
  envOverrides?: Partial<DashboardCapabilities>;
}): EffectiveCapabilities {
  const { watchType, probed, envOverrides = getEnvFeatureOverrides() } =
    options;
  const base = probed ?? defaultCapabilitiesForWatch(watchType);

  return {
    restingHeartRate: base.restingHeartRate,
    liveHeartRate: base.liveHeartRate,
    steps: base.steps,
    sleep: base.sleep,
    spo2: base.spo2,
    deviceBattery:
      envOverrides.deviceBattery !== false && base.deviceBattery,
  };
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
