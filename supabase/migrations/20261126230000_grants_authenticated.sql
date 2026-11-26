-- Redonne aux utilisateurs connectés les droits de table dont l'appli a besoin.
-- Constaté le 26/11/2026 : `authenticated` n'avait plus aucun droit sur studios,
-- studio_members et clients (erreur 42501 à la connexion). Les règles RLS restent
-- actives et filtrent toujours les lignes par studio : ces droits ne donnent accès
-- qu'à ce que les politiques autorisent.
-- Volontairement minimal : uniquement les opérations utilisées par le code.

grant select on public.studios to authenticated;
grant select on public.studio_members to authenticated;
grant select, insert on public.clients to authenticated;

-- Les visiteurs non connectés n'ont toujours accès à rien.
revoke all on public.studios, public.studio_members, public.clients, public.audit_events from anon;
