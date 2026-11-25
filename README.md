# OuKiLéMonBus — Front

Application web de réservation du bus communal de Dinant. Les organisations (écoles, CPAS, ASBL…) demandent des
trajets ; la commune les valide, les planifie et y affecte un chauffeur et un véhicule ; les chauffeurs suivent leurs
missions et rendent compte de chaque trajet.

Ce dépôt contient la **SPA React** (Single Page Application). Elle n’a aucune logique serveur : toutes les données et
toutes les règles métier viennent de l’API Laravel du dépôt voisin `bus-communal-backend`, qui fait toujours foi.

Projet scolaire mené en binôme, pensé pour être repris par d’autres communes : filtres, recherche et pagination sont
faits par le backend, le front ne charge jamais une table entière.

## Les espaces

Chaque compte arrive dans l’espace de son rôle. Un compte à plusieurs rôles (agent communal et chauffeur, par exemple)
passe de l’un à l’autre avec le sélecteur d’espace.

| Espace | URL | Pour qui | Ce qu’on y fait |
| --- | --- | --- | --- |
| Usager | `/espace` | Membres et responsables d’organisations (rôle `user`) | Réserver un trajet, créer une série (écoles et personnel communal), suivre ses déplacements, gérer ses organisations, consulter ses documents |
| Gestion | `/gestion` | Agents communaux et administrateurs | Traiter les réservations, planning, décisions du Collège, demandes d’adhésion, flotte, documents ; pour l’admin : comptes, communes, outils |
| Chauffeur | `/chauffeur` | Chauffeurs | Missions, « Ma journée » (étapes du trajet, demande d’aide), comptes rendus, feuilles de route, indisponibilités |

Pages communes à tous : `/compte` (profil, sécurité, notifications, tutoriels, données personnelles) et `/notifications`.
Pages publiques : `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/confidentialite`, et les liens reçus par
email `/verify-email` et `/reset-password`.

## Stack

| Outil | Rôle |
| --- | --- |
| React 19 | Interface en composants |
| JavaScript, Vite | Langage et outil de build (imposés) |
| React Router (mode data) | Routes, gardes d’accès, layouts imbriqués, pages chargées à la demande |
| Axios | Appels à l’API, session Sanctum par cookie |
| Tailwind CSS v4 | Styles, avec les couleurs de la charte en variables CSS (mode clair et sombre) |
| Lucide React | Icônes |
| Leaflet + OpenStreetMap | Cartes des trajets et de la zone de prise en charge |

Aucune bibliothèque de gestion d’état ni de chargement de données : React (état, Context) et quelques hooks maison
suffisent (voir [architecture](docs/architecture.md)).

## Démarrer

Prérequis : Node.js 20.19 ou 22.12 et plus (exigence de Vite), et le backend lancé sur `http://localhost:8080` (voir le README du backend, Docker).

```bash
npm install
npm run dev        # http://localhost:3000
```

Le port **3000** est imposé : le backend n’accepte la SPA que depuis cette origine (CORS et Sanctum). Utiliser
**`localhost` partout, jamais `127.0.0.1`** : sinon le navigateur considère deux sites différents et n’envoie pas le
cookie de session.

### Variables d’environnement

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `VITE_API_ORIGIN` | `http://localhost:8080` | Origine du backend, sans `/api` |

Pour la changer : `cp .env.example .env.local` puis modifier `.env.local` (non versionné).

### Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run lint` | ESLint (règles des hooks React, un fichier `.jsx` n’exporte que des composants) |
| `npm run build` | Build de production dans `dist/` (un fichier par page) |
| `npm run preview` | Sert le build de `dist/` pour le tester |

### Comptes de test

Créés par les seeders du backend, mot de passe `password` :

| Email | Rôle |
| --- | --- |
| `admin.test@bus-communal.local` | Administrateur |
| `agent.test@bus-communal.local` | Agent communal |
| `reviewer.test@bus-communal.local` | Agent communal (auteur des demandes de test déjà traitées) |
| `responsable.test@bus-communal.local` | Usager, responsable d’une organisation |
| `user.test@bus-communal.local` | Usager, membre d’une organisation |
| `chauffeur.test@bus-communal.local` | Chauffeur |

En développement, les emails (vérification, mot de passe oublié, notifications) n’arrivent pas réellement : ils sont
captés par Mailpit, consultable sur http://localhost:8025.

## Organisation du code

```
src/
  main.jsx        point d’entrée : fournisseurs (session, notifications) puis routeur
  router.jsx      toutes les routes, leurs gardes et leurs layouts
  navigation.js   menus de chaque espace, filtrés par permission
  api/            client Axios + un fichier par domaine de l’API
  auth/           session, droits, gardes de routes, espaces
  layouts/        cadre de chaque espace (navigation en haut ou barre latérale)
  pages/          un fichier par écran, rangés par espace
  components/     morceaux d’écran par domaine, et composants de base dans ui/
  hooks/          logique réutilisable avec état (chargement, formulaires, rafraîchissement…)
  lib/            fonctions sans React : dates, libellés, règles d’affichage, paramètres d’API
  notifications/  compteur de notifications non lues
  backoffice/     compteurs de la barre latérale de /gestion
```

## Documentation

| Document | Contenu |
| --- | --- |
| [Architecture](docs/architecture.md) | Démarrage de l’application, routeur, layouts, couches du code, chargement des données, chargement à la demande |
| [Authentification et droits](docs/auth-et-droits.md) | Session Sanctum, client Axios et ses erreurs, rôles et permissions, gardes, espaces |
| [Conventions](docs/conventions.md) | Règles de code, formulaires, URL, style et thème, accessibilité, travail en binôme |
| [Espace usager](docs/espace-usager.md) | Accueil, réservation guidée, séries, déplacements, organisations, documents |
| [Espace gestion](docs/gestion.md) | Tableau de bord, file des réservations, planning, Collège, demandes, flotte, administration |
| [Espace chauffeur](docs/espace-chauffeur.md) | Missions, Ma journée, comptes rendus, feuilles de route |
| [Fonctions communes](docs/fonctions-communes.md) | Notifications, compte, tutoriels, RGPD, documents, cartes |

Autres références :

- Règles métier détaillées : `docs/*.md` du dépôt backend (réservations, conflits, planning, documents…).
- Charte graphique et maquettes : [`docs/design/`](docs/design/).
- [`CLAUDE.md`](CLAUDE.md) : consignes et coordination du binôme pour les assistants IA (avancement des pages, points ouverts).

## Licence

© 2026 Sacha Libion et Stéphane Ponzo — **tous droits réservés**.

Le code est public uniquement pour être consulté (évaluation, recrutement). Toute copie, modification ou réutilisation, même partielle, est interdite sans l'accord écrit des auteurs. Voir [`LICENSE`](LICENSE).
