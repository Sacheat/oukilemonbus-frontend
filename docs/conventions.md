# Conventions

Règles suivies dans tout le code. Les respecter garde le projet homogène, quel que soit le membre du binôme qui écrit.

## Composants

- Composants en **fonctions**, **exports nommés**, un composant par fichier, nom du fichier = nom du composant.
- Un fichier `.jsx` n’exporte que des composants (règle ESLint `react-refresh`) ; constantes et fonctions vont dans un
  `.js` (souvent dans `lib/`).
- Les composants de base de [`components/ui/`](../src/components/ui/) sont réutilisés avant d’en écrire un nouveau :
  `Button` (aussi en lien avec `to`, roue de chargement avec `loading`), `Field` / `Input` / `Select` / `Textarea` /
  `Checkbox` / `PasswordInput`, `Alert`, `Modal`, `Drawer`, `Pagination`, `PageHeader`, `PageTabs`, `FilterChips`,
  `SegmentedControl`, `EmptyState`, `ErrorState`, `Loader`, `Skeleton`, `Toast`, `StatusBadge`…
- Statut d’une réservation : toujours `<StatusBadge status label />` (couleur selon le statut, libellé du backend).
- Valeurs d’énumération du backend reprises telles quelles, en français sans accents (`en_attente`, `approuve`,
  `confirme`, `en_conflit`, `refuse`, `annule`). Pour les afficher : le `*_label` renvoyé par le backend, sinon
  [`lib/labels.js`](../src/lib/labels.js).

## Hooks

- Chargement de données : `useApi(fetcher)` avec un `fetcher` **stable** (mémorisé par `useCallback`, ou défini hors
  du composant s’il ne dépend de rien). Pas de bibliothèque de chargement de données.
- Règles des hooks (vérifiées par ESLint) : toujours au premier niveau du composant, jamais dans une condition ou une
  boucle ; toutes les dépendances déclarées dans le tableau des effets.
- Ce qui se calcule à partir de l’état, des props ou de l’URL n’est pas mis dans un état séparé.
- Tout effet qui ouvre quelque chose (minuteur, écouteur, requête, carte Leaflet) le referme dans son nettoyage.

## Formulaires

[`useForm`](../src/hooks/useForm.js) gère les valeurs, l’envoi et les erreurs du backend :

```jsx
const form = useForm({ licence_plate: '', capacity: '' })

async function handleSubmit(event) {
  event.preventDefault()
  const result = await form.submit((values) => createVehicle(values))
  if (result.ok) onSaved(result.data)
}

<form onSubmit={handleSubmit} noValidate>
  {form.error && <Alert tone="danger">{form.error}</Alert>}
  <Field label="Plaque d'immatriculation" error={form.errors.licence_plate} required>
    {(props) => <Input {...props} value={form.values.licence_plate} onChange={form.handle('licence_plate')} />}
  </Field>
  <Button type="submit" loading={form.submitting}>Ajouter le véhicule</Button>
</form>
```

- Champs **contrôlés** : la valeur vient de l’état, `form.handle('champ')` la met à jour.
- **La validation est faite par le backend** (`noValidate`) : ses erreurs 422 vont sous le champ concerné
  (`form.errors`), ou en haut du formulaire (`form.error`) si elles ne correspondent à aucun champ. Les règles
  métier ne sont pas recopiées dans le front.
- `Field` relie le libellé, l’aide et l’erreur au champ (`id`, `aria-describedby`, `aria-invalid`) par une fonction
  passée en enfant.
- Le bouton d’envoi reçoit `loading={form.submitting}` : il est désactivé pendant l’envoi.
- Champ libre (motif, remarque, justification…) : afficher la consigne « pas d’information médicale »
  (`SENSITIVE_TEXT_HINT` / `withSensitiveHint`, [`lib/privacy.js`](../src/lib/privacy.js)).

### Actions sensibles : `Idempotency-Key`

Création d’une réservation ou d’une série, annulation, affectation, demande d’aide : le front envoie un header
`Idempotency-Key` (un `crypto.randomUUID()` par action de l’utilisateur). Si la même demande est renvoyée (réseau
coupé puis nouvel essai), le backend la reconnaît et ne crée pas de doublon. L’assistant de réservation réutilise la
clé tant que le contenu envoyé est identique.

## L’URL garde l’état de l’écran

Filtres, onglet, page et élément ouvert sont dans l’URL (`useSearchParams`), avec des noms en français :

```
/gestion/vehicules?page=2&vehicule=12
/espace/deplacements?periode=passes&statut=confirme
/gestion/planning?vue=liste&du=2026-11-02&au=2026-11-13&trajet=48
```

Ainsi, le bouton Retour, l’actualisation et un lien partagé redonnent exactement le même écran, et il n’y a qu’une
source de vérité. Les fonctions qui lisent l’URL et en tirent les paramètres de l’API sont dans `lib/` (par exemple
`lib/queue.js`, `lib/planning.js`, `lib/users.js`).

### Pages de gestion : liste et panneau

Les pages de `/gestion` suivent le même schéma :

1. une liste (cartes ou lignes) filtrée et paginée par le backend ;
2. un élément ouvert dans un `Drawer` (panneau latéral) piloté par l’URL : `?vehicule=12` pour modifier,
   `?vehicule=nouveau` pour ajouter ;
3. le contenu du panneau est choisi par un composant `*DrawerContent` (création, modification, introuvable…) ;
4. après un succès : panneau fermé, liste rechargée (`reload()`), message en haut de la page.

L’élément ouvert est pris dans la page de liste déjà chargée, sinon relu par son id (`useOpenedItem`).

### Message après une redirection

`navigate(chemin, { state: { notice } })` ; la page d’arrivée lit `location.state.notice` une fois, puis le retire de
l’historique (sinon le message reviendrait au retour arrière).

## Recherche à la frappe

Modèle : [`AccountPicker`](../src/components/drivers/AccountPicker.jsx) et `LocationPicker`.

- la requête part **300 ms** après la dernière frappe (pas une par lettre) ;
- la requête précédente est **annulée** (`AbortController`) ;
- la réponse est **rattachée au texte** qui l’a produite : une réponse arrivée en retard pour un ancien texte n’est
  pas affichée.

## Stockage dans le navigateur

| Stockage | Contenu |
| --- | --- |
| Cookie HttpOnly (géré par le navigateur) | Session |
| `sessionStorage` | Brouillons de l’assistant de réservation et de série uniquement ([`lib/drafts.js`](../src/lib/drafts.js)) : liés au compte, expirés après 12 h, effacés à la déconnexion et après l’envoi |
| `localStorage` | Préférences d’affichage seulement : thème, dernier espace visité, raccourcis clavier |

Jamais de `localStorage` pour des données métier : elles resteraient sur un ordinateur partagé après la déconnexion.

## Dates et heures

Fonctions dans [`lib/dates.js`](../src/lib/dates.js).

- Envoyer les dates en `AAAA-MM-JJ` et les heures en `HH:mm`.
- Deux sortes de valeurs arrivent du backend :
  - les **horodatages UTC** (`created_at`, `updated_at`…) : afficher avec `formatDateTime` ;
  - les **heures locales de Bruxelles sans fuseau** (trajets, indisponibilités) : afficher avec `formatDate`,
    `formatTime`, `formatLocalDateTime`, `formatLocalPeriod`, sans aucune conversion.
- « Aujourd’hui » se calcule à l’heure de Bruxelles (`brusselsNow` dans `lib/dates.js`, `todayInBrussels` dans
  `lib/planning.js`), comme le backend : un trajet du jour même n’est pas « passé ».
- Pour comparer deux heures locales, les ramener au même format `AAAA-MM-JJTHH:mm` avec `toLocalMinute` avant de
  comparer les textes.

## Style et thème

- **Tailwind CSS v4**, classes dans le JSX. `cx()` ([`lib/cx.js`](../src/lib/cx.js)) assemble des classes en ignorant
  les valeurs fausses : `cx('px-3', isActive && 'font-bold')`.
- **Tokens de la charte** définis dans [`src/index.css`](../src/index.css) : `bg-surface`, `bg-surface-muted`,
  `text-ink`, `text-muted`, `border-line`, `bg-primary`, `text-link`, `bg-accent`, `bg-nav`, tons
  `success | warning | danger | info | conflict | neutral` et leur version `-soft`, rayons
  `rounded-control | card | panel`. **Pas de couleur en dur.**
- **Mode sombre** : les tokens sont des variables CSS redéfinies sous `<html data-theme="dark">`. Les composants n’ont
  rien à faire de plus. Le thème suit le système par défaut ; `ThemeToggle` permet de forcer clair ou sombre
  ([`lib/theme.js`](../src/lib/theme.js), lu par `useTheme` avec `useSyncExternalStore`).
- Charte et maquettes : [`docs/design/`](design/). En cas d’écart entre la maquette et le backend, le backend fait foi.

## Textes

- Interface en français, avec accents ; pas d’emoji.
- Les messages d’erreur du backend sont en français et affichés tels quels ; jamais de trace technique.

## Accessibilité

- Cibles cliquables de 44 px au moins.
- Libellés reliés aux champs (`Field`), erreurs annoncées.
- Fenêtres `Modal` et `Drawer` basées sur `<dialog>` : focus piégé et touche Échap gérés par le navigateur ; contenu
  monté seulement à l’ouverture, pour repartir d’un formulaire vide.
- `aria-expanded` sur les menus, listes de suggestions utilisables au clavier, icônes décoratives en `aria-hidden`.
- Animations désactivées si le système demande de les réduire.

## Nouvelle page

1. La page dans `pages/<espace>/`, déclarée dans `router.jsx` avec `lazyPage` et sa `RequirePermission`.
2. L’entrée de menu dans `navigation.js`, avec sa permission.
3. La carte (et si possible l’étape de visite, avec un attribut `data-tour`) dans le tutoriel de l’espace,
   [`lib/tours.js`](../src/lib/tours.js).
4. La doc de l’espace dans `docs/`.

## Travail en binôme

- Une branche par sujet (`feature/…`, `fix/…`, `style/…`, `docs/…`), créée depuis `main` à jour, jamais de travail
  direct sur `main`.
- Intégration par Pull Request GitHub, relue par l’autre membre avant le merge.
- PR empilées (une branche construite sur une autre) : merger dans l’ordre avec « Create a merge commit ».
- `npm run lint` et `npm run build` passent avant une PR.
- Une règle métier se teste par son effet sur l’API (réservation bloquée ou non, conflit créé…), puis les données de
  test sont supprimées.
