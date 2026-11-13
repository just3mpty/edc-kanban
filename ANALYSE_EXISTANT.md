# Analyse de l'existant

## Structure du projet

API REST en TypeScript (Node.js, Express 5) connectée à MongoDB avec Mongoose.

- `src/main.ts` démarre l'application, `src/server.ts` se connecte à MongoDB puis lance le serveur, `src/app.ts` configure Express (utilisé aussi par les tests).
- `src/config/` : variables d'environnement validées avec Zod (`env.ts`), connexion MongoDB (`db.ts`), logs avec Pino (`logger.ts`).
- `src/models/` : `Column`, `OF` (ordre de fabrication) et `User`.
- `src/routes/` et `src/controllers/` : authentification (`/api/auth`), colonnes (`/api/columns`) et OF (`/api/ofs`), plus `/health`.
- `src/middlewares/` : vérification du jeton JWT, validation Zod, gestion des erreurs.
- `tests/` : Vitest et Supertest avec une base MongoDB en mémoire (`mongodb-memory-server`). Tests présents pour l'authentification, les OF et `/health`. `columns.test.ts` était vide.

Dépendances principales : express, mongoose, jsonwebtoken, bcryptjs, zod, cors, pino, dotenv. helmet et express-rate-limit sont installés mais n'étaient pas utilisés.

Variables d'environnement : `NODE_ENV`, `PORT`, `MONGODB_URI` (et non `MONGO_URI` comme indiqué dans l'énoncé), `JWT_SECRET` (32 caractères minimum), `JWT_EXPIRES_IN`, `CORS_ORIGIN`.

## Risques et anomalies constatés

1. Les tests ne se lancent pas : sans fichier `.env`, `env.ts` arrête le programme. Aucun `.env.example` n'est fourni.
2. `npm run build` échoue (4 erreurs) : le `tsconfig.json` inclut `tests/` alors que `rootDir` vaut `src`. `npm start` est donc impossible, et une image Docker aussi.
3. `npm test` lance Vitest en mode surveillance : en intégration continue, la commande ne s'arrêterait jamais.
4. Aucune protection des en-têtes HTTP ni limite de requêtes : la route de connexion peut être attaquée par force brute.
5. Le middleware de validation vérifie le corps de la requête mais ne le remplace pas par les données validées. Des champs non prévus, comme l'opérateur `$unset`, arrivent jusqu'à MongoDB.
6. Les erreurs renvoient leur message technique au client hors production, et un identifiant invalide provoque une erreur 500.
7. L'URI MongoDB est écrite dans les logs : elle peut contenir un mot de passe.
8. `npm audit` signale 10 vulnérabilités dans les dépendances de production, dont 2 critiques.
9. Points à surveiller : inscription ouverte à tous, jeton valable 7 jours par défaut, CORS ouvert à toutes les origines par défaut, README qui annonce des routes publiques alors qu'elles sont protégées, pas de dépôt Git ni de Dockerfile.

## Priorités avant mise en production

1. Rendre le projet exécutable et testable : `.env.example`, configuration de build séparée, `vitest run`, tests des colonnes.
2. Sécuriser l'API : helmet, limite de requêtes, validation corrigée, erreurs sans détail technique, logs sans secret, dépendances à jour.
3. Rendre le déploiement reproductible : Dockerfile, docker-compose avec MongoDB, pipeline CI.
4. Documenter : guide de déploiement, note de sécurité et README à jour.
