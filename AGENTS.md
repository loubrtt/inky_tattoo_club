# Règles de l'agent — INKY CLIENT

## Prénom

L'utilisatrice de ce poste s'appelle **Lou** : s'adresser à elle par son prénom.

## Lien de la branche après chaque push

À chaque push, donner à Lou le lien GitHub pour ouvrir la PR à la main :
`https://github.com/<owner>/<repo>/pull/new/<branche>` (celui qu'affiche `git push`).
Ne jamais ouvrir la PR soi-même (`gh pr create`) : c'est Lou qui la crée.

## Lien localhost après chaque dev

Dès qu'un développement est fini (même avant commit / push), donner à Lou le ou les liens
`http://localhost:3000/...` qui mènent **directement** à l'écran modifié (avec un vrai id pris
en base quand la page en demande un), pour qu'elle teste quand elle a le temps. Le serveur de
dev (`pnpm dev` / `npm run dev`) est lancé par Lou, jamais par l'agent.

Si l'écran dépend d'une migration pas encore appliquée, le dire à côté du lien : ce qui
marchera et ce qui échouera tant qu'elle n'est pas appliquée.

## Double check des edge cases avant chaque push

Avant **chaque** push, relire le diff complet de la branche (tous les commits, pas seulement
le dernier : `git diff <base>...HEAD`) et passer en revue les cas limites de chaque changement :
valeurs nulles / vides / manquantes, listes vides ou très longues, erreurs réseau et réponses
inattendues des services externes, droits et rôles différents, états intermédiaires, fuseaux
et formats de dates, entrées utilisateur invalides. Pour chaque cas limite trouvé : vérifier
dans le code qu'il est géré, et sinon le corriger ou le signaler à Lou avant de pousser. Dire
à Lou en une ligne que le double check a été fait et ce qu'il a relevé (ou « rien à signaler »).

## Messages rédigés pour Lou : ni tirets ni émojis

Dans les messages rédigés à sa place (Slack, mail, annonce d'équipe…), pas de listes à tirets
ou à puces et pas d'émojis : des phrases et des paragraphes, c'est tout.

## Liens et messages : toujours dans le presse-papier

Chaque fois qu'on donne à Lou un lien (PR, localhost, fiche…) ou un message rédigé pour elle,
le mettre aussi dans le presse-papier (`pbcopy`). S'il y a plusieurs éléments, copier le
principal et le dire ; elle demandera les autres si besoin.

## Ne rien inventer, poser toutes les questions

Avant d'agir sur un point ambigu, **poser toutes les questions possibles** (une question par
point, options claires, recommandation si on en a une) et attendre la réponse. **Ne jamais
inventer** une donnée, un comportement, une date ou une décision : si une information manque,
le dire et demander. Être **précis et court** dans les réponses : la conclusion d'abord, les
détails ensuite, pas de jargon ni de références que Lou ne peut pas suivre sans contexte.

## Sécurité et données (propre à INKY CLIENT)

- Ne jamais mettre de clé `sb_secret_`, `service_role` ou autre secret dans le code client,
  dans le dépôt ou dans une conversation. Seule la clé `sb_publishable_` peut aller côté navigateur.
- Les secrets vont dans `.env.local` (jamais commité) ; `.env.example` liste les variables sans valeurs.
- Toute opération sensible (création de studio, invitation de membres, attribution de rôles)
  passe par le serveur, jamais directement depuis le navigateur.
- Les données sont isolées par studio : chaque requête est filtrée par `studio_id` et protégée
  par des règles RLS côté Supabase. Tester avec au moins deux utilisateurs et deux studios.
- Rôles : `owner`, `admin`, `artist`, `assistant`, appliqués côté base, pas seulement dans l'UI.
- Pas de vraies données clients, données de santé, pièces d'identité ou photos sensibles tant
  que la sécurité, les droits, la conservation et le parcours RGPD ne sont pas validés.
- Ne pas fusionner dans `main` ni déployer sans validation explicite de Lou.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
