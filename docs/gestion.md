# Espace gestion (`/gestion`)

Back-office des agents communaux et des administrateurs (`RequireRole` `admin`, `agent_communal`). Barre latérale
groupée en trois sections (`SidebarLayout`, menu `BACKOFFICE_NAV` de [`navigation.js`](../src/navigation.js)) ; chaque
entrée n’apparaît qu’avec sa permission.

| Section | Menu | URL | Permission |
| --- | --- | --- | --- |
| Gestion | Tableau de bord | `/gestion` | `dashboard.view` |
| | Réservations | `/gestion/reservations` | `reservations.approve` |
| | Planning | `/gestion/planning` | `reservations.view` |
| | Décisions du Collège | `/gestion/college` | `council-decisions.create` |
| | Demandes | `/gestion/demandes` | `org-registration-requests.review` |
| | Organisations | `/gestion/organisations` | `organizations.update` |
| | Documents | `/gestion/documents` | `documents.generate` |
| Flotte | Véhicules | `/gestion/vehicules` | `vehicles.update` |
| | Chauffeurs | `/gestion/chauffeurs` | `drivers.update` |
| | Indisponibilités | `/gestion/indisponibilites` | `unavailabilities.create` |
| | Demandes d’aide | `/gestion/alertes` | `driver-alerts.manage` |
| Administration | Utilisateurs | `/gestion/utilisateurs` | `users.manage-roles` (admin) |
| | Outils | `/gestion/outils` | `tooling.access` (admin) |
| | Communes | `/gestion/communes` | `municipalities.manage` (agent et admin ; certains onglets admin seulement) |

Toutes ces pages suivent le schéma « liste filtrée par le backend + panneau piloté par l’URL » décrit dans les
[conventions](conventions.md#pages-de-gestion--liste-et-panneau).

## Compteurs de la barre latérale

[`QueueCountProvider`](../src/backoffice/QueueCountProvider.jsx) charge les compteurs des entrées qui ont un `badge`
([`lib/navCounts.js`](../src/lib/navCounts.js)) : réservations à traiter, Collège à décider, demandes à examiner,
demandes d’aide en cours (en rouge). Chacun n’est chargé qu’avec la permission de sa page et reprend le chiffre de
cette page. Un seul minuteur : relus toutes les 60 s (onglet visible), au retour sur l’onglet et après une action
(`refreshCount()`). Un compteur en erreur est simplement absent.

## Cycle de vie d’une réservation

C’est ce que l’agent fait avancer. Les règles sont celles du backend ; le front les reflète
([`lib/queue.js`](../src/lib/queue.js), `agentActions`) pour ne proposer que les actions possibles.

```
en_attente ──approve──▶ approuve ──assign (chauffeur + véhicule)──▶ confirme
     │  ▲                                                        (automatique quand
     ▼  │ conflit résolu                                          tout est affecté)
 en_conflit
Depuis un statut actif : reject ──▶ refuse ;  cancel ──▶ annule
```

- **Écoles et personnel communal** : approbation et affectation automatiques, sans Collège.
- **CPAS, ASBL et externes** : une décision favorable du **Collège** est exigée avant d’approuver. Le front lit cette
  règle dans `organization.rules.council_required` (`needsCouncilDecision`).
- **Trajet passé** (date avant aujourd’hui à Bruxelles) : consultation seulement. Chaque nuit, le backend annule les
  réservations non confirmées dont le trajet est passé.
- **Trajet commencé** (le chauffeur a signalé son départ, `trip_started_at`) : plus de modification, d’affectation ni
  d’annulation. Un départ signalé par erreur s’annule dans le Planning.
- Motif obligatoire pour refuser ou annuler ; `Idempotency-Key` sur l’annulation et l’affectation.

## Tableau de bord

[`DashboardPage`](../src/pages/backoffice/DashboardPage.jsx), du plus urgent au plus lointain :

- **Bandeau** : la journée en une phrase, heure de mise à jour, actions rapides (dont « Traiter les réservations » avec
  le nombre à traiter), encart « Maintenant » (bus en route, pas encore partis, prochain départ) ;
- **Demandes d’aide** en cours ;
- **À faire** : seulement ce sur quoi l’agent peut agir (`ToProcessTiles`), « Tout est à jour » sinon ;
- **À surveiller** : passagers à confirmer par le demandeur, indisponibilités du jour, véhicules désactivés, permis
  qui expirent (`WatchList`) ;
- **Frise du jour** par bus (`DayTimeline`) et trajets du jour avec leur avancement réel (`TodayTrips`) ;
- **7 prochains jours** en histogramme (`WeekChart`), avec l’export Excel.

Chiffres lus dans `GET /dashboard`, avancement réel dans `GET /trip-progress` (repli sur l’horaire en cas d’échec).
Rechargés toutes les 60 s sans effacer l’affichage. Règle : tout élément mène à l’endroit où agir si le compte a la
permission de la page visée, sinon il reste en texte.

## Réservations (file de traitement)

[`ReservationsQueuePage`](../src/pages/backoffice/ReservationsQueuePage.jsx) : la page de travail principale de
l’agent.

**Files** (`?file=`, [`lib/queue.js`](../src/lib/queue.js)), en deux groupes de pastilles :

| Groupe | File | Contenu |
| --- | --- | --- |
| À faire | `a-traiter` (défaut) | En attente et en conflit ; sous-filtre `?statut=en-attente|en-conflit` |
| | `college` | En attente ou en conflit, qui attendent la décision du Collège (`council=a_decider`) |
| | `a-affecter` | Approuvées sans chauffeur ou sans véhicule (`unassigned=1`) |
| Suivi | `confirmees` | Confirmées |
| | `passagers` | Trajets actifs des 14 prochains jours dont le demandeur n’a pas confirmé les passagers |

Filtres communs : `?periode=` (à venir par défaut), `?organisation=` (recherche côté backend, jamais toutes les
organisations chargées), `?q=`. Tous les compteurs des pastilles viennent d’un seul appel
(`GET /reservations/counts`).

**Liste** : lignes compactes groupées par jour (en-têtes collants), 15 par page avec « Charger plus ». Chaque ligne
montre l’heure, l’urgence et des repères (Collège, affectation manquante).

**Détail** (`?reservation=id`) : à côté de la liste en grand écran, dans un panneau glissant sur mobile
(`ReservationPanel`). On y trouve un bandeau « Prochaine étape » et les actions permises (approuver, refuser,
affecter, confirmer, annuler, modifier). On y voit aussi les conflits ouverts avec l’action qui les règle
(`ConflictCard` ; frise des deux occupations pour un chevauchement), la décision du Collège (`DecisionSection`), les
documents, la liste des passagers et un lien vers le Planning. Après une action, la réservation suivante s’ouvre
automatiquement. Le détail des voisines est préchargé pour passer de l’une à l’autre sans attente.

**Affectation** (`AssignForm`) : chauffeurs et véhicules avec leur disponibilité calculée par le backend pour ce
trajet. Deux affectations simultanées le même jour : la seconde reçoit un 409 « réessayez dans un instant », affiché
tel quel.

**Raccourcis clavier** (grand écran, [`lib/shortcuts.js`](../src/lib/shortcuts.js)), configurables, réglages gardés
dans le `localStorage` : `j` / `k` (ou flèches) suivante / précédente, `a` approuver, `r` refuser, `e` affecter, `c`
confirmer, `d` décision du Collège, `m` modifier, `?` aide, Échap pour fermer. Ignorés pendant une saisie ou quand une
fenêtre est ouverte (`useShortcuts`).

### Réservations encodées par un agent

Boutons « Nouvelle réservation » et « Nouvelle série » de la file (demande reçue par téléphone) :
`/gestion/reservations/nouvelle` et `/gestion/series/nouvelle` (`reservations.create`).

1. **Pour qui ?** (`AgentRequesterStep`) : organisation par recherche, puis demandeur parmi ses membres (l’agent par
   défaut, envoyé dans `requested_by_user_id`).
2. L’assistant habituel en mode `agent`, **sans le préavis de 15 jours** (date minimale : aujourd’hui ; le backend le
   note dans l’historique).
3. Retour à la file avec un message (et le bilan pour une série).

**Modification par un agent** : `/gestion/reservations/:id/modifier?retour=…` (même assistant, organisation en
lecture seule), pour régler un conflit ; retour à la file avec ses filtres.

## Planning

[`PlanningPage`](../src/pages/backoffice/PlanningPage.jsx) (lecture seule), tout l’état dans l’URL :

- **Vue semaine** (défaut, `?semaine=` un lundi) : 5 colonnes du lundi au vendredi (`PlanningWeek`). Sous 640 px, un
  jour à la fois avec des onglets (`?jour=`).
- **Vue liste** (`?vue=liste&du=&au=`) : jours qui ont des trajets, 31 jours au plus (limite du backend), 4 semaines
  par défaut.
- **Filtres** : statuts actifs ou tous (`?statuts=tous`), `?vehicule=`, `?chauffeur=`, `?organisation=`.
- **Cartes de trajet** (`PlanningTripCard`) : heures départ – retour, destination, statut s’il n’est pas « Confirmé »,
  badges d’avancement (« En route ») et de compte rendu.
- **Détail** (`?trajet=id`, `PlanningTripDetails`) : disponibilités des chauffeurs et des véhicules, étapes signalées
  par le chauffeur avec une petite carte (en rouge si une étape est loin du lieu prévu), annulation de la dernière
  étape (`CancelLastStepControl`), compte rendu du chauffeur, que l’agent peut saisir ou corriger.
- **Export Excel** en tâche de fond : `POST /planning/exports`, suivi toutes les 2 s jusqu’à la fin, puis
  téléchargement.

`GET /planning` n’est pas paginé et renvoie des heures locales ; le front envoie toujours la liste des statuts voulus.

## Décisions du Collège

[`CollegePage`](../src/pages/backoffice/CollegePage.jsx). Le Collège n’a pas de compte : un agent encode le résultat
de la séance.

- Onglets `?onglet=a-decider|approuvees|refusees` avec leur nombre, lignes compactes groupées par jour de trajet
  (urgence, état « Aucune décision » ou « Décision reportée »).
- Panneau `?reservation=id` : résumé, encodage de la décision (`DecisionForm` ; confirmation pour un refus),
  délibération et documents.
- **Refusée** : la réservation est refusée automatiquement (motif = notes). **Approuvée** : les conflits de
  dérogation horaire sont levés, mais la réservation reste à approuver ; le panneau reste ouvert sur « Prochaine
  étape : approuver la réservation ». Dans les deux cas, une délibération PDF est générée et le demandeur prévenu.
- Écoles et personnel communal : décision facultative, proposée seulement pour une dérogation horaire (départ trop
  tôt, retour trop tard, durée dépassée) ; jamais bloquante.
- Trajet passé : plus de nouvelle décision, seules les notes restent modifiables.

## Demandes

[`RequestsPage`](../src/pages/backoffice/RequestsPage.jsx) : demandes d’adhésion à une organisation et demandes de
création d’organisation, envoyées depuis l’[espace usager](espace-usager.md#mes-organisations).

- Files `?file=adhesions|organisations`, statut `?statut=a-traiter|approuvees|refusees|toutes`, tri
  `?tri=anciennete|recentes|confiance`, type `?type=` (nouvelles organisations), recherche `?q=`.
- Une demande en attente depuis plus de 7 jours est signalée.
- Panneau `?demande=id` : détail, demandeur, **score de confiance** calculé par le backend (`ConfidenceScore` : couleur
  selon `confidence_level`, raisons et alertes affichées telles quelles, aucun seuil dans le front), justificatif.
  L’alerte « Rôle déjà tenu » (second responsable) est mise en évidence.
- **Approuver** (confirmation qui annonce l’effet) ou **Refuser** (motif obligatoire) ; le demandeur est notifié.

## Organisations

[`OrganizationsManagementPage`](../src/pages/backoffice/OrganizationsManagementPage.jsx) : liste filtrée, triée et
paginée par le backend (recherche, type, bannies, tri par nom, quota ou activité). Panneau `?organisation=id` :
coordonnées, type (avec confirmation de l’effet sur les règles), quota de l’année (0 = aucune réservation possible),
membres, réservations, justificatif, bannissement (admin) avec l’option d’annuler les réservations à venir.
`?organisation=nouvelle` pour en créer une.

## Documents

[`DocumentsPage`](../src/pages/backoffice/DocumentsPage.jsx) : documents officiels (feuilles de route, délibérations,
plannings, exports), sans les justificatifs.

- Filtres par le backend : type en pastilles `?type=`, recherche `?q=`, période `?du=&au=` (raccourcis Aujourd’hui,
  Cette semaine, Ce mois), `?page=`.
- Titres parlants (`documentTitle`) : semaine du planning, période d’un export, véhicule et jour d’une feuille de
  route, décision d’une délibération.
- Panneau `?document=id` : fiche, aperçu du PDF en grand écran, Ouvrir / Télécharger, lien vers la réservation ou le
  Planning, régénération d’une délibération.
- **Générer une feuille de route** (`GenerateRouteSheetModal`) : un jour et un véhicule, ou une période.

## Flotte

Trois pages construites sur le même modèle : cartes ou lignes cliquables, panneau piloté par l’URL, formulaire commun
d’ajout et de modification, désactivation confirmée dans une `Modal`.

- **Véhicules** ([`VehiclesPage`](../src/pages/backoffice/VehiclesPage.jsx)) : `?vehicule=id|nouveau`, `?page=`. En
  service d’abord.
- **Chauffeurs** ([`DriversPage`](../src/pages/backoffice/DriversPage.jsx)) : `?chauffeur=id|nouveau`. Un chauffeur est
  rattaché à un compte existant, choisi par recherche (`AccountPicker`). Le badge de permis signale un permis expiré
  ou qui expire bientôt.
- Sur chaque carte, **l’état du jour** (`FleetDayStatus`, `useFleetToday`) : indisponible, en route, nombre de
  trajets, ou libre, avec un lien vers le Planning du jour filtré.
- **Indisponibilités** ([`UnavailabilitiesPage`](../src/pages/backoffice/UnavailabilitiesPage.jsx)) : onglets
  `?periode=a-venir|passees|annulees` (« En cours et à venir », « Passées », « Annulées ») avec leur nombre, filtres
  `?chauffeur=` et `?vehicule=`. Le backend filtre, trie et pagine. `?indisponibilite=id|nouvelle` ; historique des
  modifications replié dans le panneau. Les heures sont des heures de Bruxelles sans fuseau, comparées aux
  réservations par le backend pour détecter les conflits.

## Demandes d’aide

[`AlertsPage`](../src/pages/backoffice/AlertsPage.jsx) : demandes envoyées par les chauffeurs depuis « Ma journée »
(voir [espace chauffeur](espace-chauffeur.md#demande-daide)).

- Onglets `?statut=en-cours|cloturees|toutes` ; en cours : ouvertes d’abord, puis prises en charge.
- Temps écoulé en direct : « Sans réponse depuis N min » pour une demande ouverte, en gras à partir de 10 min.
- Page d’une demande (`/gestion/alertes/:alertId`) : carte du lieu, message, trajet, chauffeur et bus ; « Prendre en
  charge » (le chauffeur est prévenu) et « Clôturer » (note obligatoire).
- Relues toutes les 60 s : une nouvelle position envoyée par le chauffeur apparaît sans recharger.

## Administration

### Utilisateurs (admin)

[`UsersPage`](../src/pages/backoffice/UsersPage.jsx) : liste `?q=&role=&statut=actifs|desactives&page=`, pastilles de
rôle avec leur nombre (`meta.role_counts`). Panneau `?utilisateur=id` (relu à chaque ouverture) ou
`?utilisateur=nouveau` :

- informations, rôles (au moins un ; son propre rôle admin est verrouillé, le backend refuse de retirer le dernier
  admin) ;
- avertissement si le rôle Chauffeur ne correspond pas au profil chauffeur ;
- envoi d’un lien de réinitialisation du mot de passe ;
- désactivation ou réactivation ;
- données personnelles (RGPD) : export et anonymisation (voir [fonctions communes](fonctions-communes.md#rgpd)) ;
- lien « Diagnostic du compte » vers les Outils.

Création : mot de passe provisoire (Générer, Copier), le backend envoie l’email de vérification. Après la création ou
l’enregistrement des informations ou des rôles, le panneau reste ouvert sur le compte relu ; désactiver, réactiver ou
anonymiser le ferme.

### Communes

[`MunicipalitiesPage`](../src/pages/backoffice/MunicipalitiesPage.jsx) : une seule commune est active et ses règles
s’appliquent aux réservations. Résumé de la commune active, puis onglets `?onglet=` :

| Onglet | Qui | Contenu |
| --- | --- | --- |
| Règles | Agent et admin | Dépôt, distance maximale de prise en charge et du trajet (1 à 500 km, 50 par défaut), avec la carte de la zone (`PickupZoneMap`) |
| Localités | Agent et admin | Localités de la commune (score de confiance des demandes) : ajout, renommage, désactivation, synchronisation GeoNames |
| Calendrier | Agent et admin | Fermetures communales et vacances scolaires ; les jours fériés belges sont calculés par le backend |
| Espace chauffeur | Admin | Contact de garde, application de navigation, délai du premier départ |
| Planning hebdomadaire | Admin | Envoi automatique du planning (jour, heure, interrupteur, responsable) |
| Collège | Admin | Composition du Collège pour les délibérations |
| Autres communes | Admin | Ajout et activation d’une autre commune |

Seuls les champs modifiés sont envoyés ; le bouton est désactivé tant que rien n’a changé.

### Outils (admin)

[`ToolsPage`](../src/pages/backoffice/ToolsPage.jsx), onglets `?onglet=` :

| Onglet | Contenu |
| --- | --- |
| Santé | Contrôles du système (base, file d’attente, emails…), heure du dernier contrôle |
| Journal | Requêtes enregistrées par le backend, filtres dans l’URL (compte, résultat, méthode, code, période, flow), détail d’une entrée, purge |
| File d’attente | Jobs en échec : détail, relance, suppression (confirmées) |
| Comptes | Diagnostic d’un compte : rôles, permissions effectives, activité |
| Système | Base, règles, architecture, flows métier, catalogue des routes de l’API avec recherche |

Le contrôle de santé est lent et limité par le backend (10 appels par minute) : il n’est jamais relancé en boucle.
