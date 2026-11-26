-- Équipe du studio : liste des membres, ajout, changement de rôle, retrait.
-- À appliquer dans Supabase > SQL Editor (ou `supabase db push` une fois le projet lié).
--
-- studio_members reste en lecture seule pour `authenticated` : toute écriture passe par
-- les fonctions ci-dessous (security definer), qui revérifient le rôle de l'appelant.
-- Règles :
--   owner : peut tout faire, y compris nommer un autre owner.
--   admin : peut ajouter / modifier / retirer artist, assistant et admin ; ne peut ni
--           nommer un owner, ni modifier ou retirer un owner.
--   artist, assistant : lecture de la liste seulement.
--   Un studio garde toujours au moins un owner.
-- Chaque modification est tracée dans audit_events.

-- Rôle de l'utilisateur connecté dans le studio (null s'il n'en est pas membre).
create or replace function public.inky_my_studio_role(p_studio uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role::text from public.studio_members m
  where m.studio_id = p_studio and m.user_id = auth.uid();
$$;

-- Liste de l'équipe, visible par tous les membres du studio.
-- pending = le compte n'a encore jamais ouvert de session (invitation pas encore acceptée).
create or replace function public.inky_studio_team(p_studio uuid)
returns table (user_id uuid, role text, email text, joined_at timestamptz, pending boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, m.role::text, u.email::text, m.created_at, u.last_sign_in_at is null
  from public.studio_members m
  join auth.users u on u.id = m.user_id
  where m.studio_id = p_studio
    and exists (
      select 1 from public.studio_members me
      where me.studio_id = p_studio and me.user_id = auth.uid()
    )
  order by m.created_at, u.email;
$$;

-- Ajoute un compte existant (retrouvé par e-mail) au studio.
-- Renvoie : 'added', 'already_member', 'not_found' (aucun compte : le serveur envoie
-- alors une invitation puis rappelle cette fonction), 'forbidden', 'invalid_role'.
create or replace function public.inky_add_studio_member(p_studio uuid, p_email text, p_role text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_me text := public.inky_my_studio_role(p_studio);
  v_user uuid;
begin
  if p_role is null or p_role not in ('owner', 'admin', 'artist', 'assistant') then
    return 'invalid_role';
  end if;
  if v_me is null or v_me not in ('owner', 'admin') then
    return 'forbidden';
  end if;
  if p_role = 'owner' and v_me <> 'owner' then
    return 'forbidden';
  end if;

  select u.id into v_user from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;
  if v_user is null then
    return 'not_found';
  end if;

  if exists (
    select 1 from public.studio_members m where m.studio_id = p_studio and m.user_id = v_user
  ) then
    return 'already_member';
  end if;

  insert into public.studio_members (studio_id, user_id, role)
  values (p_studio, v_user, p_role::public.studio_role);

  insert into public.audit_events (studio_id, actor_user_id, event_type, resource_type, resource_id)
  values (p_studio, auth.uid(), 'member.added:' || p_role, 'studio_member', v_user);

  return 'added';
end;
$$;

-- Change le rôle d'un membre.
-- Renvoie : 'ok', 'unchanged', 'not_member', 'forbidden', 'invalid_role', 'last_owner'.
create or replace function public.inky_set_studio_member_role(p_studio uuid, p_user uuid, p_role text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_me text := public.inky_my_studio_role(p_studio);
  v_target text;
begin
  if p_role is null or p_role not in ('owner', 'admin', 'artist', 'assistant') then
    return 'invalid_role';
  end if;
  if v_me is null or v_me not in ('owner', 'admin') then
    return 'forbidden';
  end if;

  -- Verrouille les owners du studio : deux owners ne peuvent pas se rétrograder en même temps.
  perform 1 from public.studio_members m
  where m.studio_id = p_studio and m.role = 'owner'
  for update;

  select m.role::text into v_target from public.studio_members m
  where m.studio_id = p_studio and m.user_id = p_user
  for update;
  if v_target is null then
    return 'not_member';
  end if;
  if v_target = p_role then
    return 'unchanged';
  end if;
  if v_me <> 'owner' and (v_target = 'owner' or p_role = 'owner') then
    return 'forbidden';
  end if;
  if v_target = 'owner' and (
    select count(*) from public.studio_members m
    where m.studio_id = p_studio and m.role = 'owner'
  ) <= 1 then
    return 'last_owner';
  end if;

  update public.studio_members
  set role = p_role::public.studio_role
  where studio_id = p_studio and user_id = p_user;

  insert into public.audit_events (studio_id, actor_user_id, event_type, resource_type, resource_id)
  values (p_studio, auth.uid(), 'member.role:' || v_target || '>' || p_role, 'studio_member', p_user);

  return 'ok';
end;
$$;

-- Retire un membre du studio (son compte n'est pas supprimé, il perd l'accès à ce studio).
-- Renvoie : 'ok', 'not_member', 'forbidden', 'last_owner'.
create or replace function public.inky_remove_studio_member(p_studio uuid, p_user uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_me text := public.inky_my_studio_role(p_studio);
  v_target text;
begin
  if v_me is null or v_me not in ('owner', 'admin') then
    return 'forbidden';
  end if;

  perform 1 from public.studio_members m
  where m.studio_id = p_studio and m.role = 'owner'
  for update;

  select m.role::text into v_target from public.studio_members m
  where m.studio_id = p_studio and m.user_id = p_user
  for update;
  if v_target is null then
    return 'not_member';
  end if;
  if v_target = 'owner' and v_me <> 'owner' then
    return 'forbidden';
  end if;
  if v_target = 'owner' and (
    select count(*) from public.studio_members m
    where m.studio_id = p_studio and m.role = 'owner'
  ) <= 1 then
    return 'last_owner';
  end if;

  delete from public.studio_members where studio_id = p_studio and user_id = p_user;

  insert into public.audit_events (studio_id, actor_user_id, event_type, resource_type, resource_id)
  values (p_studio, auth.uid(), 'member.removed:' || v_target, 'studio_member', p_user);

  return 'ok';
end;
$$;

revoke all on function public.inky_my_studio_role(uuid) from public, anon;
revoke all on function public.inky_studio_team(uuid) from public, anon;
revoke all on function public.inky_add_studio_member(uuid, text, text) from public, anon;
revoke all on function public.inky_set_studio_member_role(uuid, uuid, text) from public, anon;
revoke all on function public.inky_remove_studio_member(uuid, uuid) from public, anon;

grant execute on function public.inky_my_studio_role(uuid) to authenticated;
grant execute on function public.inky_studio_team(uuid) to authenticated;
grant execute on function public.inky_add_studio_member(uuid, text, text) to authenticated;
grant execute on function public.inky_set_studio_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.inky_remove_studio_member(uuid, uuid) to authenticated;
