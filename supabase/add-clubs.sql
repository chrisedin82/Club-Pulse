create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clubs enable row level security;
create policy "Managers can read clubs" on public.clubs for select to authenticated using (exists (select 1 from public.manager_access where user_id=auth.uid()));
create policy "Managers can add clubs" on public.clubs for insert to authenticated with check (exists (select 1 from public.manager_access where user_id=auth.uid()));
create policy "Managers can edit clubs" on public.clubs for update to authenticated using (exists (select 1 from public.manager_access where user_id=auth.uid())) with check (exists (select 1 from public.manager_access where user_id=auth.uid()));

insert into public.clubs (name) values ('Main Club') on conflict (name) do nothing;

alter table public.club_figures add column if not exists club_id uuid references public.clubs(id);
alter table public.pnl_period_values add column if not exists club_id uuid references public.clubs(id);
alter table public.pnl_period_targets add column if not exists club_id uuid references public.clubs(id);
alter table public.pnl_full_year_budgets add column if not exists club_id uuid references public.clubs(id);

update public.club_figures set club_id=(select id from public.clubs where name='Main Club') where club_id is null;
update public.pnl_period_values set club_id=(select id from public.clubs where name='Main Club') where club_id is null;
update public.pnl_period_targets set club_id=(select id from public.clubs where name='Main Club') where club_id is null;
update public.pnl_full_year_budgets set club_id=(select id from public.clubs where name='Main Club') where club_id is null;

alter table public.club_figures alter column club_id set not null;
alter table public.pnl_period_values alter column club_id set not null;
alter table public.pnl_period_targets alter column club_id set not null;
alter table public.pnl_full_year_budgets alter column club_id set not null;

alter table public.club_figures drop constraint if exists club_figures_entry_date_area_key;
alter table public.club_figures add constraint club_figures_club_date_area_key unique (club_id,entry_date,area);
alter table public.pnl_period_values drop constraint if exists pnl_period_values_metric_id_period_key;
alter table public.pnl_period_values add constraint pnl_period_values_club_metric_period_key unique (club_id,metric_id,period);
alter table public.pnl_period_targets drop constraint if exists pnl_period_targets_metric_id_period_key;
alter table public.pnl_period_targets add constraint pnl_period_targets_club_metric_period_key unique (club_id,metric_id,period);
alter table public.pnl_full_year_budgets drop constraint if exists pnl_full_year_budgets_pkey;
alter table public.pnl_full_year_budgets add primary key (club_id,metric_id,financial_year);
