-- Planning : rendez-vous du studio.
-- À appliquer dans Supabase > SQL Editor (ou `supabase db push` une fois le projet lié).
-- Droits de départ : tout membre du studio voit et modifie les RDV de son studio.

-- Vrai si l'utilisateur p_user est membre du studio p_studio ET que l'appelant en est membre aussi.
-- security definer : évite la récursion RLS sur studio_members.
create or replace function public.inky_is_studio_member(p_studio uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.studio_members m
    where m.studio_id = p_studio and m.user_id = p_user
  )
  and exists (
    select 1 from public.studio_members me
    where me.studio_id = p_studio and me.user_id = auth.uid()
  );
$$;

-- Annuaire des membres d'un studio (id, rôle, e-mail), lisible seulement par ses membres.
create or replace function public.inky_studio_directory(p_studio uuid)
returns table (user_id uuid, role text, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, m.role::text, u.email::text
  from public.studio_members m
  join auth.users u on u.id = m.user_id
  where m.studio_id = p_studio
    and exists (
      select 1 from public.studio_members me
      where me.studio_id = p_studio and me.user_id = auth.uid()
    )
  order by u.email;
$$;

revoke all on function public.inky_is_studio_member(uuid, uuid) from public, anon;
revoke all on function public.inky_studio_directory(uuid) from public, anon;
grant execute on function public.inky_is_studio_member(uuid, uuid) to authenticated;
grant execute on function public.inky_studio_directory(uuid) to authenticated;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  kind text not null default 'session'
    check (kind in ('session', 'consultation', 'touch_up', 'unavailable', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  client_id uuid references public.clients (id) on delete set null,
  artist_id uuid references auth.users (id) on delete set null,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint appointments_time_order check (ends_at > starts_at),
  constraint appointments_max_duration check (ends_at - starts_at <= interval '24 hours')
);

create index if not exists appointments_studio_starts_idx
  on public.appointments (studio_id, starts_at)
  where deleted_at is null;

-- studio_id, created_by et created_at ne bougent jamais après création ; updated_at suit.
create or replace function public.inky_appointments_guard()
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

drop trigger if exists appointments_guard on public.appointments;
create trigger appointments_guard
  before insert or update on public.appointments
  for each row execute function public.inky_appointments_guard();

alter table public.appointments enable row level security;

revoke all on public.appointments from anon;
grant select, insert, update on public.appointments to authenticated;
-- Pas de DELETE : suppression logique via deleted_at.

drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
  for select to authenticated
  using (public.inky_is_studio_member(studio_id, auth.uid()));

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
  );
