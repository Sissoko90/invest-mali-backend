# Vérification du Déploiement - Application Agent

## ✅ Actions Effectuées

1. **Build avec variables d'environnement explicites** ✅
   - `REACT_APP_USER_API_URL=https://investmali.abdatytch.com/api/v1`
   - `NODE_ENV=production`
   - Build réussi sans erreurs critiques

2. **Déploiement sur le serveur** ✅
   - Fichiers uploadés vers `/var/www/frontend/api_agent/build/`
   - Nouvelle version déployée

## 🔍 Vérifications à Effectuer

### 1. Test de l'Application Agent

**URL à tester :** `https://investmali-agent.abdatytch.com`

### 2. Vérifications dans la Console du Navigateur

Ouvrir les outils de développement (F12) et vérifier :

#### ✅ **Signes de Succès**
- **Pas d'erreurs `ERR_CONNECTION_REFUSED`**
- **Requêtes vers `https://investmali.abdatytch.com/api/v1`** (pas localhost:8080)
- **Chargement des entreprises sans erreur**
- **Notifications chat fonctionnelles**

#### ❌ **Signes de Problème**
- Erreurs `GET http://localhost:8080/...`
- Messages `ERR_CONNECTION_REFUSED`
- Erreurs CORS

### 3. Test des Fonctionnalités

1. **Connexion Agent** ✅
2. **Chargement des demandes** ✅
3. **Détails d'une entreprise** ✅
4. **Documents d'entreprise** ✅
5. **Notifications chat** ✅

## 🛠️ Si le Problème Persiste

### Vérifier la Configuration du Serveur Web

Le serveur web (Nginx/Apache) doit servir les fichiers depuis :
```
/var/www/frontend/api_agent/build/
```

### Configuration Nginx Recommandée

```nginx
server {
    listen 80;
    server_name investmali-agent.abdatytch.com;
    
    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name investmali-agent.abdatytch.com;
    
    # Certificats SSL
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Dossier de l'application
    root /var/www/frontend/api_agent/build;
    index index.html;
    
    # Configuration SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache des assets statiques
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔧 Commandes de Diagnostic

### Sur le serveur (SSH)

```bash
# Vérifier les fichiers déployés
ls -la /var/www/frontend/api_agent/build/

# Vérifier le contenu du fichier principal
grep -r "localhost:8080" /var/www/frontend/api_agent/build/

# Vérifier la configuration Nginx
nginx -t
systemctl status nginx
```

### Localement

```bash
# Vérifier le build local
grep -r "localhost:8080" build/

# Rebuild si nécessaire
.\build-production.cmd
```

## 📋 Checklist de Vérification

- [ ] Application accessible sur `https://investmali-agent.abdatytch.com`
- [ ] Pas d'erreurs `localhost:8080` dans la console
- [ ] Requêtes API vers `https://investmali.abdatytch.com/api/v1`
- [ ] Chargement des détails d'entreprise
- [ ] Chargement des documents
- [ ] Notifications chat fonctionnelles
- [ ] Pas d'erreurs CORS

## 🎯 Résultat Attendu

Après cette correction, l'application agent devrait :
- ✅ Se connecter au bon backend API
- ✅ Charger toutes les données sans erreur
- ✅ Fonctionner complètement en production
- ✅ Plus d'erreurs `ERR_CONNECTION_REFUSED`

## 📞 Support

Si le problème persiste après ces vérifications :
1. Vérifier les logs du serveur web
2. Confirmer que le backend est accessible
3. Tester la connectivité réseau
4. Vérifier la configuration CORS du backend
