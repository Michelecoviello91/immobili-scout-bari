-- Eseguire nell'SQL Editor di Supabase
create table if not exists public.listings (
  id bigint generated always as identity primary key,
  url text not null unique,
  title text not null,
  snippet text not null default '',
  source text not null,
  price_eur integer,
  area_sqm integer,
  ground_floor boolean,
  multiple_windows boolean,
  status text not null default 'da_verificare',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  price_changed_at timestamptz
);
create index if not exists listings_first_seen_idx on public.listings(first_seen_at desc);
create table if not exists public.runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'started',
  found integer not null default 0,
  new_count integer not null default 0,
  changed_count integer not null default 0,
  error text
);
alter table public.listings enable row level security;
alter table public.runs enable row level security;
-- Non creare policy pubbliche: lettura/scrittura soltanto mediante service_role lato server.
