# Jaydee Kanban : API

API de l'application interne Jaydee Kanban, qui suit les ordres de fabrication (OF) de l'atelier d'injection plastique sur un tableau Kanban.

Ce dépôt contient la préparation de la mise en production de l'API existante : analyse du code, tests d'intégration, conteneurisation, stratégie CI/CD et sécurisation.

## Documents

| Fichier | Contenu |
|---|---|
| [ANALYSE_EXISTANT.md](ANALYSE_EXISTANT.md) | Structure du projet, risques constatés, priorités |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Installation, lancement en local et avec Docker, tests, mise à jour |
| [CI_CD_STRATEGIE.md](CI_CD_STRATEGIE.md) | Pipeline d'intégration et de déploiement continus |
| [NOTE_SECURITE.md](NOTE_SECURITE.md) | Risques, mesures de sécurité et limites |

## Démarrage rapide

```bash
npm install
cp .env.example .env
docker compose up -d mongo
npm run dev
```

Renseigner `JWT_SECRET` dans `.env` avant de lancer l'API (32 caractères minimum). Pour tout lancer avec Docker : `docker compose up -d --build`. Le détail est dans le [guide de déploiement](DEPLOYMENT_GUIDE.md).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement automatique |
| `npm run build` | Compilation TypeScript dans `dist/` |
| `npm start` | Lancement de la version compilée |
| `npm test` | Tests d'intégration (Vitest, Supertest, MongoDB en mémoire) |
| `npm run test:watch` | Tests en mode surveillance |

## API

Toutes les routes `/api/columns` et `/api/ofs` demandent un jeton JWT (`Authorization: Bearer <jeton>`) obtenu avec `/api/auth/login`.

| Méthode | Route | Description |
|---|---|---|
| GET | `/health` | État du serveur |
| POST | `/api/auth/register` | Création d'un compte |
| POST | `/api/auth/login` | Connexion, renvoie un jeton |
| GET, POST | `/api/columns` | Liste et création des colonnes |
| GET, PUT, DELETE | `/api/columns/:id` | Lecture, modification, suppression d'une colonne |
| GET, POST | `/api/ofs` | Liste (filtre `?columnId=`) et création des OF |
| GET, PUT, DELETE | `/api/ofs/:id` | Lecture, modification, suppression d'un OF |
| PATCH | `/api/ofs/:id/move` | Déplacement d'un OF |

## Choix techniques

- **Stack existante conservée** : Node.js, Express 5, TypeScript, MongoDB avec Mongoose, validation Zod, logs Pino.
- **Tests** : Vitest et Supertest sur l'application Express, avec une base MongoDB en mémoire. Aucun service externe n'est nécessaire et les tests restent isolés les uns des autres. 48 tests, dont les colonnes (`tests/columns.test.ts`) et la sécurité (`tests/security.test.ts`).
- **Build** : `tsconfig.build.json` compile uniquement `src/`, pour que `npm start` et l'image Docker fonctionnent.
- **Docker** : image `node:20-alpine` qui installe les dépendances, compile le TypeScript et lance `npm start`. `docker-compose.yml` ajoute MongoDB 7 avec un volume persistant.
- **CI/CD** : GitHub Actions (`.github/workflows/ci.yml`) lance l'audit, le build, les tests et la construction de l'image. L'image est publiée sur `ghcr.io` à chaque release.

## Sécurité

- helmet pour les en-têtes HTTP de sécurité.
- express-rate-limit : 100 requêtes par 15 minutes sur l'API, 20 sur l'authentification.
- Validation Zod qui retire les champs non prévus, y compris les opérateurs MongoDB.
- Erreurs sans détail technique, URI de la base absente des logs.
- Dépendances sans vulnérabilité connue (`npm audit`).

Les limites restantes sont détaillées dans la [note de sécurité](NOTE_SECURITE.md).

## Auteur et version

- Auteur : Aurélien CORRE
- Version : 1.0.0
