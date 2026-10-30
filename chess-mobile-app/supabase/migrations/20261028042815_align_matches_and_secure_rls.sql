-- Align the backend with the established PvP schema. The columns are nullable
-- so existing matches remain intact; new backend writes always populate them.
alter table public.matches add column if not exists fen text;
alter table public.matches add column if not exists white_time_ms bigint;
alter table public.matches add column if not exists black_time_ms bigint;
alter table public.matches add column if not exists end_reason text;

-- These are safe after the duplicate checks performed before this migration.
create unique index if not exists match_players_match_color_key
  on public.match_players (match_id, color);
create unique index if not exists match_moves_match_number_key
  on public.match_moves (match_id, move_number);

-- Index ownership and foreign-key columns used by RLS, history, joins, and
-- cascade paths. Existing leading-column indexes are deliberately not repeated.
create index if not exists match_players_user_id_idx on public.match_players (user_id);
create index if not exists match_moves_player_id_idx on public.match_moves (player_id);
create index if not exists matches_winner_id_idx on public.matches (winner_id);
create index if not exists matches_bot_level_id_idx on public.matches (bot_level_id);
create index if not exists hp_transactions_player_id_idx on public.hp_transactions (player_id);
create index if not exists hp_transactions_move_id_idx on public.hp_transactions (move_id);
create index if not exists card_usages_user_id_idx on public.card_usages (user_id);
create index if not exists card_usages_card_id_idx on public.card_usages (card_id);
create index if not exists card_usages_move_id_idx on public.card_usages (move_id);
create index if not exists purchases_shop_item_id_idx on public.purchases (shop_item_id);
create index if not exists user_cards_card_id_idx on public.user_cards (card_id);
create index if not exists user_roles_role_id_idx on public.user_roles (role_id);

-- This trigger uses metadata only for display values, never authorization.
-- It must be SECURITY DEFINER to create app-owned rows during Auth sign-up;
-- a locked search_path and revoked direct execution prevent RPC abuse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'user_' || substring(new.id::text, 1, 8)), 40),
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Người chơi ' || substring(new.id::text, 1, 4)), 80),
    new.raw_user_meta_data ->> 'avatar_url'
  ) on conflict (id) do nothing;

  insert into public.wallets (user_id, currency)
  values (new.id, 1000) on conflict (user_id) do nothing;
  insert into public.user_settings (user_id)
  values (new.id) on conflict (user_id) do nothing;
  insert into public.user_roles (user_id, role_id)
  values (new.id, 1) on conflict (user_id, role_id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Every table in the exposed public schema has RLS. The client can read only
-- its own game data; authoritative writes remain in the backend service role.
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_settings enable row level security;
alter table public.wallets enable row level security;
alter table public.rewards enable row level security;
alter table public.bot_levels enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_moves enable row level security;
alter table public.hp_transactions enable row level security;
alter table public.function_cards enable row level security;
alter table public.user_cards enable row level security;
alter table public.card_usages enable row level security;
alter table public.shop_items enable row level security;
alter table public.purchases enable row level security;
alter table public.login_logs enable row level security;
alter table public.security_logs enable row level security;

revoke all on public.profiles, public.roles, public.user_roles, public.user_settings,
  public.wallets, public.rewards, public.bot_levels, public.matches,
  public.match_players, public.match_moves, public.hp_transactions,
  public.function_cards, public.user_cards, public.card_usages, public.shop_items,
  public.purchases, public.login_logs, public.security_logs from anon, authenticated;

grant select on public.profiles, public.roles, public.user_roles, public.user_settings,
  public.wallets, public.rewards, public.bot_levels, public.matches,
  public.match_players, public.match_moves, public.hp_transactions,
  public.function_cards, public.user_cards, public.card_usages, public.shop_items,
  public.purchases, public.login_logs, public.security_logs to authenticated;
grant update (username, display_name, avatar_url, updated_at) on public.profiles to authenticated;
grant update (sound_enabled, music_enabled, notification_enabled, language, updated_at)
  on public.user_settings to authenticated;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists app_profiles_select_self on public.profiles;
drop policy if exists app_profiles_update_self on public.profiles;
create policy app_profiles_select_self on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy app_profiles_update_self on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists app_roles_select on public.roles;
create policy app_roles_select on public.roles for select to authenticated using (true);
drop policy if exists app_user_roles_select_self on public.user_roles;
create policy app_user_roles_select_self on public.user_roles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own settings" on public.user_settings;
drop policy if exists "Users can update own settings" on public.user_settings;
drop policy if exists app_user_settings_select_self on public.user_settings;
drop policy if exists app_user_settings_update_self on public.user_settings;
create policy app_user_settings_select_self on public.user_settings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy app_user_settings_update_self on public.user_settings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own wallet" on public.wallets;
drop policy if exists app_wallets_select_self on public.wallets;
create policy app_wallets_select_self on public.wallets for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists app_rewards_select_self on public.rewards;
create policy app_rewards_select_self on public.rewards for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists app_bot_levels_select on public.bot_levels;
create policy app_bot_levels_select on public.bot_levels for select to authenticated using (true);

drop policy if exists "Players can view own matches" on public.matches;
drop policy if exists app_matches_select_participant on public.matches;
create policy app_matches_select_participant on public.matches for select to authenticated
  using (exists (
    select 1 from public.match_players mp
    where mp.match_id = matches.id and mp.user_id = (select auth.uid())
  ));
drop policy if exists "Users can view own match participation" on public.match_players;
drop policy if exists app_match_players_select_self on public.match_players;
create policy app_match_players_select_self on public.match_players for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Players can view moves in own matches" on public.match_moves;
drop policy if exists app_match_moves_select_participant on public.match_moves;
create policy app_match_moves_select_participant on public.match_moves for select to authenticated
  using (exists (
    select 1 from public.match_players mp
    where mp.match_id = match_moves.match_id and mp.user_id = (select auth.uid())
  ));
drop policy if exists app_hp_transactions_select_participant on public.hp_transactions;
create policy app_hp_transactions_select_participant on public.hp_transactions for select to authenticated
  using (exists (
    select 1 from public.match_players mp
    where mp.match_id = hp_transactions.match_id and mp.user_id = (select auth.uid())
  ));

drop policy if exists app_function_cards_select on public.function_cards;
create policy app_function_cards_select on public.function_cards for select to authenticated
  using (is_active = true);
drop policy if exists app_shop_items_select on public.shop_items;
create policy app_shop_items_select on public.shop_items for select to authenticated
  using (is_active = true);
drop policy if exists app_user_cards_select_self on public.user_cards;
create policy app_user_cards_select_self on public.user_cards for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists app_card_usages_select_self on public.card_usages;
create policy app_card_usages_select_self on public.card_usages for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists app_purchases_select_self on public.purchases;
create policy app_purchases_select_self on public.purchases for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists app_login_logs_select_self on public.login_logs;
create policy app_login_logs_select_self on public.login_logs for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists app_security_logs_select_self on public.security_logs;
create policy app_security_logs_select_self on public.security_logs for select to authenticated
  using ((select auth.uid()) = user_id);
