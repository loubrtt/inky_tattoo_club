-- Projets de tatouage et séances.
-- À appliquer dans Supabase > SQL Editor (ou `supabase db push` une fois le projet lié).
--
-- Un projet appartient à un studio et à un client du même studio ; il peut avoir un artiste
-- (membre du studio). Les séances sont les rendez-vous du planning reliés au projet
-- (appointments.project_id). Lecture et écriture : tous les membres du studio, comme pour
-- les clients et le planning. Pas de DELETE : suppression logique via deleted_at.
-- Pas de photos ni de données de santé dans ces champs.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  artist_id uuid references auth.users (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  status text not null default 'to_draw' check (status in ('to_draw', 'in_progress', 'done')),
  body_zone text check (body_zone is null or char_length(body_zone) <= 120),
  dimensions text check (dimensions is null or char_length(dimensions) <= 80),
  style text check (style is null or char_length(style) <= 80),
  refs text check (refs is null or char_length(refs) <= 2000),
  artistic_notes text check (artistic_notes is null or char_length(artistic_notes) <= 4000),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists projects_studio_updated_idx
  on public.projects (studio_id, updated_at desc)
  where deleted_at is null;
create index if not exists projects_client_idx on public.projects (client_id);

-- studio_id, created_by et created_at ne bougent jamais après création ; updated_at suit.
create or replace function public.inky_projects_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.studio_id := old.studio_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists projects_guard on public.projects;
create trigger projects_guard
  before insert or update on public.projects
  for each row execute function public.inky_projects_guard();

alter table public.projects enable row level security;

revoke all on public.projects from anon, authenticated;
grant select, insert, update on public.projects to authenticated;

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select to authenticated
  using (public.inky_is_studio_member(studio_id, auth.uid()));

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert to authenticated
  with check (
    public.inky_is_studio_member(studio_id, auth.uid())
    and created_by = auth.uid()
    and deleted_at is null
    and (artist_id is null or public.inky_is_studio_member(studio_id, artist_id))
    and exists (
      select 1 from public.clients c where c.id = client_id and c.studio_id = projects.studio_id
    )
  );

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update to authenticated
  using (public.inky_is_studio_member(studio_id, auth.uid()) and deleted_at is null)
  with check (
    public.inky_is_studio_member(studio_id, auth.uid())
    and (artist_id is null or public.inky_is_studio_member(studio_id, artist_id))
    and exists (
      select 1 from public.clients c where c.id = client_id and c.studio_id = projects.studio_id
    )
  );

-- Séances : un rendez-vous peut être relié à un projet du même studio.
alter table public.appointments
  add column if not exists project_id uuid references public.projects (id) on delete set null;

create index if not exists appointments_project_idx
  on public.appointments (project_id)
  where project_id is not null and deleted_at is null;

drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
  for insert to authenticated
  with check (
    public.inky_is_studio_member(studio_id, auth.uid())
    and created_by = auth.uid()
    and (artist_id is null or public.inky_is_studio_member(studio_id, artist_id))
    and (client_id is null or exists (
      select 1 from public.clients c where c.id = client_id and c.studio_id = appointments.studio_id
    ))
    and (project_id is null or exists (
      select 1 from public.projects p
      where p.id = project_id and p.studio_id = appointments.studio_id and p.deleted_at is null
    ))
  );

drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments
  for update to authenticated
  using (public.inky_is_studio_member(studio_id, auth.uid()) and deleted_at is null)
  with check (
    public.inky_is_studio_member(studio_id, auth.uid())
    and (artist_id is null or public.inky_is_studio_member(studio_id, artist_id))
    and (client_id is null or exists (
      select 1 from public.clients c where c.id = client_id and c.studio_id = appointments.studio_id
    ))
    and (project_id is null or exists (
      select 1 from public.projects p
      where p.id = project_id and p.studio_id = appointments.studio_id and p.deleted_at is null
    ))
  );
