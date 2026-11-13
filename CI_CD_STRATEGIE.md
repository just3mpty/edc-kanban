# Stratégie CI/CD

## Objectifs

- **Automatiser** : chaque modification est installée, compilée et testée sans intervention.
- **Fiabiliser** : une modification qui casse le build ou les tests ne peut pas être fusionnée ni déployée.
- **Garantir la qualité** : tests d'intégration, audit des dépendances et construction de l'image Docker à chaque changement.

## Déclencheurs

| Événement | Ce qui est lancé |
|---|---|
| `pull_request` vers `main` | Installation, audit, build, tests, construction de l'image Docker |
| `push` sur `main` | Même chose, pour vérifier la branche principale après fusion |
| `release` publiée | Même chose, puis publication de l'image sur le registre GitHub (`ghcr.io`) avec le numéro de version |

## Étapes du pipeline

1. **Installation** : `npm ci`, à partir du `package-lock.json` pour avoir exactement les mêmes versions partout.
2. **Audit** : `npm audit --omit=dev --audit-level=high` bloque le pipeline si une faille importante est trouvée.
3. **Build** : `npm run build` compile le TypeScript.
4. **Tests** : `npm test` lance Vitest et Supertest avec une base MongoDB en mémoire, sans service externe.
5. **Image Docker** : `docker build` vérifie que l'image se construit.
6. **Déploiement** : à chaque release, l'image est publiée avec son tag. Le serveur de production récupère cette image et redémarre le conteneur (`docker compose pull && docker compose up -d`).

## Extrait du pipeline (`.github/workflows/ci.yml`)

```yaml
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  test:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - run: npm test
```

Le fichier complet ajoute l'audit, la construction de l'image et la publication à chaque release.

## Gestion des secrets

- Aucun secret dans le code ni dans le dépôt : `.env` est ignoré par Git et par Docker, seul `.env.example` est versionné.
- Les tests utilisent des valeurs factices définies dans `vitest.config.ts`, sans lien avec la production.
- La publication de l'image utilise le jeton fourni automatiquement par GitHub (`secrets.GITHUB_TOKEN`).
- Les secrets de production (`JWT_SECRET`, URI MongoDB avec mot de passe) sont stockés sur le serveur ou dans les secrets GitHub, jamais affichés dans les logs.

## Validations avant mise en production

- La branche `main` est protégée : fusion uniquement par pull request relue par une autre personne, avec un pipeline au vert.
- Une release n'est créée qu'après vérification sur un environnement de test avec l'image candidate.
- Après le déploiement, la route `/health` doit répondre 200. Sinon, on revient à l'image précédente, toujours disponible avec son tag.
