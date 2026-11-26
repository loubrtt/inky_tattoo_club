-- Site public : contenu de la landing de chaque studio, modifiable depuis le dashboard.
-- À appliquer dans Supabase > SQL Editor (ou `supabase db push` une fois le projet lié).
-- Lecture : membres du studio (dashboard) et, pour tout le monde, uniquement via
-- inky_public_site(slug) qui ne renvoie que le nom du studio et ce contenu public.
-- Écriture : owner et admin du studio seulement.

-- Vrai si l'utilisateur connecté a l'un des rôles p_roles dans le studio p_studio.
create or replace function public.inky_has_studio_role(p_studio uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.studio_members m
    where m.studio_id = p_studio
      and m.user_id = auth.uid()
      and m.role::text = any (p_roles)
  );
$$;

revoke all on function public.inky_has_studio_role(uuid, text[]) from public, anon;
grant execute on function public.inky_has_studio_role(uuid, text[]) to authenticated;

create table if not exists public.studio_sites (
  studio_id uuid primary key references public.studios (id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users (id),
  constraint studio_sites_content_object check (jsonb_typeof(content) = 'object'),
  constraint studio_sites_content_size check (octet_length(content::text) <= 60000)
);

-- studio_id ne bouge jamais ; updated_at et updated_by suivent la dernière modification.
create or replace function public.inky_studio_sites_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.studio_id := old.studio_id;
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists studio_sites_guard on public.studio_sites;
create trigger studio_sites_guard
  before insert or update on public.studio_sites
  for each row execute function public.inky_studio_sites_guard();

alter table public.studio_sites enable row level security;

revoke all on public.studio_sites from anon, authenticated;
grant select, insert, update on public.studio_sites to authenticated;

drop policy if exists studio_sites_select on public.studio_sites;
create policy studio_sites_select on public.studio_sites
  for select to authenticated
  using (public.inky_is_studio_member(studio_id, auth.uid()));

drop policy if exists studio_sites_insert on public.studio_sites;
create policy studio_sites_insert on public.studio_sites
  for insert to authenticated
  with check (public.inky_has_studio_role(studio_id, array['owner', 'admin']));

drop policy if exists studio_sites_update on public.studio_sites;
create policy studio_sites_update on public.studio_sites
  for update to authenticated
  using (public.inky_has_studio_role(studio_id, array['owner', 'admin']))
  with check (public.inky_has_studio_role(studio_id, array['owner', 'admin']));

-- Lecture publique de la landing d'un studio, par son slug.
create or replace function public.inky_public_site(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'studio_name', s.name,
    'content', coalesce(ss.content, '{}'::jsonb)
  )
  from public.studios s
  left join public.studio_sites ss on ss.studio_id = s.id
  where s.slug = p_slug;
$$;

revoke all on function public.inky_public_site(text) from public;
grant execute on function public.inky_public_site(text) to anon, authenticated;
