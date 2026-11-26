# INKY CLIENT

Application de gestion du studio INKY TATTOO (Next.js 16, TypeScript, Tailwind, Supabase).

## Démarrer

```bash
pnpm install
cp .env.example .env.local   # puis remplir les valeurs
make dev                     # http://localhost:3000 (libère le port avant)
```

## Scripts

`make help` liste tout : `make dev`, `make kill`, `make check` (lint, types, format, tests), `make build`, `make db-pull`…

## Structure

`src/app/(auth)` connexion, mot de passe oublié, nouveau mot de passe, compte sans studio.
`src/app/page.tsx` landing publique du studio (contenu à remplir dans `src/lib/landing/content.ts`).
`src/app/dashboard` écrans connectés : vue d’ensemble, planning, clients, projets, devis, après-soin, réglages.
`src/app/auth/confirm` arrivée des liens reçus par e-mail.
`src/lib/auth/dal.ts` seul point d'accès à l'utilisateur et au studio actif (côté serveur).
`src/lib/clients` lecture et création des fiches. `src/lib/validation.ts` schémas Zod.
`src/proxy.ts` rafraîchit la session et renvoie vers `/connexion` si besoin.
`supabase/` réglages et versionnage du schéma (voir `supabase/README.md`).
`docs/` contexte du projet, `tests/` tests Vitest.

## Sécurité

Voir `AGENTS.md`. Seule la clé `sb_publishable_` va côté navigateur ; aucun secret dans le dépôt.
L'isolation par studio repose sur les règles RLS Supabase, à tester avant toute donnée réelle.
