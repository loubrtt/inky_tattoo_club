# INKY CLIENT — Contexte de reprise du projet

Dernière mise à jour : 25 novembre 2026  
Branche exportée : `develop-supabase`  
Dépôt GitHub : dépôt du prototype (privé, non cité ici)

## 1. Objectif du projet

INKY CLIENT est l'application de gestion du studio INKY TATTOO. Le plan est de l'utiliser d'abord au studio, puis de la proposer à d'autres studios.

Décisions produit déjà prises :

- Comptes individuels pour les membres de l'équipe.
- Rôles prévus : `owner`, `admin`, `artist`, `assistant`.
- Les données doivent être isolées par studio.
- Personnalisation réservée à l'offre Premium.
- Modèle commercial envisagé : abonnement mensuel et licence à vie.
- Migration progressive en conservant l'interface actuelle.

## 2. Dépôt et branches

- Dépôt : dépôt du prototype (non cité ici)
- Visibilité : privé.
- Branche principale : `main` (prototype initial).
- Branche de travail : `develop-supabase`.
- Au dernier contrôle GitHub, `develop-supabase` était annoncée avec 1 commit d'avance sur `main`.
- Dernier commit visible : `feat: prepare Supabase integration` (`42e6b65b80f502d38f757eca778c927c88dbce98`).

Ne pas fusionner dans `main` ni déployer la nouvelle branche sans validation explicite.

## 3. Contenu de la branche exportée

Fichiers présents dans l'archive :

- `index.html` — interface HTML et écran de connexion.
- `styles.css` — styles de l'application.
- `app.js` — logique de navigation, authentification, chargement et création des fiches clients.
- `supabase-config.js` — URL du projet et clé publique de navigateur.
- `manifest.webmanifest` — manifeste PWA.
- `sw.js` — service worker / cache.
- `README.md` — instructions et limites connues.
- `inky-client-v1.zip` — archive du prototype initial incluse dans le dépôt.

Aucun fichier Python (`.py`) n'est présent dans cette branche du dépôt. Le projet applicatif est principalement HTML, CSS et JavaScript.

## 4. Supabase — environnement de développement

Projet Supabase :

- Nom : `inky-client-dev`
- URL : voir `NEXT_PUBLIC_SUPABASE_URL` dans `.env.local`
- Région : Europe.
- Studio créé : `INKY TATTOO`, slug `inky-tattoo`.
- Un utilisateur propriétaire (`owner`) a été créé et confirmé dans Supabase.

Tables préparées :

- `studios`
- `studio_members`
- `clients`
- `audit_events`

Le schéma comprend notamment un rôle de studio (`owner`, `admin`, `artist`, `assistant`), les références au studio et des règles RLS initiales.

Important : le schéma et les règles RLS sont une base de développement, pas une validation de sécurité de production. Il faut tester les accès avec au moins deux utilisateurs et deux studios, vérifier l'absence d'escalade de privilèges, et déplacer les opérations sensibles (création de studio/membres et attribution des rôles) vers un backend de confiance.

## 5. État de l'application

La branche exportée prépare :

- Connexion e-mail / mot de passe via Supabase Auth.
- Recherche de l'appartenance au studio via `studio_members`.
- Chargement des fiches clients du studio courant.
- Création d'une fiche client dans `clients`.
- Déconnexion.
- Demande de réinitialisation du mot de passe.

Les écrans Projets & séances, Devis & paiements, Suivi après-soin et Réglages sont encore des écrans de présentation et ne sont pas tous reliés à la base de données.

## 6. Environnement local

L'application a été ouverte localement sur :

- `http://localhost:8000`

Commande utilisée dans le terminal du Mac :

```bash
python3 -m http.server 8000
```

Le serveur local était actif lors de la dernière capture. Garder le terminal ouvert pendant les tests. Pour arrêter le serveur : `Ctrl+C`.

## 7. Blocage rencontré le 25 novembre 2026

Le compte utilisateur Supabase existe et est confirmé. Le formulaire de connexion de la branche locale s'affiche correctement.

Lors d'une demande de réinitialisation de mot de passe, l'application a affiché :
`Impossible d’envoyer le lien : email rate limit exceeded`

Cela indique que le service d'envoi d'e-mails Supabase a refusé une nouvelle demande à cause de sa limite d'envoi. Ne pas multiplier les demandes.

Une URL de redirection locale a été ajoutée à la configuration Auth :
`http://localhost:8000/**`

La prochaine étape est d'attendre le renouvellement de la limite d'envoi, puis de demander une seule réinitialisation depuis `http://localhost:8000`. Avant d'ouvrir le lien reçu, vérifier qu'il redirige vers `localhost:8000` et non vers le site Cloudflare Pages / V1.

## 8. Déploiement

Ancienne version publique de test :
(URL Cloudflare Pages retirée du dépôt public)

La nouvelle branche de développement n'est pas encore validée pour la production. Ne pas confondre la page Cloudflare Pages existante avec la version locale `localhost:8000`.

## 9. Sécurité et données

- Ne jamais placer une clé `sb_secret_` ou `service_role` dans le navigateur, dans GitHub ou dans ce dossier.
- La clé `sb_publishable_` est une clé publique destinée au navigateur ; elle n'est pas un mot de passe.
- Ne pas ajouter de vraies données clients, données de santé, pièces d'identité ou photos sensibles tant que la sécurité, les droits, la conservation et le parcours RGPD ne sont pas validés.
- Le nouveau dépôt est public : aucune valeur de configuration ni secret dans les fichiers, tout passe par `.env.local`.
- Ne pas coller de mots de passe, tokens privés ou secrets dans les conversations ou fichiers de contexte.

## 10. Prochaines étapes recommandées

1. Résoudre l'accès au compte propriétaire et tester une connexion réelle.
2. Tester lecture et création d'un client fictif dans Supabase.
3. Tester l'isolation entre studios et les politiques RLS.
4. Mettre en place un backend de confiance pour les invitations et les rôles.
5. Connecter progressivement les autres modules métier.
6. Mettre en place audit, sauvegardes, suppression logique, conservation et conformité RGPD.
7. Faire une revue sécurité complète avant toute donnée réelle.
8. Préparer seulement ensuite le déploiement de la branche de développement.

## 11. Note sur cette exportation

Cette archive est une copie des fichiers présents dans `inky-client-develop-supabase-v0.2.zip`, qui correspond à la branche de développement observée sur GitHub. Le dépôt distant reste la source de vérité. Aucun changement n'a été poussé sur GitHub par la création de cette archive.
