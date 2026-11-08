# Architecture

Comment l’application démarre, comment une URL devient un écran, et comment une page obtient ses données.

## Démarrage

[`src/main.jsx`](../src/main.jsx) accroche React à la `<div id="root">` de `index.html` et emboîte trois niveaux :

```jsx
<StrictMode>
  <AuthProvider>              {/* session : qui est connecté, ses droits */}
    <NotificationsProvider>   {/* nombre de notifications non lues (cloche) */}
      <RouterProvider router={router} />
    </NotificationsProvider>
  </AuthProvider>
</StrictMode>
```

- **`AuthProvider`** relit la session au chargement (`GET /auth/me`) et la met à disposition de toute l’application
  par un Context (voir [auth-et-droits](auth-et-droits.md)).
- **`NotificationsProvider`** dépend de la session : il ne compte les notifications que pour un compte connecté et
  vérifié, et relit ce nombre toutes les 60 s.
- **`RouterProvider`** affiche la page qui correspond à l’URL.
- **`StrictMode`** (développement seulement) monte, démonte puis remonte chaque composant pour vérifier que les effets
  se nettoient. Certaines requêtes partent donc deux fois en développement, jamais en production.

Avant React, un petit script de `index.html` applique le thème clair ou sombre, pour éviter un flash au chargement
(voir [conventions](conventions.md#style-et-thème)).

## Routeur

Toutes les routes sont dans [`src/router.jsx`](../src/router.jsx), créées avec `createBrowserRouter` (mode data de
React Router). Les routes sont **imbriquées** : une route parente sans `path` sert à envelopper ses enfants, soit pour
vérifier un accès (garde), soit pour dessiner un cadre (layout).

```
(errorElement : RouteErrorPage, filet de sécurité si une page plante)
├─ /                       RootRedirect → espace du compte, ou /connexion
├─ RequireGuest            invités seulement (sinon renvoi vers son espace)
│   └─ PublicLayout        /connexion, /inscription, /mot-de-passe-oublie
├─ PublicLayout wide       /confidentialite (connecté ou non)
├─ PublicLayout            /verify-email, /reset-password (liens des emails)
├─ RequireAuth             connecté et email vérifié
│   ├─ RoleLayout          /compte, /notifications (dans le cadre de l’espace courant)
│   ├─ /espace     RequireRole user                → TopNavLayout (menu USER_NAV)
│   ├─ /chauffeur  RequireRole chauffeur           → TopNavLayout (menu DRIVER_NAV)
│   └─ /gestion    RequireRole admin, agent_communal → SidebarLayout (menu BACKOFFICE_NAV)
└─ *                       NotFoundPage
```

Dans chaque espace, chaque page est en plus protégée par `RequirePermission` (la permission de la page, par exemple
`vehicles.update` pour `/gestion/vehicules`).

Les chemins sont en français, sauf `/verify-email` et `/reset-password`, imposés par les liens des emails du backend.

### Layouts

Un layout dessine le cadre d’un espace une seule fois ; la page de l’URL s’affiche dans son `<Outlet />`.

| Layout | Utilisé par | Contenu |
| --- | --- | --- |
| [`TopNavLayout`](../src/layouts/TopNavLayout.jsx) | `/espace`, `/chauffeur` | Navigation en haut (menu repliable sur mobile), sélecteur d’espace, cloche, thème, menu du compte, tutoriel |
| [`SidebarLayout`](../src/layouts/SidebarLayout.jsx) | `/gestion` | Barre latérale groupée en sections avec compteurs (`QueueCountProvider`), mêmes éléments |
| [`RoleLayout`](../src/layouts/RoleLayout.jsx) | `/compte`, `/notifications` | Choisit le layout de l’espace où se trouve l’utilisateur |
| [`PublicLayout`](../src/layouts/PublicLayout.jsx) | Pages publiques | Carte centrée ; `wide` pour une page de lecture |

Les menus viennent de [`src/navigation.js`](../src/navigation.js) : chaque entrée déclare sa permission et, pour
`/gestion`, la clé de son compteur (`badge`).

### Pages chargées à la demande

Toutes les pages connectées sont déclarées avec `lazyPage` ([`src/lib/lazyPage.js`](../src/lib/lazyPage.js)), qui
enveloppe `React.lazy` et un `import()` dynamique :

```js
const VehiclesPage = lazyPage(() => import('./pages/backoffice/VehiclesPage'), 'VehiclesPage')
```

Au build, Vite crée un fichier par page, téléchargé la première fois qu’on l’ouvre. Pendant ce téléchargement, le
`<Suspense>` du layout affiche un chargement à la place de la page, sans faire disparaître le menu. Connexion,
inscription et pages d’erreur restent dans le fichier de départ, puisque c’est par elles qu’on arrive. Résultat : le
fichier de départ est passé de 1 008 à 309 Ko.

Même principe pour Leaflet : [`TripMap`](../src/components/reservations/TripMap.jsx) importe la bibliothèque dans son
effet, seulement quand une carte s’affiche.

## Les couches du code

Les dépendances vont dans un seul sens : une page utilise des composants et des hooks, qui utilisent `lib/` et `api/`.

| Dossier | Rôle | Exemple |
| --- | --- | --- |
| `pages/` | Un écran par fichier, rangés par espace (`user/`, `backoffice/`, `driver/`, `auth/`, `account/`, `errors/`) | `pages/backoffice/VehiclesPage.jsx` |
| `components/` | Morceaux d’écran par domaine (`vehicles/`, `planning/`, `reservations/`…) | `components/vehicles/VehicleForm.jsx` |
| `components/ui/` | Composants de base sans logique métier : `Button`, `Field`, `Modal`, `Drawer`, `Pagination`, `PageTabs`, `Toast`… | `components/ui/Button.jsx` |
| `hooks/` | Logique avec état réutilisable | `hooks/useApi.js`, `hooks/useForm.js` |
| `lib/` | Fonctions pures, sans React : dates, libellés, règles d’affichage, paramètres d’API, lecture de l’URL | `lib/queue.js`, `lib/dates.js` |
| `api/` | `client.js` (Axios configuré) et un fichier par domaine de l’API | `api/reservations.js` |
| `auth/` | Session, droits, gardes, espaces | `auth/AuthProvider.jsx` |

Pourquoi cette séparation :

- les composants ne font jamais d’appel HTTP eux-mêmes : si une route du backend change, un seul fichier de `api/`
  change ;
- les règles d’affichage sont dans `lib/`, lisibles et testables sans écran ;
- les composants restent courts et se concentrent sur l’affichage.

Contrainte d’ESLint (`react-refresh`) : un fichier `.jsx` n’exporte que des composants. Constantes et fonctions vont
dans un `.js`. C’est pour ça qu’un Context est découpé en trois fichiers (`AuthContext.js`, `AuthProvider.jsx`,
`useAuth.js`).

## Chargement des données

### `useApi`

[`src/hooks/useApi.js`](../src/hooks/useApi.js) est le hook de chargement utilisé par presque toutes les pages :

```js
const fetchVehicles = useCallback((signal) => getVehicles({ page }, { signal }), [page])
const vehicles = useApi(fetchVehicles)   // { data, error, loading, reload }
```

- Il appelle `fetcher` au montage, puis chaque fois que `fetcher` change. D’où le `useCallback` : sans lui, la
  fonction serait recréée à chaque rendu et la requête repartirait sans fin.
- Il annule la requête en cours (`AbortController`) quand la page est quittée ou que les paramètres changent : une
  ancienne réponse ne peut pas écraser la nouvelle.
- `loading` est calculé (le résultat ne correspond pas encore au `fetcher` courant), pas stocké.
- Pendant un rechargement, `data` garde la valeur précédente : l’écran ne clignote pas.
- `reload()` relance la requête, par exemple après un enregistrement.

Une fonction qui ne dépend d’aucune variable est définie hors du composant au lieu d’utiliser `useCallback`.

Des hooks plus spécialisés s’appuient dessus ou suivent le même modèle : `usePlanning`, `useQueue` (file des
réservations avec « Charger plus »), `useDocuments`, `useUsers`, `useDriverDay`…

### Du clic à l’écran

Exemple : l’agent passe à la page 2 des véhicules.

1. `Pagination` appelle `changePage(2)`, qui écrit `?page=2` dans l’URL (`setSearchParams`).
2. L’URL change : `VehiclesPage` se re-rend, `page` vaut 2, `useCallback` donne un nouveau `fetchVehicles`.
3. L’effet de `useApi` annule l’éventuelle requête précédente et appelle `getVehicles({ page: 2 })`.
4. [`api/vehicles.js`](../src/api/vehicles.js) passe par le client Axios : `GET /api/vehicles?page=2`, cookie de
   session joint.
5. Le backend répond `{ data: […], meta: { current_page, last_page, total } }` (15 éléments par page).
6. `useApi` range la réponse dans son état : la page se re-rend avec les nouvelles cartes.

### Listes et pagination

- Les listes sont paginées par le backend (15 par page). Le front lit `meta.current_page`, `meta.last_page` et
  `meta.total`.
- Filtres, recherche et tri sont envoyés au backend, jamais appliqués sur une liste entière chargée dans le
  navigateur.
- Pour les rares listes courtes à charger en entier (chauffeurs actifs d’un filtre, par exemple),
  [`api/pagination.js`](../src/api/pagination.js) fournit `fetchAllPages` et `fetchPages`, avec une limite de pages :
  `fetchPages` renvoie `complete: false` si la limite a coupé la liste, pour l’annoncer au lieu de la cacher.

### Rafraîchissement

Il n’y a pas de temps réel (WebSocket). Les écrans qui changent souvent sont relus toutes les 60 s quand l’onglet est
visible, et au retour sur l’onglet ([`useAutoRefresh`](../src/hooks/useAutoRefresh.js)) : tableau de bord, demandes
d’aide, « Ma journée » du chauffeur, compteurs de la barre latérale et des notifications. Après une action, la page
appelle `reload()` et, en gestion, `refreshCount()` pour les compteurs.

## État global

Trois Contexts seulement :

| Context | Fichiers | Contenu |
| --- | --- | --- |
| Session | `auth/AuthProvider.jsx`, `useAuth` | Utilisateur, statut de la session, connexion, déconnexion, `can`, `hasRole`, `isManagerOf`, tutoriels vus |
| Notifications | `notifications/NotificationsProvider.jsx`, `useNotifications` | Nombre de non lues, `refreshCount()` |
| Compteurs de gestion | `backoffice/QueueCountProvider.jsx`, `useQueueCount` | Compteurs de la barre latérale (réservations à traiter, Collège, demandes, demandes d’aide), `refreshCount()` |

Tout le reste vit dans la page qui en a besoin, ou dans l’URL (filtres, page, élément ouvert : voir
[conventions](conventions.md#lurl-garde-létat-de-lécran)). Les données métier appartiennent au backend : on les
relit plutôt que d’en garder une copie globale qui pourrait vieillir.

La valeur de chaque fournisseur est mémorisée (`useMemo`) : sans cela, elle changerait de référence à chaque rendu et
tous les composants qui la lisent se re-rendraient.

## Gestion des erreurs

| Situation | Ce qui s’affiche |
| --- | --- |
| Erreur de validation (422) | Message sous le champ concerné, ou en haut du formulaire (`useForm`) |
| Erreur de chargement d’une page | `ErrorState` : message du backend et bouton « Réessayer » (`reload`) |
| Droit refusé (403) | Message du backend, ou page 403 si la garde refuse l’accès |
| Session perdue (401) | Retour à la connexion avec « Votre session a expiré » |
| Serveur injoignable au démarrage | Page « Service momentanément indisponible » avec « Réessayer » |
| Composant qui plante au rendu | `RouteErrorPage` (`errorElement` du routeur) |

Les messages viennent de [`lib/errors.js`](../src/lib/errors.js) : `getErrorMessage` affiche le message du backend
(en français, prêt à afficher) pour une erreur inférieure à 500, sinon un message générique ; jamais de trace
technique. `getFieldErrors` range les erreurs 422 par champ, une ligne par message.
