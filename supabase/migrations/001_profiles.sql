create table profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  visibility text not null check (visibility in ('public', 'hidden')),
  google_refresh_token_enc text not null,
  google_access_token_enc text,
  token_expires_at timestamptz,
  health_user_id text,
  scope text,
  watch_type text not null default 'fitbit',
  capabilities jsonb,
  capabilities_probed_at timestamptz,
  viewer_password_hash text,
  admin_password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_visibility_idx on profiles (visibility);

alter table profiles enable row level security;
