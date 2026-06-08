import { decryptSecret, encryptSecret } from "@/lib/crypto/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DashboardCapabilities } from "@/lib/watch-config";
import type { WatchType } from "@/lib/watch-config";
import type {
  PendingJoin,
  ProfilePublic,
  ProfileRow,
  ProfileVisibility,
} from "./types";

export type GoogleHealthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  healthUserId?: string;
};

function toPublic(row: ProfileRow): ProfilePublic {
  return {
    slug: row.slug,
    displayName: row.display_name,
    visibility: row.visibility,
    hasViewerPassword: Boolean(row.viewer_password_hash),
    watchType: row.watch_type,
    createdAt: row.created_at,
  };
}

export async function getProfileBySlug(
  slug: string,
): Promise<ProfileRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ProfileRow | null;
}

export async function slugExists(slug: string): Promise<boolean> {
  const profile = await getProfileBySlug(slug);
  return profile !== null;
}

export async function listPublicProfiles(): Promise<ProfilePublic[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProfileRow[]).map(toPublic);
}

export async function listAllProfiles(): Promise<ProfilePublic[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProfileRow[]).map(toPublic);
}

export async function createProfileFromJoin(
  join: PendingJoin,
  tokens: GoogleHealthTokens,
): Promise<ProfileRow> {
  const supabase = getSupabaseAdmin();
  const row = {
    slug: join.slug,
    display_name: join.displayName,
    visibility: join.visibility,
    google_refresh_token_enc: encryptSecret(tokens.refreshToken),
    google_access_token_enc: encryptSecret(tokens.accessToken),
    token_expires_at: new Date(tokens.expiresAt).toISOString(),
    health_user_id: tokens.healthUserId ?? null,
    scope: tokens.scope,
    watch_type: join.watchType,
    viewer_password_hash: join.viewerPasswordHash,
    admin_password_hash: join.adminPasswordHash,
  };
  const { data, error } = await supabase
    .from("profiles")
    .insert(row)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ProfileRow;
}

export async function getTokensForProfile(
  profile: ProfileRow,
): Promise<GoogleHealthTokens | null> {
  try {
    return {
      accessToken: profile.google_access_token_enc
        ? decryptSecret(profile.google_access_token_enc)
        : "",
      refreshToken: decryptSecret(profile.google_refresh_token_enc),
      expiresAt: profile.token_expires_at
        ? new Date(profile.token_expires_at).getTime()
        : 0,
      scope: profile.scope ?? "",
      healthUserId: profile.health_user_id ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function saveTokensForProfile(
  slug: string,
  tokens: GoogleHealthTokens,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({
      google_refresh_token_enc: encryptSecret(tokens.refreshToken),
      google_access_token_enc: encryptSecret(tokens.accessToken),
      token_expires_at: new Date(tokens.expiresAt).toISOString(),
      health_user_id: tokens.healthUserId ?? null,
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function updateProfileCapabilities(
  slug: string,
  capabilities: DashboardCapabilities,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({
      capabilities,
      capabilities_probed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function updateProfileWatchType(
  slug: string,
  watchType: WatchType,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ watch_type: watchType, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function updateProfilePasswords(
  slug: string,
  updates: {
    adminPasswordHash?: string;
    viewerPasswordHash?: string | null;
  },
): Promise<void> {
  const row: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.adminPasswordHash !== undefined) {
    row.admin_password_hash = updates.adminPasswordHash;
  }
  if (updates.viewerPasswordHash !== undefined) {
    row.viewer_password_hash = updates.viewerPasswordHash;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("profiles").update(row).eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function deleteProfile(slug: string): Promise<ProfileRow | null> {
  const profile = await getProfileBySlug(slug);
  if (!profile) return null;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("profiles").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
  return profile;
}

export function profileRequiresViewerPassword(profile: ProfileRow): boolean {
  return Boolean(profile.viewer_password_hash);
}

export async function verifyViewerPassword(
  profile: ProfileRow,
  password: string,
): Promise<boolean> {
  if (!profile.viewer_password_hash) return true;
  const { verifyPassword } = await import("@/lib/crypto/passwords");
  return verifyPassword(password, profile.viewer_password_hash);
}

export async function verifyAdminPassword(
  profile: ProfileRow,
  password: string,
): Promise<boolean> {
  const { verifyPassword } = await import("@/lib/crypto/passwords");
  return verifyPassword(password, profile.admin_password_hash);
}

export function getProfileCapabilities(
  profile: ProfileRow,
): DashboardCapabilities | null {
  return profile.capabilities;
}

export function getProfileWatchType(profile: ProfileRow): WatchType {
  return profile.watch_type;
}
