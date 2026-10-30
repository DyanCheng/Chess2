alter table public.wallets
  add column if not exists gems bigint not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'wallets_gems_check'
      and conrelid = 'public.wallets'::regclass
  ) then
    alter table public.wallets
      add constraint wallets_gems_check check (gems >= 0);
  end if;
end;
$$;
