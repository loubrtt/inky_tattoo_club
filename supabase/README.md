# Supabase

Le projet de développement s'appelle `inky-client-dev` (URL dans `.env.local`).

## 1. Réglages à faire dans le dashboard (une seule fois)

Authentication > Sign In / Providers : désactiver **Allow new users to sign up**.
Les comptes se créent uniquement par invitation (Authentication > Users > Invite).

Authentication > URL Configuration : Site URL `http://localhost:3000` et, dans Redirect URLs,
ajouter `http://localhost:3000/**` (et plus tard l'URL de production).

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
