-- Run this in Supabase SQL editor to create the files table
create table if not exists files (
  id text primary key,
  name text not null,
  type text not null check (type in ('file', 'folder')),
  parent_id text references files(id) on delete cascade,
  content text,
  ext text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists files_parent_id on files(parent_id);
