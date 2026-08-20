alter table public.pnl_full_year_budgets
add column if not exists financial_year integer;

update public.pnl_full_year_budgets
set financial_year = extract(year from current_date)::integer
where financial_year is null;

alter table public.pnl_full_year_budgets
alter column financial_year set not null;

alter table public.pnl_full_year_budgets
drop constraint if exists pnl_full_year_budgets_pkey;

alter table public.pnl_full_year_budgets
add primary key (metric_id, financial_year);
