-- Run this in the Supabase SQL editor to set up the payments table

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12, 2) not null,
  currency text not null default 'USDT',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  payment_provider text not null default 'binance_pay',
  transaction_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at in sync automatically
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger payments_updated_at
  before update on payments
  for each row execute function update_updated_at();

-- Public read/write for demo purposes (tighten with RLS for production)
alter table payments enable row level security;

create policy "allow all for demo" on payments
  for all using (true) with check (true);
