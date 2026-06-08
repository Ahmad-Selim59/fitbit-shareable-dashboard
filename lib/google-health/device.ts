import { healthFetch } from "./client";
import { CACHE_TTL, withCache } from "./cache";

type PairedDevice = {
  deviceType?: string;
  deviceVersion?: string;
  batteryLevel?: number;
  batteryStatus?: string;
  lastSyncTime?: string;
};

type ListPairedDevicesResponse = {
  pairedDevices?: PairedDevice[];
};

export type DeviceStatus = {
  deviceName: string;
  batteryLevel: number | null;
  batteryStatus: string | null;
  lastSyncTime: string | null;
};

function pickTracker(devices: PairedDevice[]): PairedDevice | null {
  return (
    devices.find((d) => d.deviceType === "TRACKER") ??
    devices.find((d) => d.deviceType !== "SCALE") ??
    devices[0] ??
    null
  );
}

export async function fetchDeviceStatus(): Promise<DeviceStatus | null> {
  try {
    const res = await healthFetch<ListPairedDevicesResponse>(
      "/v4/users/me/pairedDevices",
    );
    const device = pickTracker(res.pairedDevices ?? []);
    if (!device) return null;

    return {
      deviceName: device.deviceVersion ?? "Fitbit",
      batteryLevel:
        typeof device.batteryLevel === "number" ? device.batteryLevel : null,
      batteryStatus: device.batteryStatus ?? null,
      lastSyncTime: device.lastSyncTime ?? null,
    };
  } catch (err) {
    console.error("[google-health] pairedDevices:", err);
    return null;
  }
}

export function fetchDeviceStatusCached(): Promise<DeviceStatus | null> {
  return withCache("device-status", CACHE_TTL.deviceMs, fetchDeviceStatus);
}
