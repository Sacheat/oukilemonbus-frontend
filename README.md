# OuKiLéMonBus — Front

Application web de réservation du bus communal : demandes de trajets par les organisations, validation et planification par la commune, missions des chauffeurs.

## Stack

React · JavaScript · Vite · Tailwind CSS · React Router · Axios · Lucide React

## Démarrer

Prérequis : le backend Laravel lancé sur `http://localhost:8080`.

```bash
npm install
cp .env.example .env.local   # facultatif, si le backend n'est pas sur localhost:8080
npm run dev                  # http://localhost:3000
```

Comptes de test (créés par le seeder du backend, mot de passe `password`) : `admin.test@bus-communal.local`, `agent.test@bus-communal.local`, `user.test@bus-communal.local`, `responsable.test@bus-communal.local`, `chauffeur.test@bus-communal.local`.

## Documentation

- Conventions et règles de travail : [`CLAUDE.md`](CLAUDE.md)
- DA et maquettes : [`docs/design/`](docs/design/)
