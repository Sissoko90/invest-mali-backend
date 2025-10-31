# Configuration Production - API-Invest

## ✅ Configuration Terminée

### 🌐 URLs de Production
- **Application Utilisateur :** `https://investmali.abdatytch.com`
- **Application Agent :** `https://investmali-agent.abdatytch.com`
- **API Backend :** `https://investmali.abdatytch.com/api/v1`

### 📱 Configuration Frontend Agent

**Fichier `.env` configuré avec :**
```env
REACT_APP_USER_API_URL=https://investmali.abdatytch.com/api/v1
REACT_APP_DEBUG_API=false
NODE_ENV=production
GENERATE_SOURCEMAP=false
PORT=3001
REACT_APP_API_TIMEOUT=30000
```

### 🔧 Configuration CORS Backend Requise

**À ajouter dans `src/main/resources/application.yml` :**
```yaml
app:
  cors:
    allowed-origins: >
      https://investmali.abdatytch.com,
      https://investmali-agent.abdatytch.com
```

## 🚀 Étapes de Déploiement

### 1. Application Agent (✅ FAIT)
```bash
cd frontend/investmali-agent
npm start
```

### 2. Backend Spring Boot (À FAIRE)
1. **Mettre à jour `application.yml`** avec la configuration CORS ci-dessus
2. **Redémarrer le backend :**
   ```bash
   ./mvnw spring-boot:run
   ```

## 🔍 Vérifications Post-Déploiement

### ✅ Application Agent
- Accessible sur `https://investmali-agent.abdatytch.com`
- Pas d'erreurs `ERR_CONNECTION_REFUSED`
- Connexion réussie à l'API backend

### ✅ Application Utilisateur  
- Accessible sur `https://investmali.abdatytch.com`
- Fonctionnalités complètes

### ✅ API Backend
- Répond aux requêtes des deux applications
- Configuration CORS correcte
- Logs confirmant les origines autorisées

## 📋 Checklist de Déploiement

- [x] Configuration `.env` agent mise à jour
- [x] URLs de production configurées
- [x] Script de déploiement créé
- [ ] Configuration CORS backend appliquée
- [ ] Backend redémarré
- [ ] Tests de connectivité effectués

## 🛠️ Fichiers Créés/Modifiés

### Fichiers de Configuration
- `frontend/investmali-agent/.env.production` ✅
- `frontend/investmali-agent/.env` ✅ (copié depuis .env.production)
- `cors-production.yml` ✅ (configuration CORS prête)

### Scripts et Documentation
- `deploy-production.cmd` ✅
- `update-cors-config.ps1` ✅
- `UPDATE_CORS_CONFIG.md` ✅
- `PRODUCTION_CONFIG_SUMMARY.md` ✅

## 🎯 Résultat Attendu

Après application complète :
- ✅ **Application Agent** : Fonctionne sans erreurs de connexion
- ✅ **Application Utilisateur** : Accessible et fonctionnelle
- ✅ **API Backend** : Autorise les requêtes des deux domaines
- ✅ **CORS** : Configuré pour production uniquement
- ✅ **Sécurité** : Origines explicites, pas de wildcards

## 📞 Support

En cas de problème :
1. Vérifier les logs du backend pour les erreurs CORS
2. Confirmer que `application.yml` contient la bonne configuration
3. Tester la connectivité avec les outils de développement du navigateur
4. Vérifier que le backend est accessible depuis les deux domaines

---

**Configuration optimisée pour la production avec seulement les deux URLs requises :**
- `https://investmali.abdatytch.com`
- `https://investmali-agent.abdatytch.com`
