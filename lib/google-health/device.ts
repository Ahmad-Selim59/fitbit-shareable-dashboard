import { healthFetch } from "./client";
import { CACHE_TTL, withCache } from "./cache";

type PairedDevice = {
  deviceType?: string;
  device_type?: string;
  deviceVersion?: string;
  device_version?: string;
  batteryLevel?: number;
  battery_level?: number;
  batteryStatus?: string;
  battery_status?: string;
  lastSyncTime?: string;
  last_sync_time?: string;
};

type ListPairedDevicesResponse = {
  pairedDevices?: PairedDevice[];
  paired_devices?: PairedDevice[];
};

export type DeviceStatus = {
  deviceName: string;
  batteryLevel: number | null;
  batteryStatus: string | null;
  lastSyncTime: string | null;
};

export type DeviceFetchResult = {
  device: DeviceStatus | null;
  error?: string;
};

function normalizeDevice(raw: PairedDevice): DeviceStatus {
  const batteryLevel = raw.batteryLevel ?? raw.battery_level;
  return {
    deviceName: raw.deviceVersion ?? raw.device_version ?? "Watch",
    batteryLevel: typeof batteryLevel === "number" ? batteryLevel : null,
    batteryStatus: raw.batteryStatus ?? raw.battery_status ?? null,
    lastSyncTime: raw.lastSyncTime ?? raw.last_sync_time ?? null,
  };
}

function pickTracker(devices: PairedDevice[]): PairedDevice | null {
  const isTracker = (d: PairedDevice) =>
    (d.deviceType ?? d.device_type) === "TRACKER";
  const isScale = (d: PairedDevice) =>
    (d.deviceType ?? d.device_type) === "SCALE";

  return (
    devices.find(isTracker) ??
    devices.find((d) => !isScale(d)) ??
    devices[0] ??
    null
  );
}

export async function fetchDeviceStatus(): Promise<DeviceFetchResult> {
  try {
    const res = await healthFetch<ListPairedDevicesResponse>(
      "/v4/users/me/pairedDevices",
    );
    const devices = res.pairedDevices ?? res.paired_devices ?? [];
    const picked = pickTracker(devices);
    if (!picked) {
      return { device: null, error: "No paired tracker found" };
    }
    return { device: normalizeDevice(picked) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load device";
    console.error("[google-health] pairedDevices:", message);
    return { device: null, error: message };
  }
}

/** Cached 1h on success only — errors/empty are not cached (see cache.ts). */
export function fetchDeviceStatusCached(): Promise<DeviceFetchResult> {
  return withCache("device-status", CACHE_TTL.deviceMs, fetchDeviceStatus);
}
