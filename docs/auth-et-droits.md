# Authentification et droits

## Session Sanctum par cookie

Le backend utilise **Laravel Sanctum en mode SPA**. La session est portée par un **cookie HttpOnly** que le navigateur
envoie tout seul à chaque requête et qu’aucun script ne peut lire. Le front ne manipule jamais de jeton : ni token
Bearer, ni token en `localStorage`.

Pourquoi : un jeton gardé en `localStorage` est lisible par n’importe quel script de la page ; une faille XSS suffirait
à le voler. Un cookie HttpOnly ne l’est pas. Les attaques CSRF (requête forgée depuis un autre site) sont bloquées par
le jeton `XSRF-TOKEN`, que le front recopie dans un header.

### Client Axios

Tous les appels passent par `api`, défini dans [`src/api/client.js`](../src/api/client.js) :

```js
export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,   // envoie et reçoit les cookies de session
  withXSRFToken: true,     // recopie le cookie XSRF-TOKEN dans le header X-XSRF-TOKEN
  headers: { Accept: 'application/json' },
})

export const csrf = () => api.get('/sanctum/csrf-cookie', { baseURL: API_ORIGIN })
```

`csrf()` est appelé avant la connexion, l’inscription, le mot de passe oublié et la réinitialisation : le backend pose
alors le cookie `XSRF-TOKEN`.

Contraintes de développement : front sur `localhost:3000`, API sur `localhost:8080`. Pour les cookies, les deux sont
le même site. Avec `127.0.0.1` d’un côté, le navigateur verrait deux sites et n’enverrait pas le cookie.

### Erreurs traitées par le client

Un intercepteur de réponse traite à un seul endroit les erreurs communes à toutes les requêtes :

| Réponse | Réaction |
| --- | --- |
| `419` | Jeton CSRF absent ou expiré : on le renouvelle et on rejoue la requête une fois |
| `429` sur un GET | Trop de requêtes : on attend le délai annoncé par `Retry-After` (5 s au plus) et on rejoue une fois. Jamais pour une action (POST, PATCH…), qui serait envoyée deux fois |
| `401` | Session perdue : `AuthProvider` vide l’utilisateur (via `onSessionLost`), les gardes renvoient vers `/connexion` |
| `403` « Ce compte a été désactivé. » | Même chose, avec ce message sur la page de connexion |

Toutes les autres erreurs remontent à l’appelant.

## `AuthProvider`

[`src/auth/AuthProvider.jsx`](../src/auth/AuthProvider.jsx) garde la session dans son état et la partage par un
Context, lu avec `useAuth()`.

**Au chargement**, il relit `GET /auth/me`. Le `status` vaut :

- `loading` pendant l’appel (les gardes affichent un chargement plein écran) ;
- `ready` ensuite, avec `user` rempli ou `null` (une 401 ou une 403 veut dire « pas connecté ») ;
- `unavailable` si le serveur répond 500 ou ne répond pas : on ne sait pas si la session est ouverte, donc on affiche
  « Service momentanément indisponible » avec « Réessayer » plutôt que la page de connexion.

**Ce qu’il expose** :

| Valeur | Rôle |
| --- | --- |
| `user`, `status`, `sessionNotice` | Compte connecté, état de la session, message à afficher sur la page de connexion |
| `login`, `register`, `logout` | Connexion, inscription, déconnexion (efface aussi les brouillons) |
| `refresh` | Relit `/auth/me` (après une modification du profil, par exemple) |
| `clearSession` | Ferme une session invalidée par le backend (réinitialisation du mot de passe) |
| `retrySession` | « Réessayer » de la page Service indisponible |
| `markTourSeen`, `resetTour` | Tutoriels vus ou à revoir |
| `can`, `hasRole`, `isInternal`, `isManagerOf` | Droits du compte (voir plus bas) |

**Session déjà ouverte** : le backend répond 409 à une connexion ou une inscription si le navigateur a encore une
session ouverte (autre onglet, session non relue pendant une panne). Le front ferme alors cette session et rejoue la
demande pour le compte saisi.

## Rôles et permissions

`/auth/me` renvoie les `roles` du compte et la liste de ses `permissions`. Les fonctions de
[`src/auth/permissions.js`](../src/auth/permissions.js) les lisent :

| Fonction | Usage |
| --- | --- |
| `can(permission)` | Le compte a-t-il cette permission ? (`can('vehicles.create')`) |
| `hasRole(...roles)` | A-t-il au moins un de ces rôles ? |
| `isInternal()` | Agent communal ou admin |
| `isManagerOf(orgId)` | Est-il responsable de cette organisation ? |

Rôles : `admin`, `agent_communal`, `chauffeur`, `user`. « Responsable » n’est **pas** un rôle : c’est la relation d’un
membre avec une organisation donnée (`membership.is_manager`), d’où `isManagerOf`.

Le front teste des **permissions** plutôt que des rôles dès qu’il s’agit d’une page ou d’une action : si
l’administration donne une permission à un autre rôle, le front suit sans modification.

### Où les droits sont utilisés

1. **Gardes de routes** ([`src/auth/guards.jsx`](../src/auth/guards.jsx)) :
   - `RequireGuest` : pages réservées aux invités ; un compte connecté est renvoyé vers son espace.
   - `RequireAuth` : connecté et email vérifié ; sinon `/connexion` (avec la page demandée en mémoire, pour y revenir
     après la connexion) ou la page « email non vérifié ».
   - `RequireRole` : au moins un des rôles de l’espace, sinon page 403.
   - `RequirePermission` : permission de la page, sinon page 403.
2. **Menus** : chaque entrée de [`navigation.js`](../src/navigation.js) déclare sa `permission` (et parfois une
   condition `visible`) ; `isNavItemVisible` filtre.
3. **Boutons et sections** : `can('…') && <Button>…`.

> **Le front ne sécurise rien.** Il masque ce que le compte ne peut pas faire, pour le confort. N’importe qui peut
> modifier le JavaScript dans son navigateur. La sécurité est assurée par le backend (Policies Laravel), qui vérifie
> chaque requête. Le front affiche proprement ses refus (403, 422).

## Espaces et comptes à plusieurs rôles

[`src/auth/spaces.js`](../src/auth/spaces.js) décrit les trois espaces (`/gestion`, `/chauffeur`, `/espace`) et les
rôles qui y donnent accès.

- **Espace d’arrivée** (`getLandingPath`) : le dernier espace visité s’il est toujours accessible, sinon l’espace du
  rôle principal (gestion pour un agent ou un admin, puis chauffeur, puis usager).
- Le dernier espace visité est gardé dans le `localStorage` : c’est une préférence d’affichage, comme le thème, pas
  une donnée métier.
- [`SpaceSwitcher`](../src/layouts/SpaceSwitcher.jsx) affiche le sélecteur d’espace seulement si le compte en a
  plusieurs (un agent communal qui est aussi chauffeur, par exemple).

## Pages d’authentification

| Page | Ce qu’elle fait |
| --- | --- |
| `/connexion` | Email, mot de passe, « Rester connecté » ; retour à la page demandée avant la connexion, sinon à l’espace d’arrivée |
| `/inscription` | Création de compte ; la case « J’ai lu la politique de confidentialité » est exigée par le backend |
| `/mot-de-passe-oublie` | Envoie le lien de réinitialisation par email |
| `/reset-password` | Lien de l’email (`?token=&email=`), connecté ou non : si une session est ouverte sur un autre compte, elle est annoncée et gardée ; si c’est le même compte, le backend ferme ses sessions et on revient à la connexion |
| `/verify-email` | Lien de l’email, publique (le lien peut être ouvert sur un autre appareil) |

Mots de passe : 12 caractères au moins, avec des lettres et des chiffres (règle du backend, rappelée sous le champ).
Le champ `PasswordInput` a un bouton pour afficher ou masquer la saisie.
