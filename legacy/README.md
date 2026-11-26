# INKY CLIENT — branche de développement Supabase

Cette archive prépare une première connexion de développement à Supabase, en conservant l'interface du prototype.

## Inclus
- Connexion e-mail / mot de passe avec Supabase Auth (aucune inscription publique depuis l'application).
- Résolution du studio de l'utilisateur via `studio_members`.
- Lecture des fiches de `clients` limitées au `studio_id` du membre.
- Création d'une fiche client avec les colonnes existantes : `studio_id`, `first_name`, `last_name`, `email`, `project_summary`, `created_by`.
- Déconnexion et demande de réinitialisation de mot de passe.
- Aucun stockage local des fiches clients.

## Configuration
Le fichier `supabase-config.js` contient le Project URL et la clé `sb_publishable_` du projet de développement. Une clé publishable est conçue pour le navigateur. Ne jamais ajouter de clé `sb_secret_`, `service_role` ou autre secret dans ce dépôt ou dans le frontend.

## Avant tout déploiement ou donnée réelle
Cette version est une intégration de développement, pas une validation de sécurité ni une version de production. Vérifier notamment :
1. Les politiques RLS de `studio_members`, `studios` et `clients` avec deux utilisateurs et deux studios distincts.
2. Que chaque utilisateur ne peut lire ou modifier que les données de son studio.
3. Que les règles de rôles `owner`, `admin`, `artist`, `assistant` sont effectivement appliquées côté base.
4. Le parcours d'invitation et la création des membres par un backend de confiance ; ne pas autoriser la création libre de rôles élevés depuis le navigateur.
5. Les politiques et tests de suppression logique, audit, sauvegarde et conservation.
6. Le parcours RGPD, les consentements et la protection des données sensibles. Ne pas saisir de données de santé, pièces d'identité, photos intimes ou autres données sensibles dans cette version.

Le frontend utilise la bibliothèque Supabase JS v2 depuis jsDelivr. Les autres modules (projets, séances, finances, après-soin) restent des écrans de présentation et ne sont pas encore connectés.
