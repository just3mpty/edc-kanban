# Note de sécurité

## Risques identifiés

1. **Abus de l'API et force brute** : aucune limite de requêtes. Un attaquant pouvait tester des milliers de mots de passe sur `/api/auth/login` ou saturer l'API.
2. **Injection d'opérateurs MongoDB** : le middleware de validation ne remplaçait pas le corps de la requête par les données validées. Une requête `PUT /api/ofs/:id` contenant `{"$unset": {"description": 1}}` supprimait un champ que le schéma ne permettait pas de modifier.
3. **Fuite d'informations** : en-têtes HTTP par défaut (`X-Powered-By: Express`), messages d'erreur techniques renvoyés au client, URI de la base écrite dans les logs.

## Mesures mises en place

| Mesure | Fichier | Effet |
|---|---|---|
| helmet | `src/middlewares/security.middleware.ts`, activé dans `src/app.ts` | En-têtes de sécurité (CSP, `X-Content-Type-Options`, `X-Frame-Options`, HSTS), suppression de `X-Powered-By` |
| express-rate-limit | même fichier | 100 requêtes par 15 minutes sur `/api`, 20 sur `/api/auth`, réponse 429 au-delà |
| Taille du corps limitée | `src/app.ts` | JSON limité à 10 ko |
| Validation corrigée | `src/middlewares/validate.middleware.ts` | Le corps est remplacé par les données validées : les champs inconnus et les opérateurs sont retirés |
| Erreurs sans détail | `src/middlewares/error.middleware.ts` | Erreur 500 générique, identifiant invalide renvoyé en 400 |
| Logs sans secret | `src/config/db.ts` | Seuls l'hôte et le nom de la base sont écrits |
| Dépendances à jour | `package-lock.json` | `npm audit fix` : 0 vulnérabilité |
| Conteneur | `Dockerfile` | Image de production sans dépendances de développement, exécutée avec l'utilisateur `node` |

La protection par JWT existait déjà : toutes les routes `/api/columns` et `/api/ofs` renvoient 401 sans jeton valide. C'est vérifié par les tests (`columns.test.ts`, `security.test.ts`) et avec `curl` (voir le guide de déploiement).

## Limites

- La limite de requêtes est gardée en mémoire : elle repart à zéro au redémarrage et n'est pas partagée entre plusieurs instances. Avec plusieurs conteneurs, il faudrait un stockage commun (Redis). Derrière un proxy, il faut aussi régler `trust proxy` pour compter les vraies adresses IP.
- L'inscription reste ouverte à tous : n'importe qui peut obtenir un jeton. Pour un outil interne, il faudrait réserver la création de comptes à un administrateur et ajouter des rôles.
- Le jeton JWT ne peut pas être révoqué avant son expiration. Je conseille `JWT_EXPIRES_IN=1h` en production.
- `CORS_ORIGIN` vaut `*` si la variable n'est pas définie : il faut toujours la renseigner en production.
- Le mot de passe demande seulement 6 caractères.
- MongoDB tourne sans authentification dans `docker-compose.yml`. Le port n'est ouvert que sur la machine locale, mais en production il faut activer un utilisateur et un mot de passe.
