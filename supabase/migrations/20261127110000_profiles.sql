-- Profil de chaque compte : prénom, nom, téléphone.
-- À appliquer dans Supabase > SQL Editor (ou `supabase db push` une fois le projet lié).
--
-- Règles :
--   Chacun crée et modifie uniquement son propre profil (user_id = auth.uid()).
--   Les membres d'un même studio voient le profil des autres (nom affiché dans l'équipe).
--   Pas de suppression depuis l'appli : le profil part avec le compte (on delete cascade).

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text check (last_name is null or char_length(last_name) between 1 and 80),
  phone text check (phone is null or phone ~ '^\+?[0-9 .()-]{6,20}$'),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Vrai si l'utilisateur connecté partage au moins un studio avec p_user.
create or replace function public.inky_shares_studio_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.studio_members me
    join public.studio_members other on other.studio_id = me.studio_id
    where me.user_id = auth.uid() and other.user_id = p_user
  );
$$;

revoke all on function public.inky_shares_studio_with(uuid) from public, anon;
grant execute on function public.inky_shares_studio_with(uuid) to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.inky_shares_studio_with(user_id));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.profiles to authenticated;
revoke all on public.profiles from anon;
