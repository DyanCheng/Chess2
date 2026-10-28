-- Only the backend service role can call this idempotent credit operation.
-- Reward amounts are resolved by trusted backend code after RevenueCat verification.
create or replace function public.credit_iap_purchase(
  p_user_id uuid,
  p_store text,
  p_transaction_id text,
  p_product_id text,
  p_environment text,
  p_gold_delta bigint,
  p_gems_delta bigint,
  p_purchased_at timestamptz
)
returns table (credited boolean, currency bigint, gems bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
  existing_user_id uuid;
  existing_product_id text;
begin
  if p_gold_delta < 0 or p_gems_delta < 0
     or (p_gold_delta = 0 and p_gems_delta = 0) then
    raise exception 'Invalid IAP credit amounts';
  end if;
  if p_environment not in ('SANDBOX', 'PRODUCTION') then
    raise exception 'Invalid IAP environment';
  end if;

  insert into public.iap_transactions (
    user_id, store, transaction_id, product_id, environment,
    gold_delta, gems_delta, purchased_at
  ) values (
    p_user_id, p_store, p_transaction_id, p_product_id, p_environment,
    p_gold_delta, p_gems_delta, p_purchased_at
  ) on conflict (store, transaction_id) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    select t.user_id, t.product_id
      into existing_user_id, existing_product_id
      from public.iap_transactions t
      where t.store = p_store and t.transaction_id = p_transaction_id;
    if existing_user_id is distinct from p_user_id
       or existing_product_id is distinct from p_product_id then
      raise exception 'Store transaction identity mismatch';
    end if;
  else
    update public.wallets w
      set currency = w.currency + p_gold_delta,
          gems = w.gems + p_gems_delta,
          updated_at = now()
      where w.user_id = p_user_id;
    if not found then
      raise exception 'Wallet not found for user';
    end if;
  end if;

  return query
    select inserted_count = 1, w.currency, w.gems
    from public.wallets w
    where w.user_id = p_user_id;
end;
$$;

revoke execute on function public.credit_iap_purchase(
  uuid, text, text, text, text, bigint, bigint, timestamptz
) from public, anon, authenticated;
grant execute on function public.credit_iap_purchase(
  uuid, text, text, text, text, bigint, bigint, timestamptz
) to service_role;
