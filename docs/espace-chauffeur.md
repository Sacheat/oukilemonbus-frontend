# Espace chauffeur (`/chauffeur`)

Pour les chauffeurs (`RequireRole` `chauffeur`). Navigation en haut (`TopNavLayout`, menu `DRIVER_NAV`), pensée pour
le **téléphone**, souvent posé sur un support dans le bus.

| Menu | URL | Permission | Page |
| --- | --- | --- | --- |
| Mes missions | `/chauffeur` | — | [`DriverMissionsPage`](../src/pages/driver/DriverMissionsPage.jsx) |
| Ma journée | `/chauffeur/journee` | `trip-progress.record` | [`DriverJourneyPage`](../src/pages/driver/DriverJourneyPage.jsx) |
| Feuilles de route | `/chauffeur/feuilles-de-route` | `documents.view` | [`DriverRouteSheetsPage`](../src/pages/driver/DriverRouteSheetsPage.jsx) |
| Indisponibilités | `/chauffeur/indisponibilites` | `unavailabilities.view` | [`DriverUnavailabilitiesPage`](../src/pages/driver/DriverUnavailabilitiesPage.jsx) |

Détail d’une mission : `/chauffeur/missions/:missionId` ([`DriverMissionPage`](../src/pages/driver/DriverMissionPage.jsx)).

L’espace est en lecture seule, sauf les étapes du trajet, le compte rendu et la demande d’aide. Le backend ne renvoie
au chauffeur que **ses** missions ; le détail d’une mission d’un autre chauffeur répond 403.

## Mes missions

Bannière avec le bouton « Ma journée », comptes rendus à faire en tête (`PendingReports`), puis les missions.

- Onglets `?periode=a-venir|passees` et `?page=`. À venir : à partir d’aujourd’hui, du plus proche au plus lointain ;
  passées : jusqu’à hier, de la plus récente à la plus ancienne.
- Seules les missions approuvées et confirmées sont affichées : le chauffeur est notifié d’une annulation ou d’un
  refus, et le détail d’une mission le dit.
- « Aujourd’hui » mis en avant en grandes cartes (`MissionCard`), puis les autres jours en lignes compactes groupées
  par jour (`MissionDays`, `MissionRow`).
- Le compte rendu est joint à chaque mission par le backend (`include=trip_report`) : pas de requête séparée.

### Détail d’une mission

Horaires et adresses complètes, boutons d’itinéraire, carte avec la route réelle et ses instructions (`RouteSteps`),
passagers, véhicule, liste des passagers jointe par le demandeur, compte rendu.

- **Itinéraires** (`RouteButtons`, [`lib/navigation.js`](../src/lib/navigation.js)) : l’application de navigation est
  choisie par la commune (OpenStreetMap par défaut). Sur Android, un lien `geo:` ouvre l’application installée ;
  ailleurs, un lien web s’ouvre dans un onglet nommé, réutilisé d’une fois à l’autre.
- **Route** : calculée par le backend à la première ouverture (`GET /reservations/{id}/route`), puis gardée. En cas
  d’échec, la carte garde une ligne à vol d’oiseau, sans message.
- **Distance** : affichée en aller-retour (le backend donne la distance de l’aller).
- **Compte rendu** : en tête une fois l’heure de départ passée (il est attendu), en bas avant (« vous pourrez
  confirmer à partir de… »). Mission du jour : bouton vers « Ma journée ».

## Ma journée

Écran de conduite : un jour par page (`?jour=`, aujourd’hui par défaut), une carte par trajet (`JourneyTripCard`).

- **Un seul appel**, `GET /driver-journey/day?date=` (`useDriverDay`) : missions du jour, avancement, jours précédent
  et suivant qui ont des missions, réglages de la commune. Relu toutes les 60 s : un trajet modifié ou annulé par un
  agent apparaît sans recharger.
- **Écran allumé** : interrupteur qui demande au navigateur de ne pas mettre l’écran en veille (`useWakeLock`), redemandé
  au retour sur la page.

### Les étapes du trajet

Quatre boutons par trajet ([`lib/driverJourney.js`](../src/lib/driverJourney.js)) :

| Aller | Retour |
| --- | --- |
| Départ (`depart_aller`) → Arrivée (`arrivee_aller`) | Départ (`depart_retour`) → Arrivée (`arrivee_retour`) |

- Chaque appui est confirmé dans une fenêtre (`StepConfirmModal`), puis envoyé par
  `POST /reservations/{id}/trip-events`, avec la position du téléphone si le chauffeur l’accepte (`state` envoyée,
  refusée ou indisponible : l’étape est enregistrée dans tous les cas).
- Pendant 2 minutes après un appui, « Annuler cet appui » permet de corriger une erreur (double sécurité avec la
  confirmation). Au-delà, seul un agent peut annuler la dernière étape, depuis le Planning.
- La **dernière arrivée** demande les passagers réellement transportés (`FinalArrivalModal`, pré-remplis avec le
  prévu) et crée le compte rendu « réalisé » avec les heures réelles des boutons.
- Dès la première étape, la réservation est figée pour tout le monde (plus de modification, d’affectation ni
  d’annulation).
- Côté agent, les étapes apparaissent dans le Planning (badge « En route », distance au lieu prévu) et dans le tableau
  de bord.

### Demande d’aide

Un seul bouton « Aide », collé en bas de l’écran, rattaché au trajet en cours (`HelpButton`) : panne, accident,
problème à bord.

- Deux gestes : « Aide » puis « Envoyer », avec un message facultatif et la position du téléphone.
- Envoyée avec un `Idempotency-Key` ; si une demande est déjà ouverte, le backend la renvoie au lieu d’en créer une
  seconde.
- Agents, admins et contact de garde de la commune sont prévenus tout de suite (notification urgente). La demande en
  cours reste affichée en bandeau (`OpenAlertBanner`) ; le chauffeur est prévenu de la prise en charge et de la
  clôture.
- Côté agent : page [Demandes d’aide](gestion.md#demandes-daide).

## Compte rendu de trajet

Pour chaque trajet confirmé, le chauffeur déclare s’il a été **réalisé** (heures réelles, passagers réels) ou **non
réalisé** (remarque obligatoire, qui prévient les agents). `PUT /reservations/{id}/trip-report` : la même requête crée
puis corrige.

- Possible de l’heure de départ jusqu’au **lendemain 12:00** ; personne ne peut le faire avant l’heure de départ.
- Après ce délai, seul un agent peut le saisir ou le corriger (depuis le Planning).
- Badges ([`lib/tripReports.js`](../src/lib/tripReports.js), `TripReportBadge`) : « Réalisé », « Non réalisé »,
  « À confirmer » pour le chauffeur pendant son délai ; côté agent « Compte rendu attendu », puis « Sans compte rendu »
  une fois le délai dépassé. Aucun badge tant que les comptes rendus ne sont pas chargés, plutôt qu’un faux
  « À confirmer ».
- Le formulaire (`TripReportForm`) est partagé entre le chauffeur et l’agent ; le résumé dit qui l’a rempli
  (« Déclaré par » ou « Saisi par »).

## Feuilles de route

Pour une semaine (`?semaine=`, la semaine en cours par défaut) :

1. **Ma feuille de la semaine** : ses missions confirmées et le PDF à imprimer, avec des cases à remplir à la main
   (`GET /route-sheets/driver?week=`, généré à la demande donc toujours à jour). Sert de secours sur papier si le
   téléphone ne fonctionne pas.
2. **Feuilles officielles du véhicule** : feuilles journalières par véhicule (carnet de bord) qui contiennent une de
   ses missions, paginées (`?page=`).

Les distances y sont en aller-retour (colonne « Km A/R »).

## Indisponibilités

Lecture seule : seuls les agents en déclarent. Onglets en cours et à venir, passées (`?periode=&page=`), triés et
paginés par le backend ; les annulées ne sont pas affichées au chauffeur.
