-- Additive shop transaction support for the existing S.A.N.D schema.
-- Existing tables are reused; this migration does not remove or rewrite
-- existing purchase records.

alter table public.shop_items
  add column if not exists description text,
  add column if not exists reward_currency bigint not null default 0,
  add column if not exists reward_gems bigint not null default 0,
  add column if not exists is_repeatable boolean not null default false;

insert into public.shop_items (
  id, name, description, item_type, reference_id, price, currency_type,
  stock, is_active, reward_currency, reward_gems
)
select seed.id, seed.name, seed.description,
       'SKIN'::public.shop_item_enum, null, seed.price,
       seed.currency_type::public.currency_type_enum,
       -1, true, 0, 0
from (values
  ('11000000-0000-4000-8000-000000000001'::uuid, 'Bộ Hoàng Gia', 'Quân cờ phong cách hoàng gia sang trọng', 500::bigint, 'GEM'),
  ('11000000-0000-4000-8000-000000000002'::uuid, 'Neon Cyber', 'Quân cờ phong cách cyberpunk neon', 300::bigint, 'GEM'),
  ('11000000-0000-4000-8000-000000000003'::uuid, 'Gỗ Cổ Điển', 'Quân cờ gỗ phong cách truyền thống', 1000::bigint, 'GOLD'),
  ('11000000-0000-4000-8000-000000000004'::uuid, 'Pha Lê Kỳ Diệu', 'Quân cờ pha lê phát sáng huyền ảo', 400::bigint, 'GEM')
) as seed(id, name, description, price, currency_type)
where not exists (
  select 1
  from public.shop_items existing
  where existing.name = seed.name
    and existing.item_type::text = 'SKIN'
);

insert into public.function_cards (
  id, name, description, effect_type, effect_value, price, is_active
)
select seed.id, seed.name, seed.description,
       seed.effect_type::public.card_effect_enum, seed.effect_value, seed.price, true
from (values
  ('22000000-0000-4000-8000-000000000001'::uuid, 'Khiên Thần', 'Tạo khiên bảo vệ hấp thụ 8 điểm sát thương trong 3 lượt', 'SHIELD', 8, 150),
  ('22000000-0000-4000-8000-000000000002'::uuid, 'Hồi Sinh Mệnh', 'Hồi phục 10 điểm sinh mệnh', 'HEAL', 10, 100),
  ('22000000-0000-4000-8000-000000000003'::uuid, 'Song Sát', 'Nhân đôi sát thương gây ra trong 2 lượt tiếp theo', 'DOUBLE_DAMAGE', 2, 80),
  ('22000000-0000-4000-8000-000000000004'::uuid, 'Băng Phong', 'Đóng băng 1 quân cờ đối thủ trong 2 lượt', 'FREEZE_PIECE', 2, 200)
) as seed(id, name, description, effect_type, effect_value, price)
where not exists (
  select 1
  from public.function_cards existing
  where existing.name = seed.name
    and existing.effect_type::text = seed.effect_type
)
on conflict (id) do nothing;

insert into public.shop_items (
  id, name, description, item_type, reference_id, price, currency_type,
  stock, is_active, reward_currency, reward_gems
)
select seed.id, seed.name, seed.description,
       'CARD'::public.shop_item_enum, card.id, seed.price,
       seed.currency_type::public.currency_type_enum,
       -1, true, 0, 0
from (values
  ('33000000-0000-4000-8000-000000000001'::uuid, 'Thẻ Khiên Thần', 'Tạo khiên bảo vệ hấp thụ 8 điểm sát thương trong 3 lượt', 'Khiên Thần', 'SHIELD', 150::bigint, 'GOLD'),
  ('33000000-0000-4000-8000-000000000002'::uuid, 'Thẻ Hồi Sinh Mệnh', 'Hồi phục 10 điểm sinh mệnh', 'Hồi Sinh Mệnh', 'HEAL', 100::bigint, 'GOLD'),
  ('33000000-0000-4000-8000-000000000003'::uuid, 'Thẻ Song Sát', 'Nhân đôi sát thương gây ra trong 2 lượt tiếp theo', 'Song Sát', 'DOUBLE_DAMAGE', 80::bigint, 'GEM'),
  ('33000000-0000-4000-8000-000000000004'::uuid, 'Thẻ Băng Phong', 'Đóng băng 1 quân cờ đối thủ trong 2 lượt', 'Băng Phong', 'FREEZE_PIECE', 200::bigint, 'GOLD')
) as seed(id, name, description, card_name, effect_type, price, currency_type)
join public.function_cards card
  on card.name = seed.card_name
  and card.effect_type::text = seed.effect_type
where not exists (
  select 1
  from public.shop_items existing
  where existing.name = seed.name
    and existing.item_type::text = 'CARD'
)
on conflict (id) do nothing;

update public.shop_items
set is_repeatable = true
where item_type::text in ('CARD', 'CURRENCY_PACK')
  and is_repeatable = false;

alter table public.purchases
  add column if not exists idempotency_key text,
  add column if not exists currency_type text;

update public.purchases p
set currency_type = s.currency_type::text
from public.shop_items s
where s.id = p.shop_item_id
  and p.currency_type is null;

do $$
begin
  if exists (
    select 1 from public.purchases where currency_type is null
  ) then
    raise exception 'Cannot backfill purchases.currency_type from shop_items';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'shop_items_reward_currency_nonnegative'
      and conrelid = 'public.shop_items'::regclass
  ) then
    alter table public.shop_items
      add constraint shop_items_reward_currency_nonnegative
      check (reward_currency >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'shop_items_reward_gems_nonnegative'
      and conrelid = 'public.shop_items'::regclass
  ) then
    alter table public.shop_items
      add constraint shop_items_reward_gems_nonnegative
      check (reward_gems >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'purchases_currency_type_check'
      and conrelid = 'public.purchases'::regclass
  ) then
    alter table public.purchases
      add constraint purchases_currency_type_check
      check (currency_type in ('GOLD', 'GEM'));
  end if;
end;
$$;

alter table public.purchases
  alter column currency_type set not null;

create unique index if not exists purchases_user_id_idempotency_key_key
  on public.purchases (user_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.purchase_shop_item(
  p_user_id uuid,
  p_item_id uuid,
  p_quantity integer,
  p_idempotency_key text
)
returns table (
  purchase_id uuid,
  item_id uuid,
  item_name text,
  item_type text,
  reference_id uuid,
  quantity integer,
  total_price bigint,
  currency_type text,
  replayed boolean,
  wallet_currency bigint,
  wallet_gems bigint,
  owned_quantity bigint,
  card_quantity bigint,
  reward_currency bigint,
  reward_gems bigint,
  card_name text,
  card_description text,
  card_effect_type text,
  card_effect_value integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wallet public.wallets%rowtype;
  v_item public.shop_items%rowtype;
  v_existing public.purchases%rowtype;
  v_card public.function_cards%rowtype;
  v_purchase_id uuid;
  v_total_price bigint;
  v_owned_quantity bigint := 0;
  v_card_quantity bigint := 0;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception using errcode = '22023', message = 'INVALID_QUANTITY';
  end if;
  if p_idempotency_key is null
     or length(p_idempotency_key) < 8
     or length(p_idempotency_key) > 128
     or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$' then
    raise exception using errcode = '22023', message = 'INVALID_IDEMPOTENCY_KEY';
  end if;

  select w.* into v_wallet
  from public.wallets w
  where w.user_id = p_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'WALLET_NOT_FOUND';
  end if;

  select p.* into v_existing
  from public.purchases p
  where p.user_id = p_user_id
    and p.idempotency_key = p_idempotency_key;

  if found then
    if v_existing.shop_item_id <> p_item_id
       or v_existing.quantity <> p_quantity then
      raise exception using errcode = '22023', message = 'IDEMPOTENCY_KEY_REUSED';
    end if;

    select s.* into v_item
    from public.shop_items s
    where s.id = v_existing.shop_item_id;
    if not found then
      raise exception using errcode = 'P0001', message = 'ITEM_NOT_FOUND';
    end if;

    if v_item.item_type::text = 'CARD' and v_item.reference_id is not null then
      select c.* into v_card
      from public.function_cards c
      where c.id = v_item.reference_id;
      select coalesce(sum(uc.quantity), 0)::bigint into v_card_quantity
      from public.user_cards uc
      where uc.user_id = p_user_id
        and uc.card_id = v_item.reference_id;
      v_owned_quantity := v_card_quantity;
    elsif v_item.item_type::text = 'SKIN' then
      select coalesce(sum(p.quantity), 0)::bigint into v_owned_quantity
      from public.purchases p
      where p.user_id = p_user_id
        and p.shop_item_id = v_item.id;
    end if;

    return query select
      v_existing.id, v_item.id, v_item.name::text, v_item.item_type::text,
      v_item.reference_id, v_existing.quantity, v_existing.total_price,
      v_existing.currency_type, true, v_wallet.currency, v_wallet.gems,
      v_owned_quantity, v_card_quantity, v_item.reward_currency, v_item.reward_gems,
      v_card.name::text, v_card.description, v_card.effect_type::text, v_card.effect_value;
    return;
  end if;

  select s.* into v_item
  from public.shop_items s
  where s.id = p_item_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'ITEM_NOT_FOUND';
  end if;
  if not v_item.is_active then
    raise exception using errcode = 'P0001', message = 'ITEM_INACTIVE';
  end if;
  if v_item.price < 0 then
    raise exception using errcode = 'P0001', message = 'INVALID_ITEM_PRICE';
  end if;
  if v_item.stock is not null and v_item.stock >= 0
     and v_item.stock < p_quantity then
    raise exception using errcode = 'P0001', message = 'OUT_OF_STOCK';
  end if;

  if not v_item.is_repeatable and exists (
    select 1 from public.purchases p
    where p.user_id = p_user_id
      and p.shop_item_id = p_item_id
  ) then
    raise exception using errcode = 'P0001', message = 'ALREADY_OWNED';
  end if;

  if v_item.item_type::text = 'CARD' then
    if v_item.reference_id is null then
      raise exception using errcode = 'P0001', message = 'INVALID_CARD_REFERENCE';
    end if;
    select c.* into v_card
    from public.function_cards c
    where c.id = v_item.reference_id;
    if not found then
      raise exception using errcode = 'P0001', message = 'INVALID_CARD_REFERENCE';
    end if;
  elsif v_item.item_type::text = 'CURRENCY_PACK'
    and v_item.reward_currency = 0 and v_item.reward_gems = 0 then
    raise exception using errcode = 'P0001', message = 'INVALID_ITEM_REWARD';
  elsif v_item.item_type::text not in ('CARD', 'SKIN', 'CURRENCY_PACK') then
    raise exception using errcode = 'P0001', message = 'UNSUPPORTED_ITEM_TYPE';
  end if;

  v_total_price := v_item.price * p_quantity::bigint;
  if v_item.currency_type::text = 'GOLD' then
    if v_wallet.currency < v_total_price then
      raise exception using errcode = 'P0001', message = 'INSUFFICIENT_FUNDS';
    end if;
    update public.wallets
      set currency = currency - v_total_price + v_item.reward_currency,
          gems = gems + v_item.reward_gems,
          updated_at = now()
      where user_id = p_user_id
      returning * into v_wallet;
  elsif v_item.currency_type::text = 'GEM' then
    if v_wallet.gems < v_total_price then
      raise exception using errcode = 'P0001', message = 'INSUFFICIENT_FUNDS';
    end if;
    update public.wallets
      set gems = gems - v_total_price + v_item.reward_gems,
          currency = currency + v_item.reward_currency,
          updated_at = now()
      where user_id = p_user_id
      returning * into v_wallet;
  else
    raise exception using errcode = 'P0001', message = 'UNSUPPORTED_CURRENCY';
  end if;

  if v_item.stock is not null and v_item.stock >= 0 then
    update public.shop_items
      set stock = stock - p_quantity
      where id = p_item_id;
  end if;

  if v_item.item_type::text = 'CARD' then
    update public.user_cards
      set quantity = quantity + p_quantity,
          updated_at = now()
      where id = (
        select uc.id
        from public.user_cards uc
        where uc.user_id = p_user_id
          and uc.card_id = v_item.reference_id
        order by uc.id
        limit 1
      );
    if not found then
      insert into public.user_cards (user_id, card_id, quantity)
      values (p_user_id, v_item.reference_id, p_quantity);
    end if;
    select coalesce(sum(uc.quantity), 0)::bigint into v_card_quantity
    from public.user_cards uc
    where uc.user_id = p_user_id
      and uc.card_id = v_item.reference_id;
    v_owned_quantity := v_card_quantity;
  elsif v_item.item_type::text = 'SKIN' then
    v_owned_quantity := p_quantity;
  end if;

  insert into public.purchases (
    user_id, shop_item_id, quantity, total_price, currency_type, idempotency_key
  ) values (
    p_user_id, p_item_id, p_quantity, v_total_price,
    v_item.currency_type::text, p_idempotency_key
  ) returning id into v_purchase_id;

  if v_item.item_type::text = 'SKIN' then
    select coalesce(sum(p.quantity), 0)::bigint into v_owned_quantity
    from public.purchases p
    where p.user_id = p_user_id
      and p.shop_item_id = p_item_id;
  end if;

  return query select
    v_purchase_id, v_item.id, v_item.name::text, v_item.item_type::text,
    v_item.reference_id, p_quantity, v_total_price,
    v_item.currency_type::text, false, v_wallet.currency, v_wallet.gems,
    v_owned_quantity, v_card_quantity, v_item.reward_currency, v_item.reward_gems,
    v_card.name::text, v_card.description, v_card.effect_type::text, v_card.effect_value;
end;
$$;

revoke all on function public.purchase_shop_item(uuid, uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.purchase_shop_item(uuid, uuid, integer, text)
  to service_role;

-- Safe rollback: restore the previous application version and remove the RPC
-- only after that version is deployed. Keep the additive snapshot/idempotency
-- columns and index so existing purchases and retry keys are not discarded.
-- drop function public.purchase_shop_item(uuid, uuid, integer, text);
