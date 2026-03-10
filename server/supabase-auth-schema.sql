-- Users table for JWT auth (username + password hash)
-- Note: if you use Supabase, ensure RLS/policies allow server-side anon key access
-- or use service role key for production.

create table if not exists public.users (
  id uuid primary key,
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_username_idx on public.users (username);

