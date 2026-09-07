insert into public.pnl_metrics (name, display_order, created_by)
select
  'Repairs',
  coalesce((select max(display_order) from public.pnl_metrics), 0) + 10,
  (select created_by from public.pnl_metrics where created_by is not null limit 1)
where not exists (
  select 1 from public.pnl_metrics where lower(name) = 'repairs'
);
