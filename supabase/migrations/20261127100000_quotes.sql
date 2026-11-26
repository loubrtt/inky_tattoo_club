-- Devis et règlements (suivi interne, aucun paiement par carte).
-- À appliquer APRÈS 20261127090000_projects.sql, dans Supabase > SQL Editor.
--
-- Un devis par projet : montant total, acompte demandé, statut. Les règlements reçus
-- (date, montant, moyen) sont rattachés au devis ; le reste à percevoir est calculé.
-- Montants en centimes (entiers). Lecture et écriture : owner, admin et artist du studio ;
-- un assistant ne voit aucun montant. Pas de DELETE : un règlement saisi par erreur est
-- retiré par suppression logique (deleted_at).

-- Vrai si l'utilisateur connecté peut voir les montants du studio.
create or replace function public.inky_can_see_money(p_studio uuid)
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
      and m.role::text in ('owner', 'admin', 'artist')
  );
$$;

revoke all on function public.inky_can_see_money(uuid) from public, anon;
grant execute on function public.inky_can_see_money(uuid) to authenticated;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  project_id uuid not null unique references public.projects (id) on delete cascade,
  total_cents integer not null check (total_cents between 0 and 99999999),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined')),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_deposit_le_total check (deposit_cents <= total_cents)
);

create index if not exists quotes_studio_idx on public.quotes (studio_id, updated_at desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  quote_id uuid not null references public.quotes (id) on delete cascade,
  paid_on date not null,
  amount_cents integer not null check (amount_cents between 1 and 99999999),
  method text not null check (method in ('cash', 'transfer', 'other')),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists payments_quote_idx on public.payments (quote_id) where deleted_at is null;

-- studio_id, project_id / quote_id, created_by et created_at ne bougent jamais.
create or replace function public.inky_quotes_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.studio_id := old.studio_id;
    new.project_id := old.project_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists quotes_guard on public.quotes;
create trigger quotes_guard
  before insert or update on public.quotes
  for each row execute function public.inky_quotes_guard();

create or replace function public.inky_payments_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.studio_id := old.studio_id;
    new.quote_id := old.quote_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists payments_guard on public.payments;
create trigger payments_guard
  before insert or update on public.payments
  for each row execute function public.inky_payments_guard();

alter table public.quotes enable row level security;
alter table public.payments enable row level security;

revoke all on public.quotes, public.payments from anon, authenticated;
grant select, insert, update on public.quotes, public.payments to authenticated;

drop policy if exists quotes_select on public.quotes;
create policy quotes_select on public.quotes
  for select to authenticated
  using (public.inky_can_see_money(studio_id));

drop policy if exists quotes_insert on public.quotes;
create policy quotes_insert on public.quotes
  for insert to authenticated
  with check (
    public.inky_can_see_money(studio_id)
    and created_by = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.studio_id = quotes.studio_id and p.deleted_at is null
    )
  );

drop policy if exists quotes_update on public.quotes;
create policy quotes_update on public.quotes
  for update to authenticated
  using (public.inky_can_see_money(studio_id))
  with check (public.inky_can_see_money(studio_id));

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select to authenticated
  using (public.inky_can_see_money(studio_id));

drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments
  for insert to authenticated
  with check (
    public.inky_can_see_money(studio_id)
    and created_by = auth.uid()
    and deleted_at is null
    and exists (
      select 1 from public.quotes q where q.id = quote_id and q.studio_id = payments.studio_id
    )
  );

drop policy if exists payments_update on public.payments;
create policy payments_update on public.payments
  for update to authenticated
  using (public.inky_can_see_money(studio_id) and deleted_at is null)
  with check (public.inky_can_see_money(studio_id));
