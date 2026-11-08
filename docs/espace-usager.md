# Espace usager (`/espace`)

Pour les membres et les responsables d’organisations (rôle `user`). Navigation en haut (`TopNavLayout`, menu
`USER_NAV`), pensée d’abord pour le téléphone.

| Menu | URL | Permission | Page |
| --- | --- | --- | --- |
| Accueil | `/espace` | — | [`UserHomePage`](../src/pages/user/UserHomePage.jsx) |
| Mes déplacements | `/espace/deplacements` | `reservations.view` | [`TripsPage`](../src/pages/user/TripsPage.jsx) |
| Nouvelle réservation | `/espace/reservations/nouvelle` | `reservations.create` | [`NewReservationPage`](../src/pages/user/NewReservationPage.jsx) |
| Récurrences | `/espace/recurrences` | `reservations.view`, et membre d’une école ou du personnel communal | [`RecurrencesPage`](../src/pages/user/RecurrencesPage.jsx) |
| Mes organisations | `/espace/organisations` | `organizations.view` | [`OrganizationsPage`](../src/pages/user/OrganizationsPage.jsx) |
| Documents | `/espace/documents` | `documents.view` | [`DocumentsPage`](../src/pages/user/DocumentsPage.jsx) |

Pages hors menu : détail d’un déplacement (`/espace/deplacements/:id`), modification (`…/:id/modifier`), nouvelle
série (`/espace/recurrences/nouvelle`), détail d’une série (`/espace/recurrences/:id`), rejoindre ou créer une
organisation (`/espace/organisations/rejoindre`, `…/creer`), détail d’une organisation (`/espace/organisations/:id`).

Qui peut faire quoi sur une réservation ([`lib/reservations.js`](../src/lib/reservations.js), le backend vérifie
aussi) : le **demandeur** ou un **responsable** de l’organisation, tant que la date du trajet n’est pas passée.

## Accueil

Bannière avec salutation, chiffres clés cliquables vers la liste filtrée (`StatTile`), prochain trajet présenté comme
un billet (`TripTicket`), liste « À faire » et activité récente (3 dernières notifications). Les appels partent en
parallèle.

« À faire » ([`lib/home.js`](../src/lib/home.js)) reprend, du plus urgent au moins urgent et 5 au plus : les trajets
en conflit, les passagers à confirmer d’ici 14 jours, les demandes en cours.

## Mes déplacements

Fil de suivi groupé par mois, avec un mini-calendrier du mois (`TripsCalendar`).

- Filtres dans l’URL : `?periode=a-venir|passes|tous`, `?statut=` (pastilles avec compteur, `StatusChips`),
  `?organisation=`. « À venir » = à partir d’aujourd’hui, du plus proche au plus lointain ; « Passés » = jusqu’à hier,
  du plus récent au plus ancien.
- « Charger plus » ajoute les 15 trajets suivants à la suite.
- `?apercu=id` ouvre un aperçu rapide dans un panneau (`TripPreview`), sans quitter la liste.

### Détail d’un déplacement

[`TripDetailPage`](../src/pages/user/TripDetailPage.jsx) : en-tête façon billet avec les actions (`TripHero`), chiffres
clés, suivi de la demande en étapes (`TripProgress`), informations, carte du trajet (`TripMap`), décision du Collège et
documents (`TripDocumentsCard`), liste des passagers (`PassengerListCard`).

| Action | Condition côté front |
| --- | --- |
| Modifier | Statut `en_attente` ou `en_conflit` |
| Confirmer les passagers | Réservation ni refusée ni annulée |
| Annuler (motif obligatoire) | Statut annulable, et trajet pas encore commencé (le chauffeur n’a pas signalé son départ) |

Toutes exigent d’être demandeur ou responsable, avec un trajet qui n’est pas passé.

## Réservation guidée

[`ReservationWizard`](../src/components/reservations/wizard/ReservationWizard.jsx) sert à la création, à la
modification par l’usager et, en mode `agent`, à la création et à la modification par un agent (voir
[gestion](gestion.md#réservations-encodées-par-un-agent)).

Étapes : **Trajet → Passagers → Vérification → Envoi** (`StepIndicator`).

1. **Trajet** : organisation, date, horaires, lieu de départ et destination (`LocationPicker` : lieux enregistrés,
   puis suggestions d’adresse ; une suggestion choisie est enregistrée par `POST /locations`). Le trajet est vérifié
   **en direct** pendant la saisie (`useTripCheck` → `POST /reservations/check-trip`) : préavis, week-end, distance,
   disponibilité, heures d’arrivée estimées, avec une mini-carte. Si cette route manque (404), le front se replie sur
   le preview avec des passagers provisoires.
2. **Passagers** : enfants et adultes, motif du déplacement. Le nombre est limité par `max_passengers` (places du plus
   grand bus actif) renvoyé par le backend.
3. **Vérification** : `POST /reservations/preview` dit ce que deviendra la demande (`DecisionBanner`) : bloquée, en
   conflit, approuvée automatiquement (écoles et personnel communal) ou examinée par la commune ; il propose le
   prochain créneau libre et annonce les dérogations (`PreviewResult`). En modification, encart « Vos changements »
   (avant → après).
4. **Envoi** : `POST /reservations` avec un header `Idempotency-Key`, réutilisé tant que le contenu envoyé est
   identique (pas de doublon si l’envoi est rejoué).

Un récapitulatif façon billet suit la saisie : à droite en grand écran (`RequestSummary`), dans une barre dépliable
sur mobile (`RequestSummaryBar`).

**Brouillon** : la saisie est gardée dans le `sessionStorage` ([`lib/drafts.js`](../src/lib/drafts.js)), liée au
compte, expirée après 12 h, effacée après l’envoi et à la déconnexion. À la reprise, une date déjà passée est vidée et
l’assistant reprend au plus à l’étape Passagers (la vérification est relancée).

**Modification** ([`EditReservationPage`](../src/pages/user/EditReservationPage.jsx)) : `PATCH /reservations/{id}`
(l’organisation ne change pas). Preview et check-trip reçoivent `reservation_id` pour que la réservation ne soit pas en
conflit avec elle-même. Le préavis de 15 jours ne s’applique qu’à la création ; si la date change, la nouvelle date
doit le respecter (le backend tranche, erreur 422 sur la date).

## Récurrences (séries)

Réservées aux **écoles et au personnel communal** (l’entrée de menu n’apparaît que pour leurs membres).

- **Liste** : `?etat=actives|arretees|toutes&page=`. Chaque série en billet avec ses jours de passage et la
  répartition de ses trajets par statut (`RecurrenceCard`, `StatusMix`).
- **Nouvelle série** : [`RecurrenceWizard`](../src/components/recurrences/wizard/RecurrenceWizard.jsx), étapes
  **Trajet → Calendrier → Passagers → Vérification**. `POST /recurrences/preview` donne l’aperçu de chaque date
  (mini-calendriers, `SeriesCalendar`), puis `POST /recurrences` (avec `Idempotency-Key`) crée la série et renvoie un
  rapport : trajets créés, dates ignorées (jour férié, fermeture communale, vacances scolaires) ou en échec, avec le
  motif (`CreationReport`).
- **Détail** : bandeau façon billet avec l’annulation de la série, chiffres clés, calendrier coloré par statut, carte,
  puis les trajets en ligne du temps (`?periode=`). Le résumé de la série vient du backend (`status_counts`,
  `next_trip_date`), il n’est pas recalculé à partir des trajets.

## Mes organisations

- **Liste** : appartenances (lues dans `/auth/me`) et demandes d’adhésion ou de création en cours, avec leur suivi en
  étapes (`RequestItem`). « Quitter » une organisation se fait depuis sa carte (`LeaveOrganizationModal`).
- **Rejoindre** ([`JoinOrganizationPage`](../src/pages/user/JoinOrganizationPage.jsx)) : recherche de l’organisation,
  rôle en pastilles, justification et justificatif ; récapitulatif à droite, puis écran de fin avec le suivi.
- **Créer** ([`CreateOrganizationRequestPage`](../src/pages/user/CreateOrganizationRequestPage.jsx)) : demande de
  création, examinée par la commune.
- **Détail** : bandeau, chiffres clés, informations et quota annuel (`QuotaGauge`). Pour un responsable : demandes
  d’adhésion en cours et gestion des membres (modifier le rôle, retirer).

Les demandes sont décidées par la commune, dans la page Demandes de [gestion](gestion.md#demandes).

## Documents

Documents des réservations de mes organisations (délibérations…) et mes justificatifs : liste paginée par le backend,
groupée par mois, filtre par type en pastilles avec compteur (`?type=&page=`), pastilles sans document masquées.
Ouverture et téléchargement en Blob (`DocumentRow`, `useDocumentFile`).
