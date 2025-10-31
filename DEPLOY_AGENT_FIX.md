# Guide de déploiement - Correction CORS Agent

## Problème résolu
L'application agent ne pouvait pas se connecter au backend à cause d'une erreur CORS.

## Modifications apportées

### 1. Configuration API (api.config.ts)
- ✅ URL de base mise à jour : `https://investmali.abdatytch.com/api/v1`
- ✅ URLs relatives en production : `/api/v1` pour éviter CORS
- ✅ WITH_CREDENTIALS activé pour l'authentification

### 2. Configuration Proxy (setupProxy.js)
- ✅ Target mis à jour : `https://investmali.abdatytch.com`
- ✅ Secure: true pour HTTPS
- ✅ changeOrigin: true pour contourner CORS

### 3. Configuration Nginx (nginx.conf)
- ✅ server_name corrigé : `investmali-agent.abdatytch.com`
- ✅ CORS headers mis à jour avec le bon domaine
- ✅ Proxy API configuré vers `https://investmali.abdatytch.com/api/v1/`

### 4. Package.json
- ✅ Proxy mis à jour : `https://investmali.abdatytch.com`

## Actions de déploiement

### Étape 1 : Rebuild l'application
```bash
cd /path/to/frontend/investmali-agent
npm run build
```

### Étape 2 : Déployer les fichiers
Copiez le contenu du dossier `build/` vers votre serveur web.

### Étape 3 : Mettre à jour la configuration Nginx
Copiez le fichier `nginx.conf` mis à jour vers votre serveur et rechargez nginx :
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Étape 4 : Vérifier le déploiement
1. Accédez à `https://investmali-agent.abdatytch.com`
2. Essayez de vous connecter avec `admin@example.com`
3. Vérifiez qu'il n'y a plus d'erreur CORS dans la console

## Configuration finale

### Variables d'environnement (.env.production)
```
REACT_APP_AGENT_API_URL=https://investmali.abdatytch.com/api/v1
REACT_APP_DEBUG_API=false
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

### URLs utilisées
- **Frontend Agent** : `https://investmali-agent.abdatytch.com`
- **Backend API** : `https://investmali.abdatytch.com/api/v1`
- **Proxy Nginx** : `/api/v1/` → `https://investmali.abdatytch.com/api/v1/`

## Résultat attendu
- ✅ Plus d'erreur CORS
- ✅ Connexion agent fonctionnelle
- ✅ API calls qui passent par le proxy nginx
- ✅ Authentification qui fonctionne

## Test de validation
```javascript
// Dans la console du navigateur sur https://investmali-agent.abdatytch.com
fetch('/api/v1/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Si cette commande fonctionne sans erreur CORS, le problème est résolu !
