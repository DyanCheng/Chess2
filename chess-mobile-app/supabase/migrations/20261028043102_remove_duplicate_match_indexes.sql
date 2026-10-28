-- The original schema already supplies equivalent indexes. Keep its canonical
-- names to avoid duplicate maintenance overhead.
drop index if exists public.match_players_match_color_key;
drop index if exists public.match_moves_match_number_key;
drop index if exists public.match_players_user_id_idx;
