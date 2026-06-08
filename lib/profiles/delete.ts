import { disconnectProfile } from "@/lib/google-health/client";
import { deleteProfile } from "./store";

export async function deleteProfileAndRevoke(slug: string): Promise<boolean> {
  await disconnectProfile(slug);
  const removed = await deleteProfile(slug);
  return removed !== null;
}
