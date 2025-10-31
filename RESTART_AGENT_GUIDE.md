# Guide de Redémarrage - Application Agent

## ✅ Problème Résolu

L'erreur `ERR_CONNECTION_REFUSED` a été corrigée en configurant la bonne URL API dans le fichier `.env` de l'application agent.

## 🔧 Corrections Appliquées

1. **Fichier `.env.production` mis à jour** avec la configuration complète
2. **Fichier `.env` créé** en copiant `.env.production`
3. **URL API corrigée** : `https://investmali.abdatytch.com/api/v1`

## 🚀 Étapes de Redémarrage

### 1. Arrêter l'application agent actuelle
Si l'application agent est en cours d'exécution, arrêtez-la avec `Ctrl+C`.

### 2. Aller dans le répertoire agent
```bash
cd frontend\investmali-agent
```

### 3. Vérifier la configuration
```bash
# Vérifier que le fichier .env existe et contient la bonne URL
type .env
```

**Contenu attendu :**
```env
REACT_APP_USER_API_URL=https://investmali.abdatytch.com/api/v1
REACT_APP_DEBUG_API=false
NODE_ENV=production
GENERATE_SOURCEMAP=false
PORT=3001
REACT_APP_API_TIMEOUT=30000
REACT_APP_CREATE_CLIENT_APP_PATH=/agent/applications,/applications
```

### 4. Redémarrer l'application
```bash
npm start
```

## 🔍 Vérifications Post-Redémarrage

Après le redémarrage, vérifiez dans la console du navigateur :

### ✅ Signes de Succès
- **Pas d'erreurs `ERR_CONNECTION_REFUSED`**
- **Logs de configuration** (si debug activé) :
  ```
  🔧 Agent API Configuration
  Base URL: https://investmali.abdatytch.com/api/v1
  ```
- **Chargement des entreprises** sans erreur
- **Notifications chat** fonctionnelles

### ❌ Signes de Problème
- Erreurs `ERR_CONNECTION_REFUSED` persistantes
- Erreurs `Failed to fetch`
- Messages d'erreur de connexion

## 🌐 URLs Testées

L'application agent fera maintenant des appels vers :
- `https://investmali.abdatytch.com/api/v1/chat/conversations/active`
- `https://investmali.abdatytch.com/api/v1/entreprises/{id}`
- `https://investmali.abdatytch.com/api/v1/documents/entreprise/{id}`

## 🔧 Dépannage

### Si les erreurs persistent :

1. **Vérifier le fichier .env** :
   ```bash
   type .env
   ```

2. **Recréer le fichier .env** :
   ```bash
   copy .env.production .env
   ```

3. **Redémarrer complètement** :
   ```bash
   # Arrêter l'application (Ctrl+C)
   # Puis redémarrer
   npm start
   ```

4. **Vider le cache du navigateur** :
   - Ouvrir les outils de développement (F12)
   - Clic droit sur le bouton de rechargement
   - Sélectionner "Vider le cache et recharger"

### Si le backend n'est pas accessible :

Le backend peut avoir des problèmes temporaires. Vérifiez :
- Le serveur backend est-il démarré ?
- Y a-t-il des erreurs dans les logs du backend ?
- La configuration CORS est-elle correcte ?

## 📝 Commandes Rapides

```bash
# Navigation vers le répertoire agent
cd frontend\investmali-agent

# Vérification de la configuration
type .env

# Redémarrage de l'application
npm start
```

## 🎯 Résultat Attendu

Après ces étapes, l'application agent devrait :
- ✅ Se connecter au backend de production
- ✅ Charger les détails des entreprises
- ✅ Afficher les notifications sans erreur
- ✅ Permettre la gestion des documents
- ✅ Fonctionner sans erreurs `ERR_CONNECTION_REFUSED`

## 📞 Support

Si le problème persiste après ces étapes, vérifiez :
1. La connectivité réseau
2. L'état du serveur backend
3. Les logs du navigateur pour d'autres erreurs
