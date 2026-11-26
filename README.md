# INKY CLIENT

Application de gestion du studio INKY TATTOO (Next.js 16, TypeScript, Tailwind, Supabase).

## Démarrer

```bash
pnpm install
cp .env.example .env.local   # puis remplir les valeurs
make dev                     # http://localhost:3000 (libère le port avant)
```

## Scripts

`make help` liste tout : `make dev`, `make kill`, `make check`, `make build`…

## Structure

`src/app` pages (App Router), `src/lib/supabase` clients Supabase navigateur / serveur / proxy,
`src/proxy.ts` rafraîchissement de session, `legacy/` prototype HTML/JS d'origine (référence
pendant la migration), `docs/` contexte du projet.

## Sécurité

Voir `AGENTS.md`. Seule la clé `sb_publishable_` va côté navigateur ; aucun secret dans le dépôt.
L'isolation par studio repose sur les règles RLS Supabase, à tester avant toute donnée réelle.
