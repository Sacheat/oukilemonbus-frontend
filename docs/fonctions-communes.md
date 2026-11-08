# Fonctions communes

Ce qui sert dans plusieurs espaces : notifications, compte, tutoriels, RGPD, documents, cartes, thème.

## Notifications

- **Cloche** (`NotificationBell`, dans chaque layout) : nombre de non lues et panneau des 5 dernières. Le nombre est
  partagé par [`NotificationsProvider`](../src/notifications/NotificationsProvider.jsx) : relu toutes les 60 s quand
  l’onglet est visible, au retour sur l’onglet, et après une lecture (`refreshCount()`).
- **Page `/notifications`** ([`NotificationsPage`](../src/pages/NotificationsPage.jsx)) : recherche (2 lettres au
  moins, 300 ms après la frappe), pastilles d’état `?etat=non-lues|urgentes` et de catégorie `?categorie=`, avec les
  nombres de `GET /notifications/summary` ; notifications groupées par jour.
- « Tout marquer comme lu » : sans filtre, toutes ; avec un filtre, seulement celles qui correspondent
  (`PATCH /notifications/read-by-filter`, mêmes filtres que la liste).
- Chaque notification mène à l’endroit concerné (réservation, demande, demande d’aide…), selon le rôle
  ([`lib/notifications.js`](../src/lib/notifications.js)).
- Catégories : celles de **tous** les rôles du compte (un agent aussi chauffeur voit aussi celles du chauffeur).
- Préférences par catégorie (cloche, email) dans `/compte`. Les demandes d’aide sont urgentes et ne se désactivent pas.

## Mon compte (`/compte`)

[`AccountPage`](../src/pages/account/AccountPage.jsx), affichée dans le layout de l’espace courant (`RoleLayout`).
En-tête de profil (initiales, nom, email vérifié ou non avec renvoi du lien, rôles, organisations), puis des sections
avec un sommaire à gauche en grand écran, qui suit la section visible (`useActiveSection`) :

| Section | Contenu |
| --- | --- |
| Informations | Nom, prénom, email, téléphone |
| Sécurité | Changement de mot de passe, règles affichées en direct sous les champs |
| Notifications | Préférences par catégorie (`NotificationPreferencesCard`) |
| Tutoriels | « Revoir le tutoriel » de chaque espace du compte (`ToursCard`) |
| Mes données | Export de toutes ses données en JSON (`PersonalDataCard`) |

## Sélecteur d’espace

Un compte à plusieurs rôles (agent communal et chauffeur, par exemple) passe d’un espace à l’autre avec
[`SpaceSwitcher`](../src/layouts/SpaceSwitcher.jsx), dans l’en-tête ou la barre latérale. Le dernier espace visité
devient l’espace d’arrivée à la connexion (voir [auth-et-droits](auth-et-droits.md#espaces-et-comptes-à-plusieurs-rôles)).

## Tutoriels de première connexion

Un tutoriel par espace (`usager`, `agent`, `chauffeur`), défini dans [`lib/tours.js`](../src/lib/tours.js).

- **Cartes d’accueil** (`WelcomeTour`), montrées à tous la première fois.
- **Visite sur l’interface** en option (`SpotlightTour`) : voile sombre, élément éclairé, bulle « Suivant ». Les
  éléments visés portent un attribut `data-tour` (`nav:/chemin` pour les menus, `notifications`, `compte`…). Proposée
  à partir de 640 px et seulement si au moins 3 éléments sont visibles ; une cible cachée est sautée.
- Cartes et étapes filtrées par permission, comme les menus : chacun ne voit que ce qui le concerne.
- Le code du tutoriel n’est téléchargé que s’il y en a un à montrer (`TourLauncher`).
- « Vu » est enregistré par le backend (`tours_seen` de `/auth/me`) dès que les cartes se ferment ou que la visite
  démarre. « Revoir le tutoriel » dans `/compte` l’oublie et ouvre l’espace.

Une nouvelle page ou entrée de menu doit être ajoutée au tutoriel de son espace.

## RGPD

Détail des règles : `docs/privacy.md` du backend. Côté front :

- **Inscription** : case « J’ai lu la politique de confidentialité » exigée par le backend.
- **Politique** : page publique `/confidentialite` ([`PrivacyPolicyPage`](../src/pages/PrivacyPolicyPage.jsx)), durées
  de conservation dans [`lib/privacy.js`](../src/lib/privacy.js). Texte à faire valider par la commune et son DPO.
- **Nouvelle version de la politique** : bandeau `PrivacyPolicyBanner` dans les layouts tant qu’elle n’est pas lue ;
  « J’ai lu » l’enregistre. Ce n’est pas un consentement : rien n’est bloqué.
- **Accès et portabilité** : « Mes données » dans `/compte` (JSON). Un admin peut exporter les données d’un compte
  depuis la page Utilisateurs.
- **Effacement** : anonymisation d’un compte par un admin (`AnonymizeUserModal`, case « Je comprends » obligatoire,
  irréversible, jamais son propre compte). Si le backend refuse (réservation ou mission à venir, demande d’aide ouverte,
  dernier admin), chaque raison est affichée. Un compte anonymisé porte un badge et son panneau passe en lecture seule.
- **Champs libres** (motifs, remarques, justification, message d’aide…) : consigne « pas d’information médicale » sous
  le champ (`SENSITIVE_TEXT_HINT`, `withSensitiveHint`).

## Documents et fichiers

- Les fichiers (PDF, Excel…) sont reçus en **Blob** (`responseType: 'blob'`, `downloadDocument`), puis ouverts dans
  un onglet ou enregistrés (`useDocumentFile`, [`lib/documents.js`](../src/lib/documents.js)). Une erreur arrive alors
  elle aussi en Blob : elle est lue avec `getBlobErrorMessage`.
- `GET /documents` est toujours paginé, pour tous les rôles.
- Documents d’une réservation (`TripDocumentsCard`) : décision du Collège, délibération, feuilles de route qui
  contiennent le trajet ; affichés dans le détail d’un déplacement et dans le panneau de la file.
- **Liste des passagers** (`PassengerListCard`, carnet de bord) : un fichier joint à une réservation (PDF, Excel, CSV,
  image, 5 Mo au plus), remplacé par une nouvelle version. Le demandeur et le responsable peuvent la déposer jusqu’au
  départ, un agent à tout moment ; le chauffeur affecté la lit. Le backend dit si on peut la remplacer
  (`meta.can_replace`).

## Cartes

- **Leaflet** avec le fond **OpenStreetMap**, chargé seulement quand une carte s’affiche.
- `TripMap` : départ, destination et route réelle si on la lui passe (sinon ligne à vol d’oiseau) ; masquée sans
  coordonnées. Utilisée dans l’assistant de réservation, le détail d’un déplacement et d’une mission.
- `PickupZoneMap` (Communes) : dépôt ou centre de la commune et cercle de prise en charge qui suit la saisie.
- `PlanningStepsMap` (Planning) : positions des étapes du chauffeur, en rouge si une étape est loin du lieu prévu.
- La couleur du tracé suit le thème (lue dans la variable CSS `--primary`).

## Thème clair et sombre

Suit le système par défaut ; `ThemeToggle` force clair ou sombre, choix gardé dans le `localStorage`. Détail dans les
[conventions](conventions.md#style-et-thème).

## Pages d’erreur

| Page | Quand |
| --- | --- |
| `NotFoundPage` | URL inconnue |
| `ForbiddenPage` | Rôle ou permission manquants (gardes) |
| `EmailNotVerifiedPage` | Connecté, email pas encore vérifié (renvoi du lien possible) |
| `ServerUnavailablePage` | La session n’a pas pu être relue (serveur en erreur ou injoignable), avec « Réessayer » |
| `RouteErrorPage` | Un composant a planté pendant le rendu (`errorElement` du routeur) |
