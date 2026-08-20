alter table public.clubs
add column if not exists location text not null default '';
