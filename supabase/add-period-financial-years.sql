begin;

alter table public.pnl_period_values
  add column if not exists financial_year integer;
alter table public.pnl_period_targets
  add column if not exists financial_year integer;

-- All period data entered before year selection was introduced belongs to FY2026.
update public.pnl_period_values set financial_year = 2026 where financial_year is null;
update public.pnl_period_targets set financial_year = 2026 where financial_year is null;

alter table public.pnl_period_values
  alter column financial_year set default 2026,
  alter column financial_year set not null;
alter table public.pnl_period_targets
  alter column financial_year set default 2026,
  alter column financial_year set not null;

alter table public.pnl_period_values
  drop constraint if exists pnl_period_values_club_metric_period_key;
alter table public.pnl_period_values
  drop constraint if exists pnl_period_values_club_metric_period_year_key;
alter table public.pnl_period_values
  add constraint pnl_period_values_club_metric_period_year_key
  unique (club_id, metric_id, period, financial_year);

alter table public.pnl_period_targets
  drop constraint if exists pnl_period_targets_club_metric_period_key;
alter table public.pnl_period_targets
  drop constraint if exists pnl_period_targets_club_metric_period_year_key;
alter table public.pnl_period_targets
  add constraint pnl_period_targets_club_metric_period_year_key
  unique (club_id, metric_id, period, financial_year);

commit;
