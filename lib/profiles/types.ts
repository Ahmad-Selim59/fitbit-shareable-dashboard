import type { DashboardCapabilities } from "@/lib/watch-config";
import type { WatchType } from "@/lib/watch-config";

export type ProfileVisibility = "public" | "hidden";

export type ProfileRow = {
  id: string;
  slug: string;
  display_name: string;
  visibility: ProfileVisibility;
  google_refresh_token_enc: string;
  google_access_token_enc: string | null;
  token_expires_at: string | null;
  health_user_id: string | null;
  scope: string | null;
  watch_type: WatchType;
  capabilities: DashboardCapabilities | null;
  capabilities_probed_at: string | null;
  viewer_password_hash: string | null;
  admin_password_hash: string;
  created_at: string;
  updated_at: string;
};

export type ProfilePublic = {
  slug: string;
  displayName: string;
  visibility: ProfileVisibility;
  hasViewerPassword: boolean;
  watchType: WatchType;
  createdAt: string;
};

export type PendingJoin = {
  slug: string;
  displayName: string;
  visibility: ProfileVisibility;
  watchType: WatchType;
  viewerPasswordHash: string | null;
  adminPasswordHash: string;
};
