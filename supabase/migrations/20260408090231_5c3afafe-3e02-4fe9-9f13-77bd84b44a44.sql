
create table public.estimates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  saved_at timestamptz not null default now(),
  saved_by text,
  type text not null check (type in ('polymers', 'construction')),
  origin text,
  destination text,
  total_km numeric,
  total_weight_ton numeric,
  weight_ton numeric,
  total_meters numeric,
  largest_plate_label text,
  num_freights integer,
  cargo_lines jsonb,
  pombalense_total_cost numeric,
  pombalense_weight_cost numeric,
  pombalense_delivery_cost numeric,
  construction_pombalense_cost numeric,
  best_fleet_option text,
  best_fleet_cost numeric,
  fleet_6t_cost numeric,
  fleet_9t_cost numeric,
  fleet_15t_cost numeric,
  cheapest_option text,
  heavy_load_comparison jsonb,
  extra_rate_applied numeric
);

create table public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table public.price_table_overrides (
  key text primary key check (key in ('cf', 'cc')),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.estimates enable row level security;
alter table public.settings enable row level security;
alter table public.price_table_overrides enable row level security;

create policy "allow all" on public.estimates for all using (true) with check (true);
create policy "allow all" on public.settings for all using (true) with check (true);
create policy "allow all" on public.price_table_overrides for all using (true) with check (true);
