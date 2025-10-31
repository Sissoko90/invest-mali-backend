# Fix de Déploiement - Application Agent

## Problème Identifié

L'application agent essaie de se connecter à `localhost:8080` au lieu de l'URL de production du backend. Cela cause des erreurs `ERR_CONNECTION_REFUSED`.

## Cause Racine

L'application agent n'a pas de fichier `.env` local et utilise donc le fallback configuré dans `api.config.ts` :

```typescript
BASE_URL: process.env.REACT_APP_USER_API_URL || 'http://localhost:8080/api/v1'
```

## Solutions

### Solution 1: Créer un fichier .env local (Recommandée)

1. **Créer le fichier .env** dans `frontend/investmali-agent/` :

```bash
cd frontend/investmali-agent
cp .env.example .env
```

2. **Modifier le fichier .env** avec l'URL de production :

```env
# Configuration API pour l'application Agent InvestMali
REACT_APP_USER_API_URL=https://investmali.abdatytch.com/api/v1
PORT=3001
NODE_ENV=production
REACT_APP_DEBUG_API=false
```

3. **Redémarrer l'application agent** :

```bash
npm start
```

### Solution 2: Utiliser les variables d'environnement système

```bash
# Windows (PowerShell)
$env:REACT_APP_USER_API_URL="https://investmali.abdatytch.com/api/v1"
npm start

# Linux/Mac
export REACT_APP_USER_API_URL="https://investmali.abdatytch.com/api/v1"
npm start
```

### Solution 3: Modifier temporairement api.config.ts

**⚠️ Solution temporaire - non recommandée pour la production**

Modifier directement le fallback dans `src/config/api.config.ts` :

```typescript
// Ligne 11
BASE_URL: process.env.REACT_APP_USER_API_URL || 'https://investmali.abdatytch.com/api/v1',
```

## Vérification

Après application de la solution, vérifiez dans la console du navigateur :

1. **Pas d'erreurs ERR_CONNECTION_REFUSED**
2. **Logs de configuration** (si debug activé) :
   ```
   🔧 Agent API Configuration
   Base URL: https://investmali.abdatytch.com/api/v1
   ```

## URLs Concernées

L'application agent fait des appels vers ces endpoints :

- `/api/v1/chat/conversations/active` - Notifications chat
- `/api/v1/entreprises/{id}` - Détails entreprise
- `/api/v1/documents/entreprise/{id}` - Documents entreprise
- `/api/v1/entreprises/assigned-to-me` - Demandes assignées

## Configuration Complète Recommandée

**Fichier `.env` pour l'application agent** :

```env
# URL API Backend
REACT_APP_USER_API_URL=https://investmali.abdatytch.com/api/v1

# Configuration Application
PORT=3001
NODE_ENV=production
GENERATE_SOURCEMAP=false

# Configuration API
REACT_APP_API_TIMEOUT=30000
REACT_APP_DEBUG_API=false

# Chemins optionnels
REACT_APP_CREATE_CLIENT_APP_PATH=/agent/applications,/applications
```

## Test de Connectivité

Pour tester si le backend est accessible :

```bash
# Test direct de l'API
curl https://investmali.abdatytch.com/api/v1/health

# Ou dans le navigateur
https://investmali.abdatytch.com/api/v1/health
```

## Notes Importantes

1. **Fichier .env ignoré par Git** - Normal, chaque environnement a sa configuration
2. **Redémarrage requis** - Les variables d'environnement React nécessitent un redémarrage
3. **HTTPS requis** - Assurez-vous que le backend est accessible en HTTPS
4. **CORS configuré** - Le backend doit autoriser les requêtes depuis le domaine agent

## Commandes de Déploiement

```bash
# 1. Aller dans le dossier agent
cd frontend/investmali-agent

# 2. Créer le fichier .env
echo "REACT_APP_USER_API_URL=https://investmali.abdatytch.com/api/v1" > .env
echo "PORT=3001" >> .env
echo "NODE_ENV=production" >> .env
echo "REACT_APP_DEBUG_API=false" >> .env

# 3. Installer les dépendances (si nécessaire)
npm install

# 4. Démarrer l'application
npm start
```

## Résultat Attendu

Après correction, l'application agent devrait :

- ✅ Se connecter au backend de production
- ✅ Charger les détails des entreprises
- ✅ Afficher les notifications chat
- ✅ Permettre la gestion des documents
- ✅ Fonctionner sans erreurs de connexion
