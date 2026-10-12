# « Ma journée » (chauffeur) : points faibles et pistes de solution

Revue faite le 06/10 à partir du code front (`DriverJourneyPage`, `components/driver/journey/*`, `useDriverDay`,
`lib/driverJourney.js`, `lib/navigation.js`, `lib/devicePosition.js`) et de `docs/driver_journey.md` (backend).
Le code backend n'a pas été relu : les points qui en dépendent sont signalés « à vérifier ».

Ce qui est solide et à garder : le modèle « faits + source » (`trip_events`), les gros boutons avec une seule étape
active, la position qui ne bloque jamais l'appui, l'idempotence (double appui, `Idempotency-Key`), le compte rendu
automatique à la dernière arrivée, le circuit de l'aide, la navigation réglable par commune.

Les points sont classés par priorité (1 = le plus important).

---

## 1. Aucun fonctionnement hors réseau

**Constat.** Sans réseau, `recordTripEvent` échoue, une erreur s'affiche et rien n'est gardé. Le chauffeur doit
réappuyer plus tard : l'étape est alors enregistrée avec l'heure du renvoi, et le compte rendu automatique (heures
réelles) devient faux.

**Solution proposée** (déjà esquissée dans « Idées à implémenter » de `CLAUDE.md`) :
1. File d'attente persistante sur le téléphone (IndexedDB), liée au chauffeur, vidée après acceptation et à la
   déconnexion. C'est une exception à la règle « jamais de `localStorage` pour des données métier » : à valider à deux.
2. Chaque action garde sa **propre heure** (`recorded_at`) et sa position ; le backend doit accepter `recorded_at`
   (à encadrer : pas dans le futur, pas plus ancien que le délai du compte rendu).
3. Renvoi automatique au retour du réseau (événement `online` + nouvel essai à intervalle croissant), dans l'ordre
   des étapes, avec la même `Idempotency-Key` par action.
4. Interface : l'étape apparaît cochée tout de suite avec un état « en attente d'envoi » (icône + texte), jamais
   confondue avec « enregistrée ». Un bandeau indique le nombre d'actions en attente.
5. Délai du lendemain 12:00 : accepter une action faite à temps hors ligne mais reçue en retard (confiance dans
   l'horloge du téléphone).
6. Plus tard : PWA installable pour consulter les missions du jour sans réseau.

**Effort** : élevé (front + backend). À découper en PR : file + `recorded_at` d'abord, PWA ensuite.

---

## 2. La lecture de la position retarde l'envoi

**Constat.** `JourneyStepButtons.record()` attend `readDevicePosition()` (jusqu'à 8 s) **avant** le POST. Si le
backend horodate à la réception (à vérifier dans `TripProgressService::record`), l'étape est enregistrée en retard
d'autant, et le bouton reste sur « Envoi… » sans explication.

**Solution proposée :**
1. Prendre l'heure au moment de l'appui côté client (`pressed_at`, ISO) et l'envoyer avec l'étape ; le backend la
   valide (cohérente avec l'heure serveur, tolérance de quelques minutes) et l'utilise comme heure de l'étape. Ce
   champ est le même que `recorded_at` du point 1 : les deux se font ensemble.
2. Réduire le délai de position pour les étapes (3 à 4 s au lieu de 8 s) : une position moins précise vaut mieux
   qu'un appui en retard.
3. Alternative sans toucher au backend : enregistrer l'étape tout de suite sans position, puis la compléter par un
   `PATCH` (comme `…/alerts/{id}/position`). Plus lourd côté backend.
4. Afficher « Localisation… » puis « Envoi… » pour que le chauffeur comprenne l'attente.
5. Position de l'aide : mettre `maximumAge` à 0 à 5 s pour `createDriverAlert` (aujourd'hui 30 s, trop vieux pour
   une alerte).

---

## 3. Pas de rafraîchissement automatique de la page

**Constat.** `useDriverDay` charge une fois (et au changement de jour). `useAutoRefresh` existe mais n'est pas
utilisé ici. Une confirmation par un agent, une correction d'étape ou une annulation n'apparaît pas tant que le
chauffeur ne recharge pas ; une action sur un état périmé finit en 422 peu lisible sur le terrain.

**Solution proposée :**
1. Brancher `useAutoRefresh` (60 s, onglet visible, retour sur l'onglet) sur `dayData.reload`, **sans** repasser par
   le `Loader` (actualisation silencieuse : ne pas vider `data` pendant un rechargement automatique).
2. Ne pas recharger pendant qu'une modale (Fin de mission, Aide) ou un envoi est ouvert.
3. Les `recorded` locaux restent prioritaires sur le rechargement tant que le backend n'a pas rattrapé la réponse
   (déjà le cas), puis s'effacent.
4. Traduire les 422 attendus (« Étape attendue : … », mission non confirmée) en message d'action : « La mission a
   changé. La page vient d'être actualisée. » puis recharger.

---

## 4. Pas de correction d'une erreur d'appui

**Constat.** Un appui par erreur sur « Départ » (téléphone sur support, bus qui bouge) est irréversible côté
chauffeur : seul un agent corrige.

**Solution proposée :**
1. **Annulation à court terme** : après un appui, un toast « Parti 09:02 — Annuler » pendant 30 s. Backend :
   `DELETE /reservations/{id}/trip-events/{type}` autorisé au chauffeur pour sa **dernière** étape, dans les 2 minutes
   suivant l'enregistrement, tant que l'étape suivante n'existe pas (source `chauffeur`, tracé dans l'historique).
2. Sans backend : **confirmation en deux temps** pour les départs (appui, puis « Confirmer » dans un bandeau de 5 s).
   Plus lent pour le chauffeur : à réserver aux étapes sensibles ou à proposer en option.
3. Boutons espacés et éloignés des bords de l'écran ; le bouton actif ne change jamais de place entre deux étapes.
4. À défaut : un lien « Signaler une erreur d'étape » qui ouvre une demande d'aide préremplie pour l'agent.

---

## 5. Position ponctuelle seulement

**Constat.** Une page web ne lit pas le GPS en arrière-plan : 4 positions par trajet, et le suivi tombe si l'écran
s'éteint, si un appel arrive ou si le chauffeur passe à l'application de navigation (usage pourtant normal).

**Solution proposée :**
1. À court terme, **assumer et expliquer** : un texte clair « gardez cette page ouverte », le wake lock actif par
   défaut (déjà fait), et un indicateur visible quand le verrou est perdu (aujourd'hui le `active` du hook n'est pas
   affiché).
2. Relever la position à la **reprise de la page** (`visibilitychange`) pendant un trajet en cours, et l'envoyer
   comme point de passage (`source = chauffeur`), pour avoir au moins une trace au retour de l'application de
   navigation.
3. Moyen terme : application installée ou PWA avec suivi en continu (`source = gps`, déjà prévu dans le modèle),
   éventuellement géorepérage pour détecter l'arrivée automatiquement. Les écrans actuels n'auraient pas à changer.
4. Rappeler dans l'interface que le suivi continu n'existe pas encore, pour ne pas faire croire à l'agent qu'il voit
   le bus en direct.

---

## 6. Chargement lourd (4 requêtes par jour affiché)

**Constat.** `useDriverDay` lance 3 requêtes de réservations (jour, jour précédent, jour suivant) puis 1 requête
d'avancement, uniquement pour activer les flèches ← →.

**Solution proposée :**
1. Backend : un endpoint dédié `GET /driver-journey/day?date=` qui renvoie missions + avancement + jours voisins en
   un appel (cohérent avec la règle du projet : le travail de filtrage et de recherche va côté backend).
2. Sans backend : charger les jours voisins **après** l'affichage du jour (requête secondaire, non bloquante), et
   n'en lancer qu'une avec `per_page=1`.
3. Avec l'auto-actualisation du point 3, ne recharger que le jour affiché, pas les voisins (à relire seulement au
   changement de jour).

---

## 7. Compte rendu automatique : passagers pré-remplis

**Constat.** La modale « Fin de la mission » pré-remplit les passagers avec le prévu. Un chauffeur pressé valide sans
corriger : le compte rendu « réalisé » est faux et, comme il est créé automatiquement, personne ne le revérifie.

**Solution proposée :**
1. Ne pas pré-valider : champs vides ou, au minimum, un résumé « Prévu : 18 enfants, 2 adultes » à côté, et un
   bouton « C'est conforme » distinct de la saisie d'un autre nombre.
2. Garder la valeur « confirmée sans modification » en base (`passengers_confirmed_as_planned`) : l'agent voit ce
   qui a été saisi et ce qui est resté tel quel.
3. Signaler à l'agent (Planning) les écarts significatifs entre prévu et réel, comme pour les étapes loin du lieu
   prévu.
4. Le compte rendu reste corrigeable par l'agent jusqu'à la clôture (déjà le cas).

---

## 8. Aucun test automatisé

**Constat.** Pas de fichier de test dans le projet. Or `stepStatus`, `currentMissionId`, `readJourneyDay`,
`navigationLink`, `stepDistanceText` sont des fonctions pures, faciles à tester.

**Solution proposée :**
1. Ajouter Vitest (compatible Vite) uniquement pour `src/lib/*`, sans toucher aux composants au début.
2. Premiers cas : étape suivante selon `progress`, trajet courant avec plusieurs missions, jour invalide dans l'URL,
   lien de navigation (Android / web, lieu sans coordonnées, `web_from`), formatage des distances.
3. Brancher `npm test` sur la CI de la PR quand elle existe.
4. Rappel de la règle n°6 du projet : tester aussi les règles métier **par leur effet** sur l'API (étape refusée hors
   fenêtre, mission non confirmée…), en annulant les données de test ensuite.

---

## 9. Détails d'interface

- **Détection Android par `userAgent`** (`isAndroid`) : fragile. Garder le `geo:` mais prévoir un repli si
  l'application ne s'ouvre pas (le lien `web` reste proposé à côté, en petit).
- **iPhone** : `geo:` n'existe pas, on retombe sur le lien web. Prévoir un lien `maps://` / Apple Plans dans le
  catalogue des applications de navigation si des chauffeurs utilisent un iPhone.
- **Erreurs d'étape** affichées en `Alert` sous les boutons, sans lien visuel avec le bouton concerné : faire
  défiler jusqu'à l'alerte et la relier avec `aria-describedby` (accessibilité).
- **Contraste et état « en attente de confirmation »** : le message « Mission pas encore confirmée » est discret ; le
  mettre en tête de carte pour que le chauffeur ne cherche pas pourquoi les boutons sont éteints.
- **Fin de mission** : après le compte rendu automatique, proposer un lien vers le trajet suivant du jour.

---

## Ordre de travail suggéré

1. Points 2 et 1 (heure de l'appui, puis file hors ligne) : même champ `recorded_at`, à faire ensemble.
2. Point 3 (actualisation automatique) : petit, utile tout de suite.
3. Point 4 (annulation courte) puis point 7 (passagers).
4. Points 6, 8 et 9 au fil de l'eau ; point 5 selon la décision d'une application installée.

Rappel des règles du dépôt : plan et questions de décision avant de coder, branche dédiée depuis `main`, récap puis
validation avant commit et avant PR.
