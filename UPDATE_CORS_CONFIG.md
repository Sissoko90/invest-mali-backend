# Mise à jour Configuration CORS - Application Agent

## 🎯 Objectif

Ajouter l'URL de l'application agent déployée (`https://investmali-agent.abdatytch.com`) à la configuration CORS du backend pour autoriser les requêtes cross-origin.

## 🔍 URL de l'Application Agent

**URL Agent Déployée :** `https://investmali-agent.abdatytch.com/agent-login`
**Domaine à autoriser :** `https://investmali-agent.abdatytch.com`

## 📝 Configuration CORS Actuelle

Le backend utilise la variable d'environnement `app.cors.allowed-origins` dans `SecurityConfig.java` :

```java
@Value("${app.cors.allowed-origins:}")
private String allowedOrigins;
```

## 🛠️ Mise à jour Requise

### Option 1: Modifier application.yml (Recommandée)

Ajouter ou mettre à jour dans `src/main/resources/application.yml` :

```yaml
app:
  cors:
    allowed-origins: >
      https://investmali.abdatytch.com,
      https://investmali-agent.abdatytch.com
```

### Option 2: Variable d'environnement système

```bash
# Windows (PowerShell)
$env:APP_CORS_ALLOWED_ORIGINS="https://investmali.abdatytch.com,https://investmali-agent.abdatytch.com"

# Linux/Mac
export APP_CORS_ALLOWED_ORIGINS="https://investmali.abdatytch.com,https://investmali-agent.abdatytch.com"
```

### Option 3: Paramètre JVM au démarrage

```bash
java -jar api-invest.jar --app.cors.allowed-origins="https://investmali.abdatytch.com,https://investmali-agent.abdatytch.com"
```

## 🌐 URLs à Autoriser

Configuration complète recommandée :

```yaml
app:
  cors:
    allowed-origins: >
      https://investmali.abdatytch.com,
      https://investmali-agent.abdatytch.com
```

**Explication :**
- `https://investmali.abdatytch.com` - Application utilisateur en production
- `https://investmali-agent.abdatytch.com` - Application agent en production

## 🔧 Vérification de la Configuration

Après mise à jour, vérifiez dans les logs du backend au démarrage :

```
🌐 CORS - Origines configurées: [https://investmali.abdatytch.com, https://investmali-agent.abdatytch.com]
```

## 🚀 Redémarrage Requis

Après modification de `application.yml`, redémarrez le backend :

```bash
# Arrêter le backend (Ctrl+C)
# Puis redémarrer
./mvnw spring-boot:run
```

## 🧪 Test de Connectivité

Pour tester si CORS fonctionne, ouvrez la console du navigateur sur `https://investmali-agent.abdatytch.com` et vérifiez :

### ✅ Signes de Succès
- Pas d'erreurs CORS dans la console
- Requêtes API réussies vers `https://investmali.abdatytch.com/api/v1`
- Chargement des données sans erreur

### ❌ Signes de Problème CORS
```
Access to fetch at 'https://investmali.abdatytch.com/api/v1/...' from origin 'https://investmali-agent.abdatytch.com' has been blocked by CORS policy
```

## 🔍 Dépannage CORS

### 1. Vérifier la configuration
```bash
# Vérifier que la variable est bien définie
echo $APP_CORS_ALLOWED_ORIGINS
```

### 2. Vérifier les logs backend
Rechercher dans les logs :
```
🌐 CORS - Origines configurées: [...]
```

### 3. Test direct avec curl
```bash
curl -H "Origin: https://investmali-agent.abdatytch.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://investmali.abdatytch.com/api/v1/health
```

## 📋 Configuration Complète Recommandée

**Fichier `application.yml` :**

```yaml
server:
  port: 8080

app:
  cors:
    allowed-origins: >
      http://localhost:3000,
      http://localhost:3001,
      https://investmali.abdatytch.com,
      https://investmali-agent.abdatytch.com

# Autres configurations...
```

## ⚠️ Notes de Sécurité

1. **Éviter les wildcards** (`*`) en production avec `allowCredentials: true`
2. **Lister explicitement** tous les domaines autorisés
3. **Utiliser HTTPS** pour tous les domaines de production
4. **Vérifier régulièrement** les origines autorisées

## 🎯 Résultat Attendu

Après cette configuration :
- ✅ L'application agent peut faire des requêtes vers l'API backend
- ✅ Plus d'erreurs CORS dans la console
- ✅ Fonctionnalités complètes de l'application agent
- ✅ Sécurité maintenue avec origines explicites
