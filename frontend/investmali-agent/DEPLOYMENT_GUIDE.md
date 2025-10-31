# Guide de déploiement - InvestMali Agent

## 🔧 Configuration identique au User

L'agent utilise maintenant **exactement la même configuration** que le user qui fonctionne.

### ✅ **Fichiers corrigés :**

1. **api.config.ts** : Configuration identique au user
2. **api.ts** : Suppression de WITH_CREDENTIALS
3. **api.fetch-legacy.js** : Syntaxe JavaScript corrigée
4. **setupProxy.js** : Désactivé en production
5. **.env.production** : Variables d'environnement correctes

### 🚀 **Étapes de déploiement :**

#### **1. Build de production**
```bash
cd frontend/investmali-agent
npm run build
```

#### **2. Variables d'environnement**
Vérifier que `.env.production` contient :
```
REACT_APP_USER_API_URL=https://investmali.abdatytch.com/api/v1
REACT_APP_DEBUG_API=false
NODE_ENV=production
```

#### **3. Configuration CORS backend**
Ajouter cette variable d'environnement au serveur :
```bash
export APP_CORS_ALLOWED_ORIGINS="https://investmali.abdatytch.com,https://investmali-agent.abdatytch.com"
```

#### **4. Redémarrer le backend**
```bash
# Redémarrer Spring Boot pour appliquer CORS
sudo systemctl restart investmali-backend
```

#### **5. Déployer l'agent**
- Copier le build vers le serveur
- Configurer nginx avec le nginx.conf fourni
- Redémarrer nginx

### 🔍 **Différences User vs Agent (maintenant identiques) :**

| Configuration | User | Agent |
|---------------|------|-------|
| **BASE_URL** | `process.env.REACT_APP_USER_API_URL` | ✅ **Identique** |
| **Proxy dev** | Aucun | ✅ **Désactivé en prod** |
| **API Service** | fetch + createApiRequest | ✅ **Identique** |
| **Variables env** | `.env.production` | ✅ **Identique** |

### 🐛 **Debugging :**

Si l'agent ne fonctionne toujours pas :

1. **Vérifier les logs navigateur** : F12 → Console
2. **Vérifier CORS** : Chercher "blocked by CORS policy"
3. **Vérifier l'URL API** : Console → Network → Voir les requêtes
4. **Tester l'endpoint** : `curl https://investmali.abdatytch.com/api/v1/health`

### 📝 **Checklist finale :**

- [ ] Build agent terminé sans erreur
- [ ] Variables d'environnement correctes
- [ ] CORS configuré côté backend
- [ ] Backend redémarré
- [ ] Agent redéployé
- [ ] Test de connexion réussi

### 🎯 **Résultat attendu :**

L'agent devrait maintenant fonctionner **exactement comme le user** car ils utilisent la même configuration API et les mêmes mécanismes de requête.
