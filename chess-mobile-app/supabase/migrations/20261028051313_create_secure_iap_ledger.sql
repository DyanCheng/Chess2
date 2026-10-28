-- Currency balances remain authoritative on the backend. The mobile client
-- can read its ledger, but cannot insert transactions or credit itself.
create table if not exists public.iap_transactions (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store text not null,
  transaction_id text not null,
  product_id text not null,
  environment text not null check (environment in ('SANDBOX', 'PRODUCTION')),
  gold_delta bigint not null default 0 check (gold_delta >= 0),
  gems_delta bigint not null default 0 check (gems_delta >= 0),
  purchased_at timestamptz not null,
  credited_at timestamptz not null default now(),
  constraint iap_transactions_positive_credit
    check (gold_delta > 0 or gems_delta > 0),
  constraint iap_transactions_store_transaction_key
    unique (store, transaction_id)
);

create index if not exists iap_transactions_user_id_idx
  on public.iap_transactions (user_id, credited_at desc);

alter table public.iap_transactions enable row level security;
revoke all on public.iap_transactions from anon, authenticated;
grant select on public.iap_transactions to authenticated;

drop policy if exists app_iap_transactions_select_self
  on public.iap_transactions;
create policy app_iap_transactions_select_self
  on public.iap_transactions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
