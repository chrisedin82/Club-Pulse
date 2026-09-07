create table if not exists public.pnl_full_year_budgets (
  metric_id uuid references public.pnl_metrics(id) on delete cascade,
  financial_year integer not null,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (metric_id, financial_year)
);

alter table public.pnl_full_year_budgets enable row level security;

create policy "Approved managers can read full year budgets"
on public.pnl_full_year_budgets for select to authenticated
using (exists (select 1 from public.manager_access where user_id = auth.uid()));

create policy "Approved managers can add full year budgets"
on public.pnl_full_year_budgets for insert to authenticated
with check (exists (select 1 from public.manager_access where user_id = auth.uid()));

create policy "Approved managers can update full year budgets"
on public.pnl_full_year_budgets for update to authenticated
using (exists (select 1 from public.manager_access where user_id = auth.uid()))
with check (exists (select 1 from public.manager_access where user_id = auth.uid()));
