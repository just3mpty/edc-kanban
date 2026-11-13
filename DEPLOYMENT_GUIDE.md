# Guide de déploiement

## Prérequis

- Node.js 20 ou plus récent et npm
- Docker Desktop (ou Docker Engine avec Docker Compose)
- MongoDB 7 : installé sur la machine ou lancé avec Docker (voir plus bas)
- Git

Variables d'environnement (modèle dans `.env.example`) :

| Variable | Rôle | Exemple |
|---|---|---|
| `NODE_ENV` | `development`, `production` ou `test` | `development` |
| `PORT` | Port de l'API | `3000` |
| `MONGODB_URI` | Adresse de la base MongoDB | `mongodb://127.0.0.1:27017/visiplus` |
| `JWT_SECRET` | Clé de signature des jetons, 32 caractères minimum | chaîne aléatoire |
| `JWT_EXPIRES_IN` | Durée de validité d'un jeton | `1h` |
| `CORS_ORIGIN` | Origine autorisée à appeler l'API | `http://localhost:5173` |

Pour générer une clé : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Lancement en local

```bash
git clone <url-du-depot>
cd visiplus
npm install
cp .env.example .env
```

Renseigner `JWT_SECRET` dans `.env`. Si MongoDB n'est pas installé, le lancer avec Docker :

```bash
docker compose up -d mongo
```

Puis démarrer l'API :

```bash
npm run dev
```

Mode production sans Docker :

```bash
npm run build
npm start
```

Vérification :

```bash
curl http://localhost:3000/health
curl -i http://localhost:3000/api/columns
```

La première commande répond `{"status":"ok",...}`. La seconde répond 401, car les routes de l'API demandent un jeton.

## Lancement avec Docker

Le `Dockerfile` construit l'image en deux étapes : la première installe toutes les dépendances et compile le TypeScript, la seconde ne garde que les dépendances de production et le dossier `dist`, puis lance `npm start` avec l'utilisateur `node`.

API seule (avec une base MongoDB existante) :

```bash
docker build -t visiplus .
docker run -d --name visiplus -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/visiplus \
  -e JWT_SECRET=<clé de 32 caractères minimum> \
  visiplus
```

API et MongoDB ensemble avec `docker-compose.yml` (le fichier `.env` doit contenir `JWT_SECRET`) :

```bash
docker compose up -d --build
docker compose ps
docker compose logs api
```

L'API attend que MongoDB soit prêt avant de démarrer. Les données sont conservées dans le volume `mongo-data`. Pour tout arrêter : `docker compose down` (ajouter `-v` pour supprimer aussi les données).

## Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

Les tests utilisent une base MongoDB en mémoire, téléchargée automatiquement au premier lancement : aucune base n'est nécessaire.

## Mise à jour

En local :

```bash
git pull
npm install
npm test
npm run dev
```

Avec Docker :

```bash
git pull
docker compose up -d --build
curl http://localhost:3000/health
```

Pour revenir en arrière, revenir au commit ou au tag précédent (`git checkout <tag>`) puis relancer `docker compose up -d --build`. En production, l'image de chaque version est publiée avec son tag par le pipeline CI/CD (voir `CI_CD_STRATEGIE.md`).
