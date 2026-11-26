# Supabase

Le projet de développement s'appelle `inky-client-dev` (URL dans `.env.local`).

## 1. Réglages à faire dans le dashboard (une seule fois)

Authentication > Sign In / Providers : désactiver **Allow new users to sign up**.
Les comptes se créent uniquement par invitation (Authentication > Users > Invite).

Authentication > URL Configuration : Site URL `http://localhost:3000` et, dans Redirect URLs,
ajouter `http://localhost:3000/**` (et plus tard l'URL de production).

## Invitations de l'équipe (page Équipe)

1. Appliquer la migration `migrations/20261126232000_studio_team.sql` (SQL Editor).
2. Mettre la clé `sb_secret_` du projet (Project Settings > API Keys) dans `.env.local`, variable
   `SUPABASE_SECRET_KEY`. Elle reste côté serveur ; sans elle, on peut seulement ajouter des
   personnes qui ont déjà un compte.
3. Authentication > Emails > « Invite user » : remplacer le lien du modèle par
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/nouveau-mot-de-passe`
   (le lien par défaut renvoie la session dans l'URL, que le serveur ne peut pas lire).

## Connexion Google

1. Google Cloud Console > APIs & Services > Credentials > Create credentials > OAuth client ID,
   type « Web application ». Authorized redirect URI :
   `https://<project-ref>.supabase.co/auth/v1/callback` (le project ref est dans l'URL Supabase).
2. Supabase > Authentication > Sign In / Providers > Google : activer, coller Client ID et Client Secret.
   Le Client Secret reste dans Supabase, jamais dans le repo.
3. Les URLs de retour sont les mêmes que pour le mot de passe oublié (Redirect URLs ci-dessus).

Un compte Google sans adhésion à un studio arrive sur `/sans-studio` et ne voit rien.

## 2. Versionner le schéma

```bash
make db-login      # ouvre le navigateur pour se connecter à Supabase
make db-link       # demande le project ref (dans l'URL) et le mot de passe de la base
make db-pull       # écrit supabase/migrations/<date>_remote_schema.sql
make db-types      # génère src/lib/supabase/database.types.ts
```

Commiter le dossier `supabase/migrations`. Ne jamais commiter de mot de passe ni de clé secrète.

## 3. Ce qu'il faut vérifier dans le schéma (relecture)

RLS activé sur `studios`, `studio_members`, `clients`, `audit_events`.

`studio_members` : un utilisateur ne peut pas s'insérer lui-même ni changer son rôle.
Aucune politique `insert` / `update` ouverte au rôle `authenticated` sans contrôle de rôle.

`clients` : lecture et écriture seulement si l'utilisateur est membre du `studio_id` de la ligne ;
à l'insertion, `created_by = auth.uid()` est imposé par la politique (`with check`).

Tester avec deux comptes dans deux studios différents : aucun ne voit les fiches de l'autre.
