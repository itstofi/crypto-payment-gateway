-- Production-only schema. DEMO_MODE does not use Supabase.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12, 2) not null,
  currency text not null default 'USDT',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  payment_provider text not null default 'binance_pay',
  transaction_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CREATE TABLE IF NOT EXISTS does not retrofit constraints onto an existing
-- deployment, so add and validate each production boundary idempotently.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'payments_amount_boundary_check'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_amount_boundary_check
      check (amount >= 0.01 and amount <= 100000 and amount = round(amount, 2))
      not valid;
  end if;
end
$$;
alter table public.payments validate constraint payments_amount_boundary_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'payments_currency_boundary_check'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_currency_boundary_check
      check (currency = 'USDT')
      not valid;
  end if;
end
$$;
alter table public.payments validate constraint payments_currency_boundary_check;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.update_updated_at();

alter table public.payments enable row level security;
alter table public.payments force row level security;

-- Remove the insecure policy shipped by the original demo. The app accesses this
-- table only through its server-side service-role client, which bypasses RLS.
drop policy if exists "allow all for demo" on public.payments;
revoke all on table public.payments from anon, authenticated;

-- Intentionally create no anon/authenticated policies. If you later add direct
-- browser access, create narrowly scoped policies for that specific use case.
